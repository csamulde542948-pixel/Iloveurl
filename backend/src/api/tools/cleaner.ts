import { Router, Request, Response } from 'express';
import { supabase } from '../../lib/supabase';
import { sendUrlValidationError, validatePublicHttpUrl } from '../../lib/urlGuardrails';
import { authorizeToolRequest } from '../../lib/credits';

const router = Router();

const TRACKING_PARAMS = [
  'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', // Google Analytics
  'fbclid', // Facebook
  'gclid', '_ga', // Google Ads
  'ttclid', // TikTok
  'twclid', // Twitter
  'igshid', // Instagram
  'mc_eid', // Mailchimp
  'msclkid', // Microsoft Ads
  'yclid', // Yandex
];

router.post('/cleaner', async (req: Request, res: Response) => {
  const { url, userId } = req.body;

  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }
  const validatedUrl = validatePublicHttpUrl(url);
  if (sendUrlValidationError(res, validatedUrl)) return;
  const safeUrl = validatedUrl.url;

  let taskId: string | null = null;

  try {
    const auth = await authorizeToolRequest(req, res, {
      toolType: 'url-cleaner',
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
          type: 'url-cleaner',
          status: 'processing',
          payload: { url: safeUrl, credits: auth.credits },
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
        console.log(`[BACKGROUND] Cleaning URL: ${safeUrl} (Task: ${taskId})`);

        const parsedUrl = new URL(safeUrl);
        const params = new URLSearchParams(parsedUrl.search);
        const removedParams: string[] = [];

        // Check and remove known tracking parameters
        for (const param of TRACKING_PARAMS) {
          if (params.has(param)) {
            removedParams.push(param);
            params.delete(param);
          }
        }

        parsedUrl.search = params.toString();
        const cleanedUrl = parsedUrl.toString();

        const resultData = {
          cleanedUrl,
          originalUrl: safeUrl,
          removedParams,
          title: 'URL Clean Report'
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
    console.error('URL Cleaning Initialization Error:', err);
    return res.status(500).json({ error: 'Failed to initialize cleaning' });
  }
});

export default router;
