import { Router, Request, Response } from 'express';
import FirecrawlApp from '@mendable/firecrawl-js';
import { supabase } from '../../lib/supabase';
import { runAiWorkflow } from '../../lib/aiWorkflow';
import { resolveWorkflow } from '../../lib/workflows';
import { sendUrlValidationError, validatePublicHttpUrl } from '../../lib/urlGuardrails';
import { buildPresentationWorkflowContext, PresentationWorkflowContext } from '../../lib/workflows/context/presentationContext';
import { canUsePresenton, generatePresentonDeck, PresentonGenerateResult } from '../../lib/presenton';
import { authorizeToolRequest, completeToolRunTask } from '../../lib/credits';
import { getFirecrawlApiKey } from '../../lib/config';

const router = Router();

type PresentationSlide = {
  slideNumber: number;
  title: string;
  role: string;
  bullets: string[];
  visualDirection: string;
  speakerNotes: string;
};

type PresentationDeckPlan = {
  deckTitle: string;
  subtitle: string;
  theme: string;
  audience: string;
  slides: PresentationSlide[];
  designSystem: {
    palette: string[];
    typography: string;
    layoutStyle: string;
    visualRules: string[];
  };
  exportNotes: string[];
};

type PresentonTemplate = 'auto' | 'general' | 'modern' | 'standard' | 'swift';

const PRESENTATION_SECTIONS = [
  'Deck Strategy',
  'Visual Direction',
  'Slide Plan',
  'Speaker Notes',
  'Source And Evidence Notes',
];

function normalizeHeading(value: string): string {
  return value.replace(/[#*_`]/g, '').replace(/\s+/g, ' ').trim().toLowerCase();
}

function normalizePresentonTemplate(value: unknown): PresentonTemplate {
  if (value === 'general' || value === 'modern' || value === 'standard' || value === 'swift') return value;
  return 'auto';
}

function inferPresentonTemplate(context: PresentationWorkflowContext): Exclude<PresentonTemplate, 'auto'> {
  if (context.sourceType === 'documentation') return 'general';
  if (context.sourceType === 'report' || context.sourceType === 'article') return 'standard';
  if (context.suggestedTheme === 'Product Pitch' || context.audience === 'founder' || context.audience === 'marketer') return 'swift';
  if (context.visualInputs.availableSourceImages.length > 0 || context.metadata.screenshot) return 'modern';
  return 'swift';
}

function extractSections(markdown: string): Record<string, string> {
  const sections: Record<string, string> = {};
  const matches = [...markdown.matchAll(/^#{1,3}\s+(.+?)\s*$/gim)];

  matches.forEach((match, index) => {
    const title = normalizeHeading(match[1]);
    const start = (match.index || 0) + match[0].length;
    const end = index + 1 < matches.length ? matches[index + 1].index || markdown.length : markdown.length;
    sections[title] = markdown.substring(start, end).trim();
  });

  return sections;
}

function sectionBody(sections: Record<string, string>, section: string): string | null {
  const body = sections[normalizeHeading(section)];
  return body?.trim() || null;
}

function sentenceFromLine(line: string): string {
  return line.replace(/\s+/g, ' ').trim().replace(/[.。]?$/, '.');
}

function fallbackSlides(context: PresentationWorkflowContext): PresentationSlide[] {
  const evidence = context.contentSignals.keyLines.length
    ? context.contentSignals.keyLines
    : [context.metadata.description, ...context.contentSignals.headings].filter(Boolean) as string[];
  const titles = [
    'Opening Context',
    'The Core Idea',
    'What The Source Shows',
    'Important Details',
    'Audience Relevance',
    'Recommended Next Step',
    'Closing Takeaway',
  ];

  return titles.map((title, index) => {
    const start = Math.min(index * 2, Math.max(evidence.length - 1, 0));
    const bullets = evidence.slice(start, start + 3).map(sentenceFromLine);
    return {
      slideNumber: index + 1,
      title,
      role: index === 0 ? 'cover' : index === titles.length - 1 ? 'closing' : 'content',
      bullets: bullets.length ? bullets : ['INSUFFICIENT_DATA'],
      visualDirection: index === 0
        ? 'Use the source image or page screenshot as a hero visual with a clean title overlay.'
        : 'Use a clean editorial layout with one evidence-led headline, concise bullets, and one supporting visual cue.',
      speakerNotes: bullets.join(' '),
    };
  });
}

function buildDeckPlan(context: PresentationWorkflowContext): PresentationDeckPlan {
  const slides = fallbackSlides(context).slice(0, context.deckConstraints.targetSlides);
  const sourceAccent = context.suggestedTheme === 'Product Pitch' ? '#4F46E5' : '#111827';

  return {
    deckTitle: context.title,
    subtitle: context.metadata.description || `Presentation generated from ${context.url}`,
    theme: context.suggestedTheme,
    audience: context.audience,
    slides,
    designSystem: {
      palette: ['#4F46E5', sourceAccent, '#F8FAFC', '#111827'],
      typography: 'Bold display titles, compact body text, and generous slide whitespace.',
      layoutStyle: context.suggestedTheme,
      visualRules: [
        'Use one main idea per slide.',
        'Use the URL screenshot or source image when it clarifies the source.',
        'Prefer diagrams, comparison grids, timelines, and metrics over decorative stock imagery.',
        'Keep bullets short enough for presentation use.',
      ],
    },
    exportNotes: [
      'This MVP creates a slide-ready plan, not an editable PPTX file yet.',
      'Use the visual direction notes as the production brief for a future deck renderer.',
    ],
  };
}

function parseAiSlides(markdown: string): PresentationSlide[] {
  const matches = [...markdown.matchAll(/(?:^|\n)#{2,4}\s*Slide\s*(\d+)\s*[:\-]\s*(.+?)\s*(?=\n)/gim)];
  const slides: PresentationSlide[] = [];

  matches.forEach((match, index) => {
    const start = (match.index || 0) + match[0].length;
    const end = index + 1 < matches.length ? matches[index + 1].index || markdown.length : markdown.length;
    const body = markdown.substring(start, end);
    const bullets = body
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => /^[-*]\s+/.test(line))
      .map((line) => line.replace(/^[-*]\s+/, '').replace(/^\*\*(Role|Visual|Speaker note|Speaker Notes):\*\*\s*/i, '').trim())
      .filter((line) => line && !/^role:/i.test(line))
      .slice(0, 4);
    const visualMatch = body.match(/(?:visual|visual direction)\s*[:\-]\s*(.+)/i);
    const notesMatch = body.match(/(?:speaker notes?|notes?)\s*[:\-]\s*(.+)/i);
    const roleMatch = body.match(/(?:role)\s*[:\-]\s*(.+)/i);

    slides.push({
      slideNumber: Number(match[1]) || index + 1,
      title: match[2].trim(),
      role: roleMatch?.[1]?.trim().substring(0, 40) || (index === 0 ? 'cover' : 'content'),
      bullets: bullets.length ? bullets : ['INSUFFICIENT_DATA'],
      visualDirection: visualMatch?.[1]?.trim() || 'Use a clean slide layout with one strong headline and one supporting visual cue.',
      speakerNotes: notesMatch?.[1]?.trim() || bullets.join(' '),
    });
  });

  return slides.filter((slide) => slide.title && slide.bullets.length > 0).slice(0, 9);
}

function applyAiSlides(deckPlan: PresentationDeckPlan, aiSummary: string): PresentationDeckPlan {
  const aiSlides = parseAiSlides(aiSummary);
  if (aiSlides.length < 3) return deckPlan;
  return {
    ...deckPlan,
    slides: aiSlides,
  };
}

function normalizePresentationReport(aiSummary: string, context: PresentationWorkflowContext, deckPlan: PresentationDeckPlan): string {
  const sections = extractSections(aiSummary || '');

  return PRESENTATION_SECTIONS.map((section) => {
    const aiBody = sectionBody(sections, section);
    if (aiBody) return `## ${section}\n\n${aiBody}`;

    if (section === 'Deck Strategy') {
      return [
        `## ${section}`,
        '',
        `- **Deck title:** ${deckPlan.deckTitle}`,
        `- **Recommended theme:** ${deckPlan.theme}`,
        `- **Primary audience:** ${deckPlan.audience}`,
        `- **Source type:** ${context.sourceType}`,
        `- **Goal:** Turn the source into a clear, presentation-ready narrative with evidence-backed slides.`,
      ].join('\n');
    }

    if (section === 'Visual Direction') {
      return [
        `## ${section}`,
        '',
        `- **Palette:** ${deckPlan.designSystem.palette.join(', ')}`,
        `- **Typography:** ${deckPlan.designSystem.typography}`,
        `- **Layout style:** ${deckPlan.designSystem.layoutStyle}`,
        ...deckPlan.designSystem.visualRules.map((rule) => `- ${rule}`),
      ].join('\n');
    }

    if (section === 'Slide Plan') {
      return [
        `## ${section}`,
        '',
        ...deckPlan.slides.map((slide) => [
          `### Slide ${slide.slideNumber}: ${slide.title}`,
          `- **Role:** ${slide.role}`,
          ...slide.bullets.slice(0, 4).map((bullet) => `- ${bullet}`),
          `- **Visual:** ${slide.visualDirection}`,
        ].join('\n')),
      ].join('\n\n');
    }

    if (section === 'Speaker Notes') {
      return [
        `## ${section}`,
        '',
        ...deckPlan.slides.map((slide) => `- **Slide ${slide.slideNumber}:** ${slide.speakerNotes || 'Use this slide to explain the supporting evidence from the source.'}`),
      ].join('\n');
    }

    return [
      `## ${section}`,
      '',
      `- Source URL: ${context.url}`,
      `- Source title: ${context.title}`,
      `- Firecrawl source of truth: markdown, metadata${context.metadata.screenshot ? ', screenshot' : ''}.`,
      '- Verify any business-critical claims against the original URL before presenting externally.',
    ].join('\n');
  }).join('\n\n');
}

function buildPresentationBlocks(deckPlan: PresentationDeckPlan, context: PresentationWorkflowContext) {
  return [
    {
      type: 'presentation_deck',
      title: deckPlan.deckTitle,
      subtitle: deckPlan.subtitle,
      theme: deckPlan.theme,
      audience: deckPlan.audience,
      slides: deckPlan.slides,
      designSystem: deckPlan.designSystem,
      sourceVisual: context.metadata.screenshot || context.metadata.image || null,
      sourceUrl: context.url,
      exportNotes: deckPlan.exportNotes,
    },
  ];
}

function cleanPresentonText(value: string): string {
  return String(value || '')
    .replace(/\*\*/g, '')
    .replace(/^role:\s*/i, '')
    .replace(/^bullets:\s*/i, '')
    .replace(/^visual:\s*/i, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function buildPresentonContent(context: PresentationWorkflowContext, deckPlan: PresentationDeckPlan, aiSummary: string): string {
  const lockedSlides = deckPlan.slides.map((slide) => {
    const bullets = slide.bullets
      .map(cleanPresentonText)
      .filter((bullet) => bullet && !/^bullets:?$/i.test(bullet) && !/^role:?$/i.test(bullet))
      .slice(0, 4);

    return [
      `# Slide ${slide.slideNumber}: ${cleanPresentonText(slide.title)}`,
      `Slide role: ${cleanPresentonText(slide.role) || 'content'}`,
      'Use these exact bullet ideas:',
      ...bullets.map((bullet) => `- ${bullet}`),
      `Speaker notes: ${cleanPresentonText(slide.speakerNotes)}`,
      `Visual direction: ${cleanPresentonText(slide.visualDirection)}`,
    ].join('\n');
  });

  return [
    'LOCKED ILOVEURL DECK CONTENT',
    'The following slide content has already been written by iLoveURL. Preserve the narrative, slide titles, core bullets, and speaker notes. Do not create a new outline.',
    '',
    `Deck title: ${cleanPresentonText(deckPlan.deckTitle)}`,
    `Source URL: ${context.url}`,
    `Source type: ${context.sourceType}`,
    `Audience: ${deckPlan.audience}`,
    `Recommended theme: ${deckPlan.theme}`,
    `Exact slide count: ${deckPlan.slides.length}`,
    '',
    'LOCKED SLIDES:',
    ...lockedSlides,
    '',
    'ALLOWED SOURCE EVIDENCE FOR FACT CHECKING ONLY:',
    context.contentSignals.selectedMarkdownExcerpt.substring(0, 4500),
    '',
    'REFERENCE DECK BRIEF FOR DESIGN CONTEXT ONLY:',
    aiSummary.substring(0, 2500),
  ].join('\n\n');
}

function presentonInstructions(context: PresentationWorkflowContext): string {
  return [
    'Create a real presentation deck from the LOCKED ILOVEURL DECK CONTENT.',
    'The iLoveURL slide content is the source of truth. Preserve the slide titles, narrative order, bullet meanings, and speaker notes.',
    'Do not create a new outline and do not replace the content with your own interpretation.',
    'Generate exactly the requested number of slides.',
    'Use only the supplied content. Do not invent team members, presenters, names, dates, customers, funding, metrics, awards, logos, or company history.',
    'Do not include presenter names, presenter placeholders, date placeholders, or "Presenter:" / "Date:" text.',
    'Do not create a team slide unless real team data is explicitly provided.',
    'Do not create fake headshots or fake customer logos.',
    'Prefer product, workflow, problem/solution, evidence, and recommendation slides.',
    'Keep every slide concise and presentation-ready.',
    'If source evidence is weak, use a simple source-grounded layout instead of filling gaps with invented facts.',
    `Use the source URL only as attribution: ${context.url}`,
  ].join(' ');
}

router.post('/presentation', async (req: Request, res: Response) => {
  const { url, userId, model, mode } = req.body;
  const requestedPresentonTemplate = normalizePresentonTemplate(req.body.presentonTemplate);

  if (!url) return res.status(400).json({ error: 'URL is required' });
  const validatedUrl = validatePublicHttpUrl(url);
  if (sendUrlValidationError(res, validatedUrl)) return;
  const safeUrl = validatedUrl.url;

  let taskId: string | null = null;

  try {
    const workflow = resolveWorkflow({ workflowId: 'presentation', requestedMode: mode });
    const auth = await authorizeToolRequest(req, res, {
      toolType: 'presentation',
      userId,
      mode: workflow.mode,
      metadata: { url: safeUrl },
    });
    if (!auth.ok) return;

    const { data: initialTask, error: initialError } = await supabase
      .from('tasks')
      .insert([{
        user_id: auth.userId,
        type: 'presentation',
        status: 'processing',
        payload: { url: safeUrl, mode: workflow.mode, presentonTemplate: requestedPresentonTemplate, credits: auth.credits },
      }])
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
        const scrapeResponse = await firecrawl.scrape(safeUrl, {
          formats: ['markdown', 'screenshot'],
        }) as any;

        if (!scrapeResponse || (!scrapeResponse.markdown && !scrapeResponse.success)) {
          if (taskId) await supabase.from('tasks').update({ status: 'failed', result: { error: scrapeResponse?.error || 'Failed to extract content' } }).eq('id', taskId);
          return;
        }

        const markdown = scrapeResponse.markdown || '';
        if (!markdown || markdown.length < 100) {
          if (taskId) await supabase.from('tasks').update({ status: 'failed', result: { error: 'The page does not contain enough readable content to create a presentation.' } }).eq('id', taskId);
          return;
        }

        const presentationContext = buildPresentationWorkflowContext({
          url: safeUrl,
          metadata: scrapeResponse.metadata || {},
          markdown,
          screenshot: scrapeResponse.screenshot || null,
          budget: workflow.budget,
        });

        let masResult;
        try {
          masResult = await runAiWorkflow({
            url: safeUrl,
            tool_type: workflow.toolType,
            workflow_id: workflow.id,
            mode: workflow.mode,
            firecrawl_access: workflow.firecrawlAccess,
            budget: workflow.budget,
            task_id: taskId,
            user_id: auth.userId,
            model,
            payload: presentationContext,
          });
        } catch (masErr: any) {
          console.error('Presentation MAS Service Critical Error:', masErr);
          if (taskId) await supabase.from('tasks').update({ status: 'failed', result: { error: 'The AI agent service is currently unavailable. Please try again later.' } }).eq('id', taskId);
          return;
        }

        const deckPlan = applyAiSlides(buildDeckPlan(presentationContext), masResult.summary);
        const normalizedSummary = normalizePresentationReport(masResult.summary, presentationContext, deckPlan);
        let presenton: PresentonGenerateResult | null = null;
        let presentonError: string | null = null;
        const resolvedPresentonTemplate = requestedPresentonTemplate === 'auto'
          ? inferPresentonTemplate(presentationContext)
          : requestedPresentonTemplate;

        if (canUsePresenton()) {
          try {
            presenton = await generatePresentonDeck({
              content: buildPresentonContent(presentationContext, deckPlan, normalizedSummary),
              nSlides: Math.min(Math.max(deckPlan.slides.length, 3), 10),
              template: resolvedPresentonTemplate,
              instructions: presentonInstructions(presentationContext),
              exportAs: 'pptx',
            });
          } catch (error: any) {
            presentonError = error.message || 'Presenton generation failed';
            console.error('Presenton generation error:', error);
          }
        }

        const resultData = {
          summary: normalizedSummary,
          title: `Presentation - ${presentationContext.title}`,
          url: safeUrl,
          presentationContext,
          deckPlan,
          reportBlocks: buildPresentationBlocks(deckPlan, presentationContext),
          screenshot: presentationContext.metadata.screenshot,
          presenton,
          presentonError,
          presentonTemplate: {
            requested: requestedPresentonTemplate,
            resolved: resolvedPresentonTemplate,
          },
          usage: {
            workflowId: workflow.id,
            mode: workflow.mode,
            modelPolicy: workflow.modelPolicy,
            firecrawlAccess: workflow.firecrawlAccess,
            tokens: masResult.tokens,
            adkToolCalls: masResult.toolCalls,
            backendFirecrawlCalls: 1,
            presentonEnabled: canUsePresenton(),
            presentonExported: Boolean(presenton),
            presentonTemplate: resolvedPresentonTemplate,
          },
        };

        if (taskId) {
          await completeToolRunTask({
            taskId,
            result: resultData,
            userId: auth.userId,
            toolType: workflow.toolType,
            mode: workflow.mode,
            credits: auth.credits,
            metadata: { url: safeUrl, workflowId: workflow.id },
          });
        }
      } catch (err: any) {
        console.error(`[BACKGROUND ERROR] Presentation task ${taskId}:`, err);
        if (taskId) await supabase.from('tasks').update({ status: 'failed', result: { error: err.message || 'Internal background error' } }).eq('id', taskId);
      }
    })();
  } catch (err: any) {
    console.error('Presentation Initialization Error:', err);
    return res.status(500).json({ error: 'Failed to initialize presentation maker' });
  }
});

export default router;
