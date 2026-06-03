import { Router, Request, Response } from 'express';
import { supabase } from '../../lib/supabase';
import { scrapeUrlMetadata } from '../../lib/metadata';
import { sendUrlValidationError, validatePublicHttpUrl } from '../../lib/urlGuardrails';
import { authorizeToolRequest } from '../../lib/credits';

const router = Router();

// Endpoint to extract meta tags using Firecrawl
router.post('/metatags', async (req: Request, res: Response) => {
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
      toolType: 'meta-tags',
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
          type: 'meta-tags',
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
        console.log(`[BACKGROUND] Extracting meta tags for: ${safeUrl} (Task: ${taskId})`);

        const metadata = await scrapeUrlMetadata(safeUrl);
        const result = {
          ...metadata,
          metaTags: [
            { name: 'title', content: metadata.title },
            { name: 'description', content: metadata.description },
            { property: 'og:title', content: metadata.ogTitle || metadata.title },
            { property: 'og:description', content: metadata.ogDescription || metadata.description },
            { property: 'og:image', content: metadata.ogImage },
            { property: 'og:url', content: metadata.url },
            { property: 'og:type', content: metadata.type },
            { name: 'twitter:card', content: metadata.twitterCard || 'summary_large_image' },
          ].filter((tag) => tag.content),
          title: 'Meta Tags',
        };

        // Update the task in Supabase
        if (taskId) {
          await supabase
            .from('tasks')
            .update({
              status: 'completed',
              result: result
            })
            .eq('id', taskId);
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
    console.error('Meta Tags Initialization Error:', err);
    return res.status(500).json({ error: 'Failed to initialize meta tags extraction' });
  }
});

export default router;
