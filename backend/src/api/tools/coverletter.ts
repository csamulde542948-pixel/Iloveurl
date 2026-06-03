import { Router, Request, Response } from 'express';
import FirecrawlApp from '@mendable/firecrawl-js';
import { supabase } from '../../lib/supabase';
import { FirecrawlAccess, WorkflowMode, runAiWorkflow } from '../../lib/aiWorkflow';
import { extractResumeText, resumeUpload, textField } from '../../lib/resumeUpload';
import { saveResumeProfile } from '../../lib/resumeProfile';
import { sendUrlValidationError, validatePublicHttpUrl } from '../../lib/urlGuardrails';
import { authorizeToolRequest, completeToolRunTask } from '../../lib/credits';
import { getFirecrawlApiKey } from '../../lib/config';

const router = Router();

function normalizeMode(_mode: unknown): WorkflowMode {
  return 'standard';
}

// Endpoint to generate a cover letter from a job URL and user context
router.post('/coverletter', resumeUpload.single('resumeFile'), async (req: Request, res: Response) => {
  const url = textField(req.body.url);
  const context = textField(req.body.context || req.body.resumeText);
  const userId = textField(req.body.userId);
  const model = textField(req.body.model);
  const mode = textField(req.body.mode);
  const shouldSaveResumeProfile = textField(req.body.saveResumeProfile) === 'true';

  if (!url) {
    return res.status(400).json({ error: 'Job URL is required' });
  }
  const validatedUrl = validatePublicHttpUrl(url, { fieldName: 'Job URL' });
  if (sendUrlValidationError(res, validatedUrl)) return;
  const safeUrl = validatedUrl.url;

  let uploadedResumeText = '';
  try {
    uploadedResumeText = await extractResumeText(req.file);
  } catch (error: any) {
    return res.status(400).json({ error: error.message || 'Could not read resume file' });
  }

  const candidateContext = [context, uploadedResumeText].filter(Boolean).join('\n\n').trim();
  if (candidateContext.length < 80) {
    return res.status(400).json({ error: 'Paste or upload your resume before generating a cover letter.' });
  }

  const workflowMode = normalizeMode(mode);
  const auth = await authorizeToolRequest(req, res, {
    toolType: 'cover-letter',
    userId,
    mode: workflowMode,
    metadata: { url: safeUrl, resumeSource: req.file ? 'upload' : 'pasted_text' },
  });
  if (!auth.ok) return;

  if (shouldSaveResumeProfile && auth.userId) {
    await saveResumeProfile({
      userId: auth.userId,
      resumeText: candidateContext,
      source: context && uploadedResumeText ? 'mixed' : req.file ? 'upload' : 'pasted_text',
      fileName: req.file?.originalname || null,
      file: req.file,
    });
  }

  let taskId: string | null = null;

  try {
    // 0. Initialize Task in Supabase (Immediate UX feedback)
    const { data: initialTask, error: initialError } = await supabase
      .from('tasks')
      .insert([
        {
          user_id: auth.userId,
          type: 'cover-letter',
          status: 'processing',
          payload: {
            url: safeUrl,
            mode: workflowMode,
            resumeSource: req.file ? 'upload' : 'pasted_text',
            resumeFileName: req.file?.originalname || null,
            credits: auth.credits,
          },
        }
      ])
      .select('id')
      .single();

    if (!initialError && initialTask) {
      taskId = initialTask.id;
    }

    // --- IMMEDIATE RESPONSE ---
    res.status(202).json({ taskId });

    // --- BACKGROUND PROCESSING ---
    (async () => {
      try {
        const firecrawlKey = getFirecrawlApiKey();

        if (!firecrawlKey) {
          if (taskId) {
            await supabase.from('tasks').update({ status: 'failed', result: { error: 'Firecrawl API key is not configured' } }).eq('id', taskId);
          }
          return;
        }

        const firecrawl = new FirecrawlApp({ apiKey: firecrawlKey });

        console.log(`[BACKGROUND] Generating cover letter for: ${url} (Task: ${taskId})`);

        // 1. Scrape job details using Firecrawl
        const scrapeResponse = (await firecrawl.scrape(safeUrl, {
          formats: ['markdown'],
        })) as any;

        if (!scrapeResponse || (!scrapeResponse.markdown && !scrapeResponse.success)) {
          if (taskId) {
            await supabase.from('tasks').update({ status: 'failed', result: { error: scrapeResponse?.error || 'Failed to extract job details' } }).eq('id', taskId);
          }
          return;
        }

        const jobDescription = scrapeResponse.markdown || '';
        const jobTitle = scrapeResponse.metadata?.title || 'Job';

        const firecrawlAccess: FirecrawlAccess = workflowMode === 'deep' ? 'limited' : 'disabled';
        let masResult;

        try {
          masResult = await runAiWorkflow({
            url: safeUrl,
            tool_type: 'cover-letter',
            workflow_id: 'cover-letter',
            mode: workflowMode,
            firecrawl_access: firecrawlAccess,
            budget: workflowMode === 'deep'
              ? { maxScrapes: 3, maxMaps: 1, maxCrawls: 0, maxInputChars: 25000, maxModelSteps: 2 }
              : { maxScrapes: 1, maxMaps: 0, maxCrawls: 0, maxInputChars: workflowMode === 'quick' ? 8000 : 18000, maxModelSteps: workflowMode === 'quick' ? 1 : 2 },
            task_id: taskId,
            user_id: auth.userId,
            model,
            payload: {
              jobTitle,
              jobDescription: jobDescription.substring(0, workflowMode === 'quick' ? 8000 : 18000),
              userContext: candidateContext.substring(0, workflowMode === 'quick' ? 8000 : 18000),
              resumeSource: req.file ? 'uploaded_resume' : 'saved_or_pasted_resume',
              resumeFileName: req.file?.originalname || null,
            }
          });
        } catch (masErr: any) {
          console.error("MAS Service Critical Error:", masErr);
          if (taskId) {
            await supabase.from('tasks').update({ status: 'failed', result: { error: 'The AI agent service is currently unavailable. Please try again later.' } }).eq('id', taskId);
          }
          return;
        }

        const resultData = {
          summary: masResult.summary,
          title: `Cover Letter - ${jobTitle}`,
          url: safeUrl,
          usage: {
            workflowId: 'cover-letter',
            mode: workflowMode,
            firecrawlAccess,
            tokens: masResult.tokens,
            adkToolCalls: masResult.toolCalls,
            backendFirecrawlCalls: 1
          }
        };

        // Update the task in Supabase
        if (taskId) {
          await completeToolRunTask({
            taskId,
            result: resultData,
            userId: auth.userId,
            toolType: 'cover-letter',
            mode: workflowMode,
            credits: auth.credits,
            metadata: { url: safeUrl },
          });
        }
        console.log(`[BACKGROUND] Task ${taskId} completed successfully.`);
      } catch (err: any) {
        console.error(`[BACKGROUND ERROR] Task ${taskId}:`, err);
        if (taskId) {
          await supabase
            .from('tasks')
            .update({ status: 'failed', result: { error: err.message || 'Internal background error' } })
            .eq('id', taskId);
        }
      }
    })();
  } catch (err: any) {
    console.error('Cover Letter Initialization Error:', err);
    return res.status(500).json({ error: 'Failed to initialize cover letter generation' });
  }
});

export default router;
