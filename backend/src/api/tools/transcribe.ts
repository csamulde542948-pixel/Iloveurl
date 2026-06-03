import { Router, Request, Response } from 'express';
import { supabase } from '../../lib/supabase';
import { detectSocialPlatform, fetchSocialTranscript, SocialPlatform, TranscriptSegment } from '../../lib/socialkit';
import { sendUrlValidationError, validatePublicHttpUrl } from '../../lib/urlGuardrails';
import { authorizeToolRequest, completeToolRunTask } from '../../lib/credits';

const router = Router();

const PLATFORM_LABELS: Record<SocialPlatform, string> = {
  youtube: 'YouTube',
  facebook: 'Facebook',
  instagram: 'Instagram',
  tiktok: 'TikTok',
};

function transcriptExcerpt(transcript: string, maxChars = 900): string {
  if (transcript.length <= maxChars) return transcript;
  return `${transcript.slice(0, maxChars).trim()}...`;
}

function formatSegments(segments: TranscriptSegment[], transcript: string): string {
  if (segments.length === 0) return transcript;

  return segments
    .map((segment) => {
      const timestamp = segment.timestamp || (typeof segment.start === 'number' ? `${Math.floor(segment.start)}s` : '');
      return timestamp ? `- **${timestamp}** ${segment.text}` : `- ${segment.text}`;
    })
    .join('\n');
}

function buildTranscriptReport(result: Awaited<ReturnType<typeof fetchSocialTranscript>>): string {
  const platform = PLATFORM_LABELS[result.platform];
  const segmentMarkdown = formatSegments(result.transcriptSegments, result.transcript);

  return [
    `# ${platform} Transcript`,
    '',
    '## Source Snapshot',
    '',
    `- **Platform:** ${platform}`,
    `- **URL:** ${result.sourceUrl}`,
    `- **Words:** ${result.wordCount}`,
    `- **Timestamped segments:** ${result.segmentCount || result.transcriptSegments.length}`,
    '',
    '## Quick Preview',
    '',
    transcriptExcerpt(result.transcript),
    '',
    '## Full Transcript',
    '',
    segmentMarkdown,
  ].join('\n');
}

router.post('/transcribe', async (req: Request, res: Response) => {
  const { url, userId } = req.body;

  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'URL is required' });
  }

  const validatedUrl = validatePublicHttpUrl(url, {
    allowedHostPatterns: [
      /(^|\.)youtube\.com$/,
      /(^|\.)youtu\.be$/,
      /(^|\.)facebook\.com$/,
      /(^|\.)fb\.watch$/,
      /(^|\.)instagram\.com$/,
      /(^|\.)tiktok\.com$/,
      /(^|\.)vm\.tiktok\.com$/,
    ],
  });
  if (sendUrlValidationError(res, validatedUrl)) return;
  const safeUrl = validatedUrl.url;

  const platform = detectSocialPlatform(safeUrl);
  if (!platform) {
    return res.status(400).json({
      error: 'Only YouTube, Facebook, Instagram, and TikTok URLs are supported for URL to Transcribe.',
    });
  }

  let taskId: string | null = null;

  try {
    const auth = await authorizeToolRequest(req, res, {
      toolType: 'podcast-script',
      userId,
      metadata: { url: safeUrl, platform },
    });
    if (!auth.ok) return;

    const { data: initialTask, error: initialError } = await supabase
      .from('tasks')
      .insert([
        {
          user_id: auth.userId,
          type: 'podcast-script',
          status: 'processing',
          payload: {
            url: safeUrl,
            platform,
            provider: 'socialkit',
            credits: auth.credits,
          },
        },
      ])
      .select('id')
      .single();

    if (!initialError && initialTask) {
      taskId = initialTask.id;
    }

    if (initialError || !taskId) {
      console.error('Transcription Task Insert Error:', initialError);
      return res.status(500).json({ error: 'Failed to create transcription task' });
    }

    res.status(202).json({ taskId });

    (async () => {
      try {
        const accessKey = process.env.SOCIALKIT_API_KEY;

        if (!accessKey) {
          if (taskId) {
            await supabase
              .from('tasks')
              .update({
                status: 'failed',
                result: { error: 'SocialKit API key is not configured.' },
              })
              .eq('id', taskId);
          }
          return;
        }

        console.log(`[BACKGROUND] Transcribing ${PLATFORM_LABELS[platform]} URL for: ${safeUrl} (Task: ${taskId})`);

        const transcriptResult = await fetchSocialTranscript({
          url: safeUrl,
          platform,
          accessKey,
          cache: true,
          cacheTtl: 2592000,
        });

        const summary = buildTranscriptReport(transcriptResult);
        const resultData = {
          summary,
          title: `${PLATFORM_LABELS[platform]} Transcript`,
          url: safeUrl,
          provider: 'socialkit',
          platform,
          transcript: transcriptResult.transcript,
          transcriptSegments: transcriptResult.transcriptSegments,
          wordCount: transcriptResult.wordCount,
          segmentCount: transcriptResult.segmentCount,
          sourceUrl: transcriptResult.sourceUrl,
          usage: {
            provider: 'socialkit',
            socialkitCalls: 1,
            platform,
            cached: true,
            aiCalls: 0,
          },
        };

        if (taskId) {
          await completeToolRunTask({
            taskId,
            result: resultData,
            userId: auth.userId,
            toolType: 'podcast-script',
            mode: auth.mode,
            credits: auth.credits,
            metadata: { url: safeUrl, platform },
          });
        }

        console.log(`[BACKGROUND] Transcription task ${taskId} completed successfully.`);
      } catch (err: any) {
        console.error(`[BACKGROUND ERROR] Transcription task ${taskId}:`, err);
        if (taskId) {
          await supabase
            .from('tasks')
            .update({
              status: 'failed',
              result: { error: err.message || 'Failed to extract transcript.' },
            })
            .eq('id', taskId);
        }
      }
    })();
  } catch (err: any) {
    console.error('Transcription Initialization Error:', err);
    return res.status(500).json({ error: 'Failed to initialize transcription' });
  }
});

export default router;
