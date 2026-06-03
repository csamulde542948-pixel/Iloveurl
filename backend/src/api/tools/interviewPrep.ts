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

router.post('/interview-prep', resumeUpload.single('resumeFile'), async (req: Request, res: Response) => {
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
    return res.status(400).json({ error: 'Paste, upload, or reuse your saved resume before building an interview prep pack.' });
  }

  const workflowMode = normalizeMode(mode);
  const auth = await authorizeToolRequest(req, res, {
    toolType: 'interview-prep',
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
          type: 'interview-prep',
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
    if (initialError || !taskId) {
      console.error('Interview Prep Task Insert Error:', initialError);
      return res.status(500).json({ error: 'Failed to create interview prep task' });
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
        console.log(`[BACKGROUND] Building interview prep pack for: ${url} (Task: ${taskId})`);

        const scrapeResponse = (await firecrawl.scrape(safeUrl, {
          formats: ['markdown'],
        })) as any;

        if (!scrapeResponse || (!scrapeResponse.markdown && !scrapeResponse.success)) {
          await supabase.from('tasks').update({ status: 'failed', result: { error: scrapeResponse?.error || 'Failed to extract job post details' } }).eq('id', taskId);
          return;
        }

        const jobMarkdown = scrapeResponse.markdown || '';
        if (jobMarkdown.length < 100) {
          await supabase.from('tasks').update({ status: 'failed', result: { error: 'The job URL does not contain enough readable content.' } }).eq('id', taskId);
          return;
        }

        const maxInputChars = workflowMode === 'quick' ? 9000 : workflowMode === 'deep' ? 30000 : 19000;
        const firecrawlAccess: FirecrawlAccess = workflowMode === 'deep' ? 'limited' : 'disabled';

        let masResult;
        try {
          masResult = await runAiWorkflow({
            url: safeUrl,
            tool_type: 'interview-prep',
            workflow_id: 'interview-prep',
            mode: workflowMode,
            firecrawl_access: firecrawlAccess,
            budget: workflowMode === 'deep'
              ? { maxScrapes: 3, maxMaps: 1, maxCrawls: 0, maxInputChars, maxModelSteps: 2, maxOutputWords: 1500 }
              : { maxScrapes: 1, maxMaps: 0, maxCrawls: 0, maxInputChars, maxModelSteps: workflowMode === 'quick' ? 1 : 2, maxOutputWords: workflowMode === 'quick' ? 900 : 1250 },
            task_id: taskId,
            user_id: auth.userId,
            model,
            payload: {
              jobUrl: safeUrl,
              jobTitle: scrapeResponse.metadata?.title || 'Job post',
              jobMarkdown: jobMarkdown.substring(0, Math.floor(maxInputChars * 0.58)),
              resumeText: resumeText.substring(0, Math.floor(maxInputChars * 0.42)),
              resumeSource: req.file ? 'uploaded_resume' : 'saved_or_pasted_resume',
              resumeFileName: req.file?.originalname || null,
              outputGoal: 'Generate an interview preparation pack grounded only in the job post and resume.',
              safetyRules: [
                'Do not invent candidate experience, employers, dates, tools, metrics, or credentials.',
                'Do not invent company facts that are not present in the job post.',
                'When an answer needs missing candidate detail, label it as USER_DETAIL_NEEDED.',
              ],
            },
          });
        } catch (masErr: any) {
          console.error('Interview Prep MAS Service Critical Error:', masErr);
          await supabase.from('tasks').update({ status: 'failed', result: { error: 'The AI agent service is currently unavailable. Please try again later.' } }).eq('id', taskId);
          return;
        }

        const resultData = {
          summary: masResult.summary,
          title: `Interview Prep - ${scrapeResponse.metadata?.title || 'Job URL'}`,
          url: safeUrl,
          resumeProfile: {
            source: req.file ? 'upload' : 'pasted_text',
            fileName: req.file?.originalname || null,
            savedRequested: saveResumeProfile,
          },
          usage: {
            workflowId: 'interview-prep',
            mode: workflowMode,
            firecrawlAccess,
            tokens: masResult.tokens,
            adkToolCalls: masResult.toolCalls,
            backendFirecrawlCalls: 1,
          },
        };

        await completeToolRunTask({
          taskId,
          result: resultData,
          userId: auth.userId,
          toolType: 'interview-prep',
          mode: workflowMode,
          credits: auth.credits,
          metadata: { url: safeUrl },
        });
        console.log(`[BACKGROUND] Interview prep task ${taskId} completed successfully.`);
      } catch (err: any) {
        console.error(`[BACKGROUND ERROR] Interview prep task ${taskId}:`, err);
        await supabase.from('tasks').update({ status: 'failed', result: { error: err.message || 'Internal background error' } }).eq('id', taskId);
      }
    })();
  } catch (err: any) {
    console.error('Interview Prep Initialization Error:', err);
    return res.status(500).json({ error: 'Failed to initialize interview prep pack' });
  }
});

export default router;
