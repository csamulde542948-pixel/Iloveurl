import { Router, Request, Response } from 'express';
import FirecrawlApp from '@mendable/firecrawl-js';
import { supabase } from '../../lib/supabase';
import { runAiWorkflow } from '../../lib/aiWorkflow';
import { resolveWorkflow } from '../../lib/workflows';
import { buildSummaryWorkflowContext } from '../../lib/workflows/context/summaryContext';
import { sendUrlValidationError, validatePublicHttpUrl } from '../../lib/urlGuardrails';
import { authorizeToolRequest, completeToolRunTask } from '../../lib/credits';
import { getFirecrawlApiKey } from '../../lib/config';

const router = Router();

router.post('/studynotes', async (req: Request, res: Response) => {
  const { url, userId, model, mode } = req.body;

  if (!url) return res.status(400).json({ error: 'URL is required' });
  const validatedUrl = validatePublicHttpUrl(url);
  if (sendUrlValidationError(res, validatedUrl)) return;
  const safeUrl = validatedUrl.url;

  let taskId: string | null = null;

  try {
    const workflow = resolveWorkflow({ workflowId: 'study-notes', requestedMode: mode });
    const auth = await authorizeToolRequest(req, res, {
      toolType: 'study-notes',
      userId,
      mode: workflow.mode,
      metadata: { url: safeUrl },
    });
    if (!auth.ok) return;

    const { data: initialTask, error: initialError } = await supabase
      .from('tasks')
      .insert([{
        user_id: auth.userId,
        type: 'study-notes',
        status: 'processing',
        payload: { url: safeUrl, mode: workflow.mode, credits: auth.credits },
      }])
      .select('id')
      .single();

    if (!initialError && initialTask) taskId = initialTask.id;
    res.status(202).json({ taskId });

    (async () => {
      try {
        const firecrawlKey = getFirecrawlApiKey();

        if (!firecrawlKey) {
          if (taskId) await supabase.from('tasks').update({ status: 'failed', result: { error: 'Firecrawl API key is not configured' } }).eq('id', taskId);
          return;
        }

        const firecrawl = new FirecrawlApp({ apiKey: firecrawlKey });
        const scrapeResponse = await firecrawl.scrape(safeUrl, { formats: ['markdown'] }) as any;

        if (!scrapeResponse || (!scrapeResponse.markdown && !scrapeResponse.success)) {
          if (taskId) await supabase.from('tasks').update({ status: 'failed', result: { error: scrapeResponse?.error || 'Failed to extract content' } }).eq('id', taskId);
          return;
        }

        const markdown = scrapeResponse.markdown || '';
        if (!markdown || markdown.length < 100) {
          if (taskId) await supabase.from('tasks').update({ status: 'failed', result: { error: 'The page does not contain enough readable content to create study notes.' } }).eq('id', taskId);
          return;
        }

        const studyContext = buildSummaryWorkflowContext({
          url: safeUrl,
          metadata: scrapeResponse.metadata || {},
          markdown,
          budget: workflow.budget,
        });

        let masResult;
        try {
          masResult = await runAiWorkflow({
            url: safeUrl,
            tool_type: workflow.toolType,
            workflow_id: workflow.id,
            mode: workflow.mode,
            firecrawl_access: workflow.firecrawlAccess,
            budget: workflow.budget,
            task_id: taskId,
            user_id: auth.userId,
            model,
            payload: studyContext,
          });
        } catch (masErr: any) {
          console.error('Study Notes MAS Service Critical Error:', masErr);
          if (taskId) await supabase.from('tasks').update({ status: 'failed', result: { error: 'The AI agent service is currently unavailable. Please try again later.' } }).eq('id', taskId);
          return;
        }

        const resultData = {
          summary: masResult.summary,
          title: `Study Notes - ${studyContext.title}`,
          url: safeUrl,
          studyContext,
          usage: {
            workflowId: workflow.id,
            mode: workflow.mode,
            modelPolicy: workflow.modelPolicy,
            firecrawlAccess: workflow.firecrawlAccess,
            tokens: masResult.tokens,
            adkToolCalls: masResult.toolCalls,
            backendFirecrawlCalls: 1,
          },
        };

        if (taskId) {
          await completeToolRunTask({
            taskId,
            result: resultData,
            userId: auth.userId,
            toolType: workflow.toolType,
            mode: workflow.mode,
            credits: auth.credits,
            metadata: { url: safeUrl, workflowId: workflow.id },
          });
        }
      } catch (err: any) {
        console.error(`[BACKGROUND ERROR] Study notes task ${taskId}:`, err);
        if (taskId) await supabase.from('tasks').update({ status: 'failed', result: { error: err.message || 'Internal background error' } }).eq('id', taskId);
      }
    })();
  } catch (err: any) {
    console.error('Study Notes Initialization Error:', err);
    return res.status(500).json({ error: 'Failed to initialize study notes' });
  }
});

export default router;
