import { Router, Request, Response } from 'express';
import QRCode from 'qrcode';
import { supabase } from '../../lib/supabase';
import { buildShortUrl, createTrackedLink } from '../../lib/trackedLinks';
import { sendUrlValidationError, validatePublicHttpUrl } from '../../lib/urlGuardrails';
import { authorizeToolRequest } from '../../lib/credits';

const router = Router();

// Endpoint to generate a QR code
router.post('/qrcode', async (req: Request, res: Response) => {
  const { url, userId, options } = req.body;

  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }
  const validatedUrl = validatePublicHttpUrl(url);
  if (sendUrlValidationError(res, validatedUrl)) return;
  const safeUrl = validatedUrl.url;

  let taskId: string | null = null;

  try {
    const auth = await authorizeToolRequest(req, res, {
      toolType: 'qr-code',
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
          type: 'qr-code',
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
        console.log(`[BACKGROUND] Generating QR code for: ${safeUrl} (Task: ${taskId})`);

        const { slug } = await createTrackedLink({
          originalUrl: safeUrl,
          userId: auth.userId,
          source: 'qr_code',
          metadata: { tool: 'qr-code' },
        });
        const trackingUrl = buildShortUrl(req, slug);

        // Generate QR code as a Data URL. It encodes the tracked short URL so
        // scans can be counted before redirecting to the final destination.
        const qrDataUrl = await QRCode.toDataURL(trackingUrl, {
          width: Math.min(Math.max(Number(options?.width) || 500, 240), 1200),
          margin: Math.min(Math.max(Number(options?.margin) || 2, 0), 8),
          errorCorrectionLevel: options?.errorCorrectionLevel || 'H',
          color: {
            dark: options?.color?.dark || '#000000',
            light: options?.color?.light || '#ffffff',
          },
        });

        const resultData = {
          qrCodeUrl: qrDataUrl,
          originalUrl: safeUrl,
          trackingUrl,
          shortUrl: trackingUrl,
          slug,
          analyticsUrl: `/api/tools/shorten/${slug}/analytics`,
          analytics: {
            totalScans: 0,
            uniqueVisitors: 0,
            source: 'qr_code',
          },
          customization: {
            width: options?.width || 500,
            margin: options?.margin || 2,
            foreground: options?.color?.dark || '#000000',
            background: options?.color?.light || '#ffffff',
          },
          title: 'QR Code'
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
            .update({ status: 'failed', result: { error: err.message || 'Failed to generate QR code' } })
            .eq('id', taskId);
        }
      }
    })();
  } catch (err: any) {
    console.error('QR Code Initialization Error:', err);
    return res.status(500).json({ error: 'Failed to initialize QR code generation' });
  }
});

export default router;
