import { Router, Request, Response } from 'express';
import FirecrawlApp from '@mendable/firecrawl-js';
import { supabase } from '../../lib/supabase';
import { runAiWorkflow } from '../../lib/aiWorkflow';
import { buildBrandWorkflowContext } from '../../lib/workflows/context/brandContext';
import { resolveWorkflow } from '../../lib/workflows';
import { sendUrlValidationError, validatePublicHttpUrl } from '../../lib/urlGuardrails';
import { authorizeToolRequest, completeToolRunTask } from '../../lib/credits';
import { getFirecrawlApiKey } from '../../lib/config';

const router = Router();

type BrandExpansionPage = {
  url: string;
  title?: string;
  markdown?: string;
  screenshot?: string;
};

function selectBrandExpansionLinks(baseUrl: string, links: string[] = [], limit: number): string[] {
  if (limit <= 0) return [];

  const base = new URL(baseUrl);
  const candidates = links
    .map((link) => {
      try {
        return new URL(link, baseUrl).toString();
      } catch {
        return null;
      }
    })
    .filter((link): link is string => Boolean(link))
    .filter((link) => {
      const parsed = new URL(link);
      return parsed.hostname === base.hostname;
    });

  const priorityPatterns = [
    /\/about\b/i,
    /\/company\b/i,
    /\/brand\b/i,
    /\/customers?\b/i,
    /\/product\b/i,
    /\/solutions?\b/i,
  ];

  return [...new Set(candidates)]
    .map((link) => ({
      link,
      score: priorityPatterns.findIndex((pattern) => pattern.test(new URL(link).pathname)),
    }))
    .filter((candidate) => candidate.score !== -1)
    .sort((a, b) => a.score - b.score)
    .slice(0, limit)
    .map((candidate) => candidate.link);
}

router.post('/brand', async (req: Request, res: Response) => {
  const { url, userId, model, mode } = req.body;

  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }
  const validatedUrl = validatePublicHttpUrl(url);
  if (sendUrlValidationError(res, validatedUrl)) return;
  const safeUrl = validatedUrl.url;

  let taskId: string | null = null;

  try {
    const workflow = resolveWorkflow({
      workflowId: 'brand-analyzer',
      requestedMode: mode,
    });
    const auth = await authorizeToolRequest(req, res, {
      toolType: 'brand-analyzer',
      userId,
      mode: workflow.mode,
      metadata: { url: safeUrl },
    });
    if (!auth.ok) return;

    const { data: initialTask, error: initialError } = await supabase
      .from('tasks')
      .insert([
        {
          user_id: auth.userId,
          type: 'brand-analyzer',
          status: 'processing',
          payload: { url: safeUrl, mode: workflow.mode, credits: auth.credits },
        },
      ])
      .select('id')
      .single();

    if (!initialError && initialTask) {
      taskId = initialTask.id;
    }

    res.status(202).json({ taskId });

    (async () => {
      try {
        const firecrawlKey = getFirecrawlApiKey();

        if (!firecrawlKey) {
          if (taskId) {
            await supabase
              .from('tasks')
              .update({ status: 'failed', result: { error: 'Firecrawl API key is not configured' } })
              .eq('id', taskId);
          }
          return;
        }

        const app = new FirecrawlApp({ apiKey: firecrawlKey });

        console.log(`[BACKGROUND] Extracting brand data for: ${safeUrl} (Task: ${taskId})`);

        const scrapeResponse = await app.scrape(safeUrl, {
          formats: ['markdown', 'branding', 'screenshot', 'links'],
          waitFor: 3000,
        }) as any;

        if (!scrapeResponse || (!scrapeResponse.branding && !scrapeResponse.success)) {
          console.error('Firecrawl Scrape Failed:', JSON.stringify(scrapeResponse, null, 2));
          if (taskId) {
            await supabase
              .from('tasks')
              .update({ status: 'failed', result: { error: scrapeResponse?.error || 'Failed to extract branding details' } })
              .eq('id', taskId);
          }
          return;
        }

        const rawBrandingData = scrapeResponse.branding || {};
        const markdownContent = scrapeResponse.markdown || '';
        const initialScreenshots = scrapeResponse.screenshots || (scrapeResponse.screenshot ? [scrapeResponse.screenshot] : []);
        const screenshots = [...initialScreenshots];
        const expansionPages: BrandExpansionPage[] = [];
        const maxScrapes = workflow.budget.maxScrapes || 1;
        const maxExpansionScrapes = workflow.mode === 'deep' ? Math.max(0, maxScrapes - 1) : 0;
        const expansionLinks = selectBrandExpansionLinks(safeUrl, scrapeResponse.links || [], maxExpansionScrapes);

        for (const expansionUrl of expansionLinks) {
          try {
            const expansionScrape = await app.scrape(expansionUrl, {
              formats: ['markdown', 'screenshot'],
              waitFor: 1000,
            }) as any;

            expansionPages.push({
              url: expansionUrl,
              title: expansionScrape.metadata?.title,
              markdown: expansionScrape.markdown || '',
              screenshot: expansionScrape.screenshot,
            });

            if (expansionScrape.screenshot) {
              screenshots.push(expansionScrape.screenshot);
            }
          } catch (error) {
            console.warn(`Expansion capture failed for ${expansionUrl}:`, error);
          }
        }

        const brandContext = buildBrandWorkflowContext({
          url: safeUrl,
          metadata: scrapeResponse.metadata || {},
          branding: rawBrandingData,
          markdown: markdownContent,
          screenshots,
          additionalPages: expansionPages,
          budget: workflow.budget,
        });

        console.log(
          `[BACKGROUND] Brand context prepared (Task: ${taskId}) mode=${workflow.mode} ` +
          `markdownChars=${brandContext.factQuality.contextBudget.markdownChars} ` +
          `screenshots=${brandContext.factQuality.contextBudget.screenshots} ` +
          `expansionPages=${brandContext.messagingSignals.additionalPages.length}`
        );

        const masResult = await runAiWorkflow({
          url: safeUrl,
          tool_type: workflow.toolType,
          workflow_id: workflow.id,
          mode: workflow.mode,
          firecrawl_access: workflow.firecrawlAccess,
          budget: workflow.budget,
          task_id: taskId,
          user_id: auth.userId,
          model,
          payload: brandContext,
        });

        const backendFirecrawlCalls = 1 + expansionPages.length;
        const extractedData = {
          brandName: brandContext.brandName,
          logoUrl: brandContext.visualIdentity.logoUrl,
          colors: brandContext.visualIdentity.colors,
          typography: brandContext.visualIdentity.typography,
          rawBranding: rawBrandingData,
          brandContext,
          summary: masResult.summary,
          screenshots,
          title: `Brand Analysis - ${brandContext.brandName}`,
          usage: {
            workflowId: workflow.id,
            mode: workflow.mode,
            modelPolicy: workflow.modelPolicy,
            firecrawlAccess: workflow.firecrawlAccess,
            tokens: masResult.tokens,
            adkToolCalls: masResult.toolCalls,
            backendFirecrawlCalls,
          },
        };

        if (taskId) {
          await completeToolRunTask({
            taskId,
            result: extractedData,
            userId: auth.userId,
            toolType: workflow.toolType,
            mode: workflow.mode,
            credits: auth.credits,
            metadata: { url: safeUrl, workflowId: workflow.id },
          });
        }
        console.log(`[BACKGROUND] Task ${taskId} completed successfully.`);
      } catch (err: any) {
        console.error(`[BACKGROUND ERROR] Task ${taskId}:`, err);
        if (taskId) {
          await supabase
            .from('tasks')
            .update({
              status: 'failed',
              result: {
                error: err.message || 'Internal background error',
                errorDetail: err.stack || String(err),
                phase: 'brand-analyzer-background',
              },
            })
            .eq('id', taskId);
        }
      }
    })();
  } catch (err: any) {
    console.error('Task Initialization Error:', err);
    return res.status(500).json({ error: 'Failed to initialize analysis' });
  }
});

export default router;
