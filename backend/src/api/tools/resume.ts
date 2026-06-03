import { Router, Request, Response } from 'express';
import FirecrawlApp from '@mendable/firecrawl-js';
import { supabase } from '../../lib/supabase';
import { FirecrawlAccess, WorkflowMode, runAiWorkflow } from '../../lib/aiWorkflow';
import { extractResumeText, resumeUpload, textField } from '../../lib/resumeUpload';
import { saveResumeProfile as persistResumeProfile } from '../../lib/resumeProfile';
import { sendUrlValidationError, validatePublicHttpUrl } from '../../lib/urlGuardrails';
import { authorizeToolRequest, completeToolRunTask } from '../../lib/credits';
import { getFirecrawlApiKey } from '../../lib/config';

const router = Router();

function normalizeMode(_mode: unknown): WorkflowMode {
  return 'standard';
}

router.post('/resume', resumeUpload.single('resumeFile'), async (req: Request, res: Response) => {
  const url = textField(req.body.url);
  const userId = textField(req.body.userId);
  const model = textField(req.body.model);
  const mode = textField(req.body.mode);
  const pastedResume = textField(req.body.context || req.body.resumeText);
  const saveResumeProfile = textField(req.body.saveResumeProfile) === 'true';

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

  const resumeText = [pastedResume, uploadedResumeText].filter(Boolean).join('\n\n').trim();
  if (resumeText.length < 80) {
    return res.status(400).json({ error: 'Paste or upload an existing resume before matching it to the job URL.' });
  }

  const workflowMode = normalizeMode(mode);
  const auth = await authorizeToolRequest(req, res, {
    toolType: 'resume',
    userId,
    mode: workflowMode,
    metadata: { url: safeUrl, resumeSource: req.file ? 'upload' : 'pasted_text' },
  });
  if (!auth.ok) return;

  if (saveResumeProfile && auth.userId) {
    await persistResumeProfile({
      userId: auth.userId,
      resumeText,
      source: pastedResume && uploadedResumeText ? 'mixed' : req.file ? 'upload' : 'pasted_text',
      fileName: req.file?.originalname || null,
      file: req.file,
    });
  }

  let taskId: string | null = null;

  try {
    const { data: initialTask, error: initialError } = await supabase
      .from('tasks')
      .insert([
        {
          user_id: auth.userId,
          type: 'resume',
          status: 'processing',
          payload: {
            url: safeUrl,
            mode: workflowMode,
            resumeSource: req.file ? 'upload' : 'pasted_text',
            resumeFileName: req.file?.originalname || null,
            saveResumeProfile,
            credits: auth.credits,
          },
        },
      ])
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
        console.log(`[BACKGROUND] Matching resume to job URL: ${url} (Task: ${taskId})`);

        const scrapeResponse = (await firecrawl.scrape(safeUrl, {
          formats: ['markdown'],
        })) as any;

        if (!scrapeResponse || (!scrapeResponse.markdown && !scrapeResponse.success)) {
          if (taskId) await supabase.from('tasks').update({ status: 'failed', result: { error: scrapeResponse?.error || 'Failed to extract job post details' } }).eq('id', taskId);
          return;
        }

        const jobMarkdown = scrapeResponse.markdown || '';
        if (jobMarkdown.length < 100) {
          if (taskId) await supabase.from('tasks').update({ status: 'failed', result: { error: 'The job URL does not contain enough readable content.' } }).eq('id', taskId);
          return;
        }

        const maxInputChars = workflowMode === 'quick' ? 8000 : workflowMode === 'deep' ? 28000 : 18000;
        const firecrawlAccess: FirecrawlAccess = workflowMode === 'deep' ? 'limited' : 'disabled';

        let masResult;
        try {
          masResult = await runAiWorkflow({
            url: safeUrl,
            tool_type: 'resume',
            workflow_id: 'resume-match',
            mode: workflowMode,
            firecrawl_access: firecrawlAccess,
            budget: workflowMode === 'deep'
              ? { maxScrapes: 2, maxMaps: 1, maxCrawls: 0, maxInputChars, maxModelSteps: 2, maxOutputWords: 1400 }
              : { maxScrapes: 1, maxMaps: 0, maxCrawls: 0, maxInputChars, maxModelSteps: workflowMode === 'quick' ? 1 : 2, maxOutputWords: workflowMode === 'quick' ? 850 : 1200 },
            task_id: taskId,
            user_id: auth.userId,
            model,
            payload: {
              jobUrl: safeUrl,
              jobTitle: scrapeResponse.metadata?.title || 'Job post',
              jobMarkdown: jobMarkdown.substring(0, Math.floor(maxInputChars * 0.55)),
              resumeText: resumeText.substring(0, Math.floor(maxInputChars * 0.45)),
              resumeSource: req.file ? 'uploaded_resume' : 'saved_or_pasted_resume',
              resumeFileName: req.file?.originalname || null,
              safetyRules: [
                'Do not invent employers, dates, skills, education, certifications, metrics, or achievements.',
                'Only recommend keywords supported by the resume text.',
                'Mark unsupported job requirements as gaps or user-supplied details needed.',
              ],
            },
          });
        } catch (masErr: any) {
          console.error('Resume Match MAS Service Critical Error:', masErr);
          if (taskId) await supabase.from('tasks').update({ status: 'failed', result: { error: 'The AI agent service is currently unavailable. Please try again later.' } }).eq('id', taskId);
          return;
        }

        const resultData = {
          summary: masResult.summary,
          title: `Resume Match - ${scrapeResponse.metadata?.title || 'Job URL'}`,
          url: safeUrl,
          resumeProfile: {
            source: req.file ? 'upload' : 'pasted_text',
            fileName: req.file?.originalname || null,
            savedRequested: saveResumeProfile,
          },
          exportPolicy: {
            optimizedResume: 'pro',
          },
          usage: {
            workflowId: 'resume-match',
            mode: workflowMode,
            firecrawlAccess,
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
            toolType: 'resume',
            mode: workflowMode,
            credits: auth.credits,
            metadata: { url: safeUrl },
          });
        }
        console.log(`[BACKGROUND] Task ${taskId} completed successfully.`);
      } catch (err: any) {
        console.error(`[BACKGROUND ERROR] Resume match task ${taskId}:`, err);
        if (taskId) await supabase.from('tasks').update({ status: 'failed', result: { error: err.message || 'Internal background error' } }).eq('id', taskId);
      }
    })();
  } catch (err: any) {
    console.error('Resume Match Initialization Error:', err);
    return res.status(500).json({ error: 'Failed to initialize resume match' });
  }
});

export default router;
