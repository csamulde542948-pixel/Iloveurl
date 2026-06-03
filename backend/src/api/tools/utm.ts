import { Router, Request, Response } from 'express';
import { supabase } from '../../lib/supabase';
import { sendUrlValidationError, validatePublicHttpUrl } from '../../lib/urlGuardrails';
import { authorizeToolRequest } from '../../lib/credits';

const router = Router();

router.post('/utm', async (req: Request, res: Response) => {
  const { url, userId, utm } = req.body;

  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }
  const validatedUrl = validatePublicHttpUrl(url);
  if (sendUrlValidationError(res, validatedUrl)) return;
  const safeUrl = validatedUrl.url;

  let taskId: string | null = null;

  try {
    const auth = await authorizeToolRequest(req, res, {
      toolType: 'utm-manager',
      userId,
      metadata: { url: safeUrl },
    });
    if (!auth.ok) return;

    // 0. Initialize Task in Supabase (Immediate UX feedback)
    const { data: initialTask, error: initialError } = await supabase
      .from('tasks')
      .insert([
        {
          user_id: auth.userId,
          type: 'utm-manager',
          status: 'processing',
          payload: { url: safeUrl, utm, credits: auth.credits },
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
        console.log(`[BACKGROUND] Generating UTM for: ${safeUrl} (Task: ${taskId})`);

        const parsedUrl = new URL(safeUrl);

        // Append standard UTM parameters if provided
        if (utm?.source) parsedUrl.searchParams.set('utm_source', utm.source);
        if (utm?.medium) parsedUrl.searchParams.set('utm_medium', utm.medium);
        if (utm?.campaign) parsedUrl.searchParams.set('utm_campaign', utm.campaign);
        if (utm?.term) parsedUrl.searchParams.set('utm_term', utm.term);
        if (utm?.content) parsedUrl.searchParams.set('utm_content', utm.content);

        const generatedUrl = parsedUrl.toString();

        const resultData = { 
          generatedUrl, 
          originalUrl: safeUrl, 
          utm,
          title: 'UTM URL Generated'
        };

        // Update the task in Supabase
        if (taskId) {
          await supabase
            .from('tasks')
            .update({
              status: 'completed',
              result: resultData
            })
            .eq('id', taskId);
        }
        console.log(`[BACKGROUND] Task ${taskId} completed successfully.`);
      } catch (err: any) {
        console.error(`[BACKGROUND ERROR] Task ${taskId}:`, err);
        if (taskId) {
          await supabase
            .from('tasks')
            .update({ status: 'failed', result: { error: err.message || 'Invalid URL provided' } })
            .eq('id', taskId);
        }
      }
    })();
  } catch (err: any) {
    console.error('UTM Initialization Error:', err);
    return res.status(500).json({ error: 'Failed to initialize UTM generation' });
  }
});

export default router;
