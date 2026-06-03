import { Router, Request, Response } from 'express';
import { supabase } from '../../lib/supabase';
import { buildShortUrl, createTrackedLink, getLinkAnalytics, recordLinkEvent } from '../../lib/trackedLinks';
import { sendUrlValidationError, validatePublicHttpUrl } from '../../lib/urlGuardrails';
import { authorizeToolRequest } from '../../lib/credits';

const router = Router();

// Endpoint to create a short URL
router.post('/shorten', async (req: Request, res: Response) => {
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
      toolType: 'url-shortener',
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
          type: 'url-shortener',
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
        console.log(`[BACKGROUND] Shortening URL: ${safeUrl} (Task: ${taskId})`);

        const { slug } = await createTrackedLink({
          originalUrl: safeUrl,
          userId: auth.userId,
          source: 'short_link',
          metadata: { tool: 'url-shortener' },
        });
        const shortUrl = buildShortUrl(req, slug);

        const resultData = {
          shortUrl,
          originalUrl: safeUrl,
          slug: slug,
          analyticsUrl: `/api/tools/shorten/${slug}/analytics`,
          analytics: {
            totalClicks: 0,
            uniqueVisitors: 0,
            source: 'short_link',
          },
          title: 'Short Link'
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
            .update({ status: 'failed', result: { error: err.message || 'Internal background error' } })
            .eq('id', taskId);
        }
      }
    })();
  } catch (err: any) {
    console.error('URL Shortener Initialization Error:', err);
    return res.status(500).json({ error: 'Failed to initialize URL shortening' });
  }
});

router.get('/shorten/:slug/analytics', async (req: Request, res: Response) => {
  const slug = String(req.params.slug);
  const { error, analytics } = await getLinkAnalytics(slug);
  if (error || !analytics) {
    return res.status(404).json({ error: 'Short link not found' });
  }
  return res.json(analytics);
});

// Endpoint to handle redirection
router.get('/:slug', async (req: Request, res: Response) => {
  const slug = String(req.params.slug);

  try {
    // Look up the slug
    const { data, error } = await supabase
      .from('short_urls')
      .select('id, original_url, clicks')
      .eq('slug', slug)
      .single();

    if (error || !data) {
      return res.status(404).send('URL not found');
    }

    // Increment click count (fire and forget)
    supabase
      .from('short_urls')
      .update({ clicks: (data.clicks || 0) + 1 })
      .eq('slug', slug)
      .then();

    recordLinkEvent(req, data.id, slug).catch((eventError) => {
      console.warn('Analytics event was not recorded:', eventError?.message || eventError);
    });

    // Redirect to the original URL
    return res.redirect(data.original_url);
  } catch (err) {
    console.error('Redirection Error:', err);
    return res.status(500).send('Internal server error');
  }
});

export default router;
