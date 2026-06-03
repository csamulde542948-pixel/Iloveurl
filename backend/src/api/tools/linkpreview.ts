import { Router, Request, Response } from 'express';
import { supabase } from '../../lib/supabase';
import { scrapeUrlMetadata } from '../../lib/metadata';
import { sendUrlValidationError, validatePublicHttpUrl } from '../../lib/urlGuardrails';
import { authorizeToolRequest } from '../../lib/credits';

const router = Router();

router.post('/linkpreview', async (req: Request, res: Response) => {
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
      toolType: 'link-preview',
      userId,
      metadata: { url: safeUrl },
    });
    if (!auth.ok) return;

    const { data: initialTask, error: initialError } = await supabase
      .from('tasks')
      .insert([{
        user_id: auth.userId,
        type: 'link-preview',
        status: 'processing',
        payload: { url: safeUrl, credits: auth.credits },
      }])
      .select('id')
      .single();

    if (!initialError && initialTask) taskId = initialTask.id;
    res.status(202).json({ taskId });

    (async () => {
      try {
        console.log(`[BACKGROUND] Building link preview for: ${safeUrl} (Task: ${taskId})`);
        const metadata = await scrapeUrlMetadata(safeUrl);
        const resultData = {
          ...metadata,
          title: metadata.title || 'Link Preview',
          previewTitle: metadata.title,
          previewDescription: metadata.description,
          previewImage: metadata.image,
          originalUrl: safeUrl,
        };

        if (taskId) {
          await supabase
            .from('tasks')
            .update({ status: 'completed', result: resultData })
            .eq('id', taskId);
        }
      } catch (err: any) {
        console.error(`[BACKGROUND ERROR] Link preview task ${taskId}:`, err);
        if (taskId) {
          await supabase
            .from('tasks')
            .update({ status: 'failed', result: { error: err.message || 'Failed to create link preview' } })
            .eq('id', taskId);
        }
      }
    })();
  } catch (err: any) {
    console.error('Link Preview Initialization Error:', err);
    return res.status(500).json({ error: 'Failed to initialize link preview' });
  }
});

export default router;
