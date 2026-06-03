export type PresentonGenerateInput = {
  content: string;
  nSlides?: number;
  template?: string;
  instructions?: string;
  exportAs?: 'pptx' | 'pdf';
};

export type PresentonGenerateResult = {
  presentationId: string;
  path: string;
  editPath: string;
  downloadUrl: string;
  editUrl: string;
  title?: string;
  slides?: Array<Record<string, any>>;
};

function presentonBaseUrl(): string | null {
  const value = process.env.PRESENTON_API_URL || '';
  return value.trim().replace(/\/$/, '') || null;
}

function isPresentonEnabled(): boolean {
  return String(process.env.PRESENTON_ENABLED || '').toLowerCase() === 'true';
}

function buildPresentonUrl(path: string): string {
  const base = presentonBaseUrl();
  if (!base) throw new Error('PRESENTON_API_URL is not configured');
  return new URL(path, `${base}/`).toString();
}

export function canUsePresenton(): boolean {
  return Boolean(isPresentonEnabled() && presentonBaseUrl());
}

export async function generatePresentonDeck(input: PresentonGenerateInput): Promise<PresentonGenerateResult> {
  const base = presentonBaseUrl();
  if (!base) throw new Error('PRESENTON_API_URL is not configured');

  const response = await fetch(`${base}/api/v1/ppt/presentation/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      content: input.content,
      n_slides: input.nSlides || 7,
      tone: 'professional',
      verbosity: 'concise',
      template: input.template || process.env.PRESENTON_TEMPLATE || 'swift',
      include_title_slide: false,
      include_table_of_contents: false,
      web_search: false,
      export_as: input.exportAs || 'pptx',
      instructions: input.instructions,
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    throw new Error(`Presenton failed: ${response.status} ${detail || response.statusText}`);
  }

  const payload = await response.json() as {
    presentation_id: string;
    path: string;
    edit_path: string;
  };

  let presentation: { title?: string; slides?: Array<Record<string, any>> } = {};
  try {
    const presentationResponse = await fetch(`${base}/api/v1/ppt/presentation/${payload.presentation_id}`);
    if (presentationResponse.ok) {
      presentation = await presentationResponse.json() as { title?: string; slides?: Array<Record<string, any>> };
    }
  } catch {
    presentation = {};
  }

  return {
    presentationId: payload.presentation_id,
    path: payload.path,
    editPath: payload.edit_path,
    downloadUrl: buildPresentonUrl(payload.path),
    editUrl: buildPresentonUrl(payload.edit_path),
    title: presentation.title,
    slides: presentation.slides || [],
  };
}
