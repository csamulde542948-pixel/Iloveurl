export type ReportBlock =
  | {
    type: 'overview';
    title: string;
    body: string;
    meta?: Array<{ label: string; value: string }>;
  }
  | {
    type: 'key_points';
    title: string;
    points: string[];
  }
  | {
    type: 'info_table';
    title: string;
    rows: Array<{ label: string; value: string }>;
  }
  | {
    type: 'action_list';
    title: string;
    actions: Array<{ label: string; detail: string }>;
  }
  | {
    type: 'faq';
    title: string;
    items: Array<{ question: string; answer: string }>;
  }
  | {
    type: 'flashcards';
    title: string;
    cards: Array<{ front: string; back: string }>;
  }
  | {
    type: 'quiz';
    title: string;
    questions: Array<{ question: string; answer: string; difficulty: 'easy' | 'medium' | 'hard' }>;
  }
  | {
    type: 'mind_map';
    title: string;
    root: {
      label: string;
      children: Array<{ label: string; children?: Array<{ label: string }> }>;
    };
  };

function cleanText(value: unknown, fallback = ''): string {
  if (typeof value !== 'string') return fallback;
  return value.replace(/\s+/g, ' ').trim() || fallback;
}

function cleanList(values: unknown, limit = 8): string[] {
  if (!Array.isArray(values)) return [];
  return values
    .map((value) => cleanText(value))
    .filter(Boolean)
    .slice(0, limit);
}

export function normalizeReportBlocks(blocks: unknown): ReportBlock[] {
  if (!Array.isArray(blocks)) return [];

  return blocks.flatMap((block: any): ReportBlock[] => {
    if (!block || typeof block !== 'object' || typeof block.type !== 'string') return [];

    if (block.type === 'overview') {
      return [{
        type: 'overview',
        title: cleanText(block.title, 'Overview'),
        body: cleanText(block.body),
        meta: Array.isArray(block.meta)
          ? block.meta.map((item: any) => ({
            label: cleanText(item?.label),
            value: cleanText(item?.value),
          })).filter((item: any) => item.label && item.value).slice(0, 6)
          : undefined,
      }];
    }

    if (block.type === 'key_points') {
      return [{
        type: 'key_points',
        title: cleanText(block.title, 'Key Points'),
        points: cleanList(block.points, 8),
      }];
    }

    if (block.type === 'info_table') {
      return [{
        type: 'info_table',
        title: cleanText(block.title, 'Details'),
        rows: Array.isArray(block.rows)
          ? block.rows.map((row: any) => ({
            label: cleanText(row?.label),
            value: cleanText(row?.value),
          })).filter((row: any) => row.label && row.value).slice(0, 12)
          : [],
      }];
    }

    if (block.type === 'action_list') {
      return [{
        type: 'action_list',
        title: cleanText(block.title, 'Action Items'),
        actions: Array.isArray(block.actions)
          ? block.actions.map((action: any) => ({
            label: cleanText(action?.label),
            detail: cleanText(action?.detail),
          })).filter((action: any) => action.label && action.detail).slice(0, 8)
          : [],
      }];
    }

    if (block.type === 'faq') {
      return [{
        type: 'faq',
        title: cleanText(block.title, 'FAQ'),
        items: Array.isArray(block.items)
          ? block.items.map((item: any) => ({
            question: cleanText(item?.question),
            answer: cleanText(item?.answer),
          })).filter((item: any) => item.question && item.answer).slice(0, 8)
          : [],
      }];
    }

    if (block.type === 'flashcards') {
      return [{
        type: 'flashcards',
        title: cleanText(block.title, 'Flashcards'),
        cards: Array.isArray(block.cards)
          ? block.cards.map((card: any) => ({
            front: cleanText(card?.front),
            back: cleanText(card?.back),
          })).filter((card: any) => card.front && card.back).slice(0, 12)
          : [],
      }];
    }

    if (block.type === 'quiz') {
      return [{
        type: 'quiz',
        title: cleanText(block.title, 'Quiz Yourself'),
        questions: Array.isArray(block.questions)
          ? block.questions.map((item: any) => ({
            question: cleanText(item?.question),
            answer: cleanText(item?.answer),
            difficulty: ['easy', 'medium', 'hard'].includes(item?.difficulty) ? item.difficulty : 'medium',
          })).filter((item: any) => item.question && item.answer).slice(0, 10)
          : [],
      }];
    }

    if (block.type === 'mind_map') {
      const children = Array.isArray(block.root?.children)
        ? block.root.children.map((child: any) => ({
          label: cleanText(child?.label),
          children: Array.isArray(child?.children)
            ? child.children.map((grandchild: any) => ({ label: cleanText(grandchild?.label) })).filter((grandchild: any) => grandchild.label).slice(0, 5)
            : [],
        })).filter((child: any) => child.label).slice(0, 7)
        : [];

      return [{
        type: 'mind_map',
        title: cleanText(block.title, 'Mind Map'),
        root: {
          label: cleanText(block.root?.label, cleanText(block.title, 'Main Topic')),
          children,
        },
      }];
    }

    return [];
  }).filter((block) => {
    if (block.type === 'overview') return Boolean(block.body);
    if (block.type === 'key_points') return block.points.length > 0;
    if (block.type === 'info_table') return block.rows.length > 0;
    if (block.type === 'action_list') return block.actions.length > 0;
    if (block.type === 'faq') return block.items.length > 0;
    if (block.type === 'flashcards') return block.cards.length > 0;
    if (block.type === 'quiz') return block.questions.length > 0;
    if (block.type === 'mind_map') return block.root.children.length > 0;
    return false;
  });
}
