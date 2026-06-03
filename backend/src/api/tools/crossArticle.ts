import { Router, Request, Response } from 'express';
import FirecrawlApp from '@mendable/firecrawl-js';
import { supabase } from '../../lib/supabase';
import { FirecrawlAccess, WorkflowMode, runAiWorkflow } from '../../lib/aiWorkflow';
import { validatePublicHttpUrl } from '../../lib/urlGuardrails';
import { authorizeToolRequest, completeToolRunTask } from '../../lib/credits';
import { getFirecrawlApiKey } from '../../lib/config';

const router = Router();

function normalizeMode(_mode: unknown): WorkflowMode {
  return 'standard';
}

function normalizeUrls(input: unknown): string[] {
  const rawValues = Array.isArray(input)
    ? input
    : typeof input === 'string'
      ? input.split(/[\n,]+/)
      : [];

  return Array.from(new Set(
    rawValues
      .map((value) => String(value).trim())
      .filter(Boolean)
      .map((value) => validatePublicHttpUrl(value, { fieldName: 'Article URL' }))
      .filter((result) => result.ok)
      .map((result) => result.url)
  ));
}

function wordCount(value: string): number {
  return value.trim().split(/\s+/).filter(Boolean).length;
}

router.post('/cross-article', async (req: Request, res: Response) => {
  const urls = normalizeUrls(req.body.urls || req.body.url);
  const { userId, model, mode } = req.body;

  if (urls.length < 2) {
    return res.status(400).json({ error: 'Add at least two valid article URLs to compare.' });
  }

  if (urls.length > 4) {
    return res.status(400).json({ error: 'Cross-Article Comparison currently supports up to 4 URLs per run.' });
  }

  let taskId: string | null = null;

  try {
    const workflowMode = normalizeMode(mode);
    const auth = await authorizeToolRequest(req, res, {
      toolType: 'cross-article',
      userId,
      mode: workflowMode,
      metadata: { urls },
    });
    if (!auth.ok) return;

    const { data: initialTask, error: initialError } = await supabase
      .from('tasks')
      .insert([
        {
          user_id: auth.userId,
          type: 'cross-article',
          status: 'processing',
          payload: {
            url: urls[0],
            urls,
            mode: workflowMode,
            credits: auth.credits,
          },
        },
      ])
      .select('id')
      .single();

    if (!initialError && initialTask) taskId = initialTask.id;
    if (initialError || !taskId) {
      console.error('Cross-Article Task Insert Error:', initialError);
      return res.status(500).json({ error: 'Failed to create comparison task' });
    }

    res.status(202).json({ taskId });

    (async () => {
      try {
        const firecrawlKey = getFirecrawlApiKey();

        if (!firecrawlKey) {
          await supabase.from('tasks').update({ status: 'failed', result: { error: 'Firecrawl API key is not configured' } }).eq('id', taskId);
          return;
        }

        const firecrawl = new FirecrawlApp({ apiKey: firecrawlKey });
        console.log(`[BACKGROUND] Comparing ${urls.length} articles (Task: ${taskId}) mode=${workflowMode}`);

        const scrapeResults = await Promise.allSettled(
          urls.map(async (sourceUrl, index) => {
            const response = (await firecrawl.scrape(sourceUrl, {
              formats: ['markdown'],
            })) as any;

            const markdown = response?.markdown || '';
            if (!response || (!markdown && !response.success) || markdown.length < 100) {
              throw new Error(response?.error || 'No readable article content found');
            }

            const title = response.metadata?.title || `Source ${index + 1}`;
            return {
              index: index + 1,
              url: sourceUrl,
              title,
              sourceName: response.metadata?.sourceURL || response.metadata?.ogSiteName || response.metadata?.siteName || new URL(sourceUrl).hostname,
              description: response.metadata?.description || response.metadata?.ogDescription || '',
              author: response.metadata?.author || '',
              publishedTime: response.metadata?.publishedTime || response.metadata?.articlePublishedTime || '',
              wordCount: wordCount(markdown),
              markdownExcerpt: markdown.substring(0, workflowMode === 'quick' ? 5000 : workflowMode === 'deep' ? 10000 : 7500),
            };
          })
        );

        const articles = scrapeResults
          .filter((result): result is PromiseFulfilledResult<any> => result.status === 'fulfilled')
          .map((result) => result.value);

        const failedSources = scrapeResults
          .map((result, index) => result.status === 'rejected'
            ? { url: urls[index], error: result.reason?.message || 'Failed to scrape source' }
            : null)
          .filter(Boolean);

        if (articles.length < 2) {
          await supabase.from('tasks').update({
            status: 'failed',
            result: {
              error: 'At least two sources must have readable content for comparison.',
              failedSources,
            },
          }).eq('id', taskId);
          return;
        }

        const maxInputChars = workflowMode === 'quick' ? 12000 : workflowMode === 'deep' ? 36000 : 24000;
        const firecrawlAccess: FirecrawlAccess = 'disabled';

        let masResult;
        try {
          masResult = await runAiWorkflow({
            url: urls[0],
            tool_type: 'cross-article',
            workflow_id: 'cross-article',
            mode: workflowMode,
            firecrawl_access: firecrawlAccess,
            budget: {
              maxScrapes: urls.length,
              maxMaps: 0,
              maxCrawls: 0,
              maxInputChars,
              maxModelSteps: workflowMode === 'quick' ? 1 : 2,
              maxOutputWords: workflowMode === 'quick' ? 900 : workflowMode === 'deep' ? 1600 : 1200,
            },
            task_id: taskId,
            user_id: auth.userId,
            model,
            payload: {
              comparisonGoal: 'Compare multiple articles about the same or related topic using only scraped source evidence.',
              sourceCount: articles.length,
              requestedUrls: urls,
              failedSources,
              articles,
              safetyRules: [
                'Do not invent claims, quotes, facts, or publication details.',
                'Separate agreement, disagreement, unique claims, and missing context.',
                'If sources appear to cover different topics, say so clearly.',
              ],
            },
          });
        } catch (masErr: any) {
          console.error('Cross-Article MAS Service Critical Error:', masErr);
          await supabase.from('tasks').update({ status: 'failed', result: { error: 'The AI agent service is currently unavailable. Please try again later.' } }).eq('id', taskId);
          return;
        }

        const resultData = {
          summary: masResult.summary,
          title: `Cross-Article Comparison - ${articles.length} Sources`,
          url: urls[0],
          urls,
          articles: articles.map(({ markdownExcerpt, ...article }: any) => article),
          failedSources,
          usage: {
            workflowId: 'cross-article',
            mode: workflowMode,
            firecrawlAccess,
            tokens: masResult.tokens,
            adkToolCalls: masResult.toolCalls,
            backendFirecrawlCalls: urls.length,
            readableSources: articles.length,
          },
        };

        await completeToolRunTask({
          taskId,
          result: resultData,
          userId: auth.userId,
          toolType: 'cross-article',
          mode: workflowMode,
          credits: auth.credits,
          metadata: { urls },
        });
        console.log(`[BACKGROUND] Cross-article task ${taskId} completed successfully.`);
      } catch (err: any) {
        console.error(`[BACKGROUND ERROR] Cross-article task ${taskId}:`, err);
        await supabase.from('tasks').update({ status: 'failed', result: { error: err.message || 'Internal background error' } }).eq('id', taskId);
      }
    })();
  } catch (err: any) {
    console.error('Cross-Article Initialization Error:', err);
    return res.status(500).json({ error: 'Failed to initialize cross-article comparison' });
  }
});

export default router;
