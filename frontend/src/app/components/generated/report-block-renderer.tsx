import { useState } from "react";

type ReportBlock =
  | {
    type: "overview";
    title: string;
    body: string;
    meta?: Array<{ label: string; value: string }>;
  }
  | {
    type: "key_points";
    title: string;
    points: string[];
  }
  | {
    type: "info_table";
    title: string;
    rows: Array<{ label: string; value: string }>;
  }
  | {
    type: "action_list";
    title: string;
    actions: Array<{ label: string; detail: string }>;
  }
  | {
    type: "faq";
    title: string;
    items: Array<{ question: string; answer: string }>;
  }
  | {
    type: "flashcards";
    title: string;
    cards: Array<{ front: string; back: string }>;
  }
  | {
    type: "quiz";
    title: string;
    questions: Array<{ question: string; answer: string; difficulty: string }>;
  }
  | {
    type: "mind_map";
    title: string;
    root: {
      label: string;
      children: Array<{ label: string; children?: Array<{ label: string }> }>;
    };
  }
  | {
    type: "presentation_deck";
    title: string;
    subtitle?: string;
    theme: string;
    audience: string;
    slides: Array<{
      slideNumber: number;
      title: string;
      role: string;
      bullets: string[];
      visualDirection: string;
      speakerNotes: string;
    }>;
    sourceVisual?: string | null;
    sourceUrl?: string;
    designSystem?: {
      palette?: string[];
      typography?: string;
      layoutStyle?: string;
      visualRules?: string[];
    };
    exportNotes?: string[];
  };

type ReportBlockRendererProps = {
  blocks?: ReportBlock[];
};

function statusClass(index: number) {
  const colors = [
    "border-primary/20 bg-primary/[0.03]",
    "border-amber-200 bg-amber-50/60",
    "border-emerald-200 bg-emerald-50/60",
    "border-blue-200 bg-blue-50/60",
  ];
  return colors[index % colors.length];
}

function FlashcardGrid({ cards }: { cards: Array<{ front: string; back: string }> }) {
  const [revealed, setRevealed] = useState<Record<number, boolean>>({});

  return (
    <div className="grid md:grid-cols-2 gap-3">
      {cards.map((card, cardIndex) => {
        const isRevealed = Boolean(revealed[cardIndex]);

        return (
          <button
            key={`${card.front}-${cardIndex}`}
            type="button"
            onClick={() => setRevealed((current) => ({ ...current, [cardIndex]: !isRevealed }))}
            className="text-left rounded-xl border border-gray-100 bg-gray-50 p-4 min-h-36 transition hover:border-primary/30 hover:bg-primary/[0.03] focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <div className="flex items-center justify-between gap-3 mb-3">
              <p className="text-[11px] font-black uppercase tracking-[1px] text-gray-400">Card {cardIndex + 1}</p>
              <span className="rounded-full bg-white px-2 py-1 text-[9px] font-black uppercase tracking-[1px] text-primary shadow-sm">
                {isRevealed ? "Hide answer" : "Reveal"}
              </span>
            </div>
            <p className="text-[14px] font-black text-primary leading-snug">{card.front}</p>
            {isRevealed ? (
              <div className="mt-4 rounded-lg bg-white p-3">
                <p className="text-[11px] font-black uppercase tracking-[1px] text-gray-400 mb-1">Answer</p>
                <p className="text-[13px] leading-relaxed font-semibold text-gray-700">{card.back}</p>
              </div>
            ) : (
              <p className="mt-4 text-[12px] font-bold text-gray-400">Think of the answer first, then reveal it.</p>
            )}
          </button>
        );
      })}
    </div>
  );
}

function QuizPanel({ questions }: { questions: Array<{ question: string; answer: string; difficulty: string }> }) {
  const [openAnswers, setOpenAnswers] = useState<Record<number, boolean>>({});
  const [scores, setScores] = useState<Record<number, "correct" | "review">>({});
  const correctCount = Object.values(scores).filter((score) => score === "correct").length;
  const attemptedCount = Object.keys(scores).length;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-gray-50 p-3">
        <p className="text-[12px] font-black uppercase tracking-[1px] text-gray-500">Progress</p>
        <p className="text-[13px] font-black text-primary">{correctCount}/{questions.length} mastered · {attemptedCount}/{questions.length} attempted</p>
      </div>
      {questions.map((item, questionIndex) => {
        const isOpen = Boolean(openAnswers[questionIndex]);
        const score = scores[questionIndex];

        return (
          <div key={`${item.question}-${questionIndex}`} className="rounded-xl border border-gray-100 p-4">
            <div className="flex items-start justify-between gap-3 mb-3">
              <p className="text-[14px] font-black text-gray-900 leading-snug">{questionIndex + 1}. {item.question}</p>
              <span className="shrink-0 rounded-full bg-primary/5 px-2 py-1 text-[9px] font-black uppercase tracking-[1px] text-primary">{item.difficulty}</span>
            </div>
            <button
              type="button"
              onClick={() => setOpenAnswers((current) => ({ ...current, [questionIndex]: !isOpen }))}
              className="rounded-lg border border-primary/15 bg-primary/[0.03] px-3 py-2 text-[11px] font-black uppercase tracking-[1px] text-primary transition hover:bg-primary/10"
            >
              {isOpen ? "Hide answer" : "Check answer"}
            </button>
            {isOpen && (
              <div className="mt-3 rounded-lg bg-gray-50 p-3">
                <p className="text-[11px] font-black uppercase tracking-[1px] text-gray-400 mb-1">Answer</p>
                <p className="text-[13px] leading-relaxed font-semibold text-gray-700">{item.answer}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setScores((current) => ({ ...current, [questionIndex]: "correct" }))}
                    className={`rounded-lg px-3 py-2 text-[11px] font-black uppercase tracking-[1px] transition ${score === "correct" ? "bg-emerald-600 text-white" : "bg-white text-emerald-700 border border-emerald-200"}`}
                  >
                    I got it
                  </button>
                  <button
                    type="button"
                    onClick={() => setScores((current) => ({ ...current, [questionIndex]: "review" }))}
                    className={`rounded-lg px-3 py-2 text-[11px] font-black uppercase tracking-[1px] transition ${score === "review" ? "bg-amber-500 text-white" : "bg-white text-amber-700 border border-amber-200"}`}
                  >
                    Review again
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function SlideCanvas({
  slide,
  index,
  total,
  accent,
  sourceVisual,
  sourceUrl,
}: {
  slide: Extract<ReportBlock, { type: "presentation_deck" }>["slides"][number];
  index: number;
  total: number;
  accent: string;
  sourceVisual?: string | null;
  sourceUrl?: string;
}) {
  const isCover = index === 0 || /cover|opening/i.test(slide.role);
  const isClosing = index === total - 1 || /closing/i.test(slide.role);
  const layout = index % 4;

  if (isCover) {
    return (
      <div className="relative aspect-video overflow-hidden rounded-[22px] border-2 border-gray-950 bg-gray-950 text-white shadow-[0_8px_0_0_#CFCFCF]">
        {sourceVisual && (
          <img src={sourceVisual} alt="" className="absolute inset-0 h-full w-full object-cover opacity-35" />
        )}
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(17,24,39,0.96),rgba(17,24,39,0.72),rgba(79,70,229,0.34))]" />
        <div className="relative flex h-full flex-col justify-between p-8 md:p-10">
          <div className="flex items-center justify-between">
            <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-[2px] text-white/70">source deck</span>
            <span className="text-[11px] font-black text-white/40">01/{String(total).padStart(2, "0")}</span>
          </div>
          <div className="max-w-[72%]">
            <p className="mb-3 text-[11px] font-black uppercase tracking-[3px]" style={{ color: accent }}>opening claim</p>
            <h3 className="text-[42px] md:text-[56px] font-display lowercase leading-[0.88] tracking-normal">{slide.title}</h3>
            <p className="mt-5 max-w-xl text-[16px] font-semibold leading-relaxed text-white/75">{slide.bullets[0]}</p>
          </div>
          <div className="flex items-end justify-between gap-4">
            <p className="max-w-lg truncate text-[10px] font-bold uppercase tracking-[1px] text-white/35">{sourceUrl || "iLoveURL presentation maker"}</p>
            <div className="h-2 w-32 rounded-full" style={{ backgroundColor: accent }} />
          </div>
        </div>
      </div>
    );
  }

  if (isClosing) {
    return (
      <div className="relative aspect-video overflow-hidden rounded-[22px] border-2 border-gray-950 bg-white shadow-[0_8px_0_0_#CFCFCF]">
        <div className="absolute inset-y-0 left-0 w-3" style={{ backgroundColor: accent }} />
        <div className="flex h-full flex-col justify-between p-8 md:p-10">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-black uppercase tracking-[2px] text-gray-400">closing takeaway</p>
            <p className="text-[11px] font-black text-gray-300">{String(slide.slideNumber).padStart(2, "0")}/{String(total).padStart(2, "0")}</p>
          </div>
          <div>
            <h3 className="max-w-3xl text-[40px] md:text-[54px] font-display lowercase leading-[0.9] text-gray-950">{slide.title}</h3>
            <div className="mt-7 grid gap-3 md:grid-cols-3">
              {slide.bullets.slice(0, 3).map((bullet, bulletIndex) => (
                <div key={bulletIndex} className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                  <p className="mb-2 text-[10px] font-black uppercase tracking-[1px]" style={{ color: accent }}>takeaway {bulletIndex + 1}</p>
                  <p className="text-[13px] font-bold leading-relaxed text-gray-700">{bullet}</p>
                </div>
              ))}
            </div>
          </div>
          <p className="text-[11px] font-bold text-gray-400">{slide.speakerNotes}</p>
        </div>
      </div>
    );
  }

  if (layout === 1) {
    return (
      <div className="relative aspect-video overflow-hidden rounded-[22px] border-2 border-gray-950 bg-[#F8FAFC] shadow-[0_8px_0_0_#CFCFCF]">
        <div className="grid h-full grid-cols-[1.05fr_0.95fr]">
          <div className="flex flex-col justify-between p-8">
            <div>
              <p className="mb-3 text-[10px] font-black uppercase tracking-[2px] text-gray-400">{slide.role}</p>
              <h3 className="text-[34px] md:text-[44px] font-display lowercase leading-[0.92] text-gray-950">{slide.title}</h3>
            </div>
            <div className="space-y-3">
              {slide.bullets.slice(0, 4).map((bullet, bulletIndex) => (
                <div key={bulletIndex} className="flex gap-3">
                  <span className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-black text-white" style={{ backgroundColor: accent }}>{bulletIndex + 1}</span>
                  <p className="text-[15px] font-bold leading-snug text-gray-700">{bullet}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="m-5 rounded-[26px] border-2 border-gray-950 bg-white p-5 shadow-[0_6px_0_0_#CFCFCF]">
            <p className="mb-4 text-[10px] font-black uppercase tracking-[2px] text-gray-400">proof object</p>
            <div className="flex h-[62%] items-end gap-3 border-b-2 border-gray-200 pb-2">
              {[58, 82, 45, 70].map((height, barIndex) => (
                <div key={barIndex} className="flex flex-1 flex-col items-center justify-end gap-2">
                  <div className="w-full rounded-t-xl" style={{ height: `${height}%`, backgroundColor: barIndex === 1 ? accent : "#DDE3F0" }} />
                  <span className="text-[9px] font-black text-gray-300">S{barIndex + 1}</span>
                </div>
              ))}
            </div>
            <p className="mt-4 text-[12px] font-bold leading-relaxed text-gray-600">{slide.visualDirection}</p>
          </div>
        </div>
      </div>
    );
  }

  if (layout === 2) {
    return (
      <div className="relative aspect-video overflow-hidden rounded-[22px] border-2 border-gray-950 bg-white shadow-[0_8px_0_0_#CFCFCF]">
        <div className="grid h-full grid-rows-[auto_1fr_auto] p-8">
          <div className="flex items-start justify-between gap-6">
            <div>
              <p className="mb-2 text-[10px] font-black uppercase tracking-[2px]" style={{ color: accent }}>{slide.role}</p>
              <h3 className="max-w-4xl text-[36px] md:text-[48px] font-display lowercase leading-[0.9] text-gray-950">{slide.title}</h3>
            </div>
            <p className="text-[11px] font-black text-gray-300">{String(slide.slideNumber).padStart(2, "0")}</p>
          </div>
          <div className="mt-8 grid grid-cols-3 gap-4">
            {slide.bullets.slice(0, 3).map((bullet, bulletIndex) => (
              <div key={bulletIndex} className="flex flex-col justify-between rounded-[24px] border-2 border-border-color bg-gray-50 p-5">
                <p className="text-[42px] font-display leading-none" style={{ color: accent }}>0{bulletIndex + 1}</p>
                <p className="mt-8 text-[15px] font-bold leading-snug text-gray-700">{bullet}</p>
              </div>
            ))}
          </div>
          <p className="mt-6 text-[11px] font-bold text-gray-400">{slide.visualDirection}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative aspect-video overflow-hidden rounded-[22px] border-2 border-gray-950 bg-[#111827] text-white shadow-[0_8px_0_0_#CFCFCF]">
      <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full opacity-20" style={{ backgroundColor: accent }} />
      <div className="grid h-full grid-cols-[0.9fr_1.1fr] gap-7 p-8">
        <div className="flex flex-col justify-between">
          <div>
            <p className="mb-3 text-[10px] font-black uppercase tracking-[2px] text-white/35">{slide.role}</p>
            <h3 className="text-[34px] md:text-[46px] font-display lowercase leading-[0.9]">{slide.title}</h3>
          </div>
          <div className="rounded-[22px] border border-white/10 bg-white/10 p-4">
            <p className="text-[10px] font-black uppercase tracking-[2px] text-white/40">speaker note</p>
            <p className="mt-2 text-[12px] font-semibold leading-relaxed text-white/75">{slide.speakerNotes}</p>
          </div>
        </div>
        <div className="grid content-center gap-3">
          {slide.bullets.slice(0, 4).map((bullet, bulletIndex) => (
            <div key={bulletIndex} className="rounded-[20px] border border-white/10 bg-white/[0.06] p-4">
              <p className="text-[10px] font-black uppercase tracking-[1px]" style={{ color: accent }}>evidence {bulletIndex + 1}</p>
              <p className="mt-1 text-[14px] font-bold leading-snug text-white/85">{bullet}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function ReportBlockRenderer({ blocks = [] }: ReportBlockRendererProps) {
  if (!Array.isArray(blocks) || blocks.length === 0) return null;

  return (
    <div className="report-blocks mb-10 space-y-5">
      {blocks.map((block, index) => {
        if (block.type === "overview") {
          return (
            <section key={`${block.type}-${index}`} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <p className="text-[10px] font-black uppercase tracking-[2px] text-primary/40 mb-2">Generated Overview</p>
              <h2 className="text-[22px] font-display text-primary lowercase leading-tight mb-3">{block.title}</h2>
              <p className="text-[14px] leading-relaxed font-semibold text-gray-700">{block.body}</p>
              {block.meta && block.meta.length > 0 && (
                <div className="grid grid-cols-2 gap-3 mt-5">
                  {block.meta.map((item) => (
                    <div key={item.label} className="rounded-xl bg-gray-50 p-3">
                      <p className="text-[9px] font-black uppercase tracking-[1px] text-gray-400">{item.label}</p>
                      <p className="text-[12px] font-bold text-gray-700 mt-1">{item.value}</p>
                    </div>
                  ))}
                </div>
              )}
            </section>
          );
        }

        if (block.type === "key_points") {
          return (
            <section key={`${block.type}-${index}`} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <h3 className="text-[13px] font-black uppercase tracking-[2px] text-primary/50 mb-4">{block.title}</h3>
              <div className="grid gap-3">
                {block.points.map((point, pointIndex) => (
                  <div key={pointIndex} className={`rounded-xl border p-4 ${statusClass(pointIndex)}`}>
                    <p className="text-[11px] font-black text-primary/40 uppercase tracking-[1px] mb-1">Point {pointIndex + 1}</p>
                    <p className="text-[14px] leading-relaxed font-semibold text-gray-800">{point}</p>
                  </div>
                ))}
              </div>
            </section>
          );
        }

        if (block.type === "info_table") {
          return (
            <section key={`${block.type}-${index}`} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <h3 className="text-[13px] font-black uppercase tracking-[2px] text-primary/50 mb-4">{block.title}</h3>
              <div className="divide-y divide-gray-100">
                {block.rows.map((row) => (
                  <div key={row.label} className="grid grid-cols-[150px_1fr] gap-4 py-3">
                    <p className="text-[11px] font-black uppercase tracking-[1px] text-gray-400">{row.label}</p>
                    <p className="text-[13px] font-bold text-gray-700 break-words">{row.value}</p>
                  </div>
                ))}
              </div>
            </section>
          );
        }

        if (block.type === "action_list") {
          return (
            <section key={`${block.type}-${index}`} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <h3 className="text-[13px] font-black uppercase tracking-[2px] text-primary/50 mb-4">{block.title}</h3>
              <div className="grid md:grid-cols-3 gap-3">
                {block.actions.map((action) => (
                  <div key={action.label} className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                    <p className="text-[13px] font-black text-primary mb-2">{action.label}</p>
                    <p className="text-[12px] leading-relaxed font-semibold text-gray-600">{action.detail}</p>
                  </div>
                ))}
              </div>
            </section>
          );
        }

        if (block.type === "faq") {
          return (
            <section key={`${block.type}-${index}`} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <h3 className="text-[13px] font-black uppercase tracking-[2px] text-primary/50 mb-4">{block.title}</h3>
              <div className="space-y-3">
                {block.items.map((item) => (
                  <div key={item.question} className="rounded-xl border border-gray-100 p-4">
                    <p className="text-[13px] font-black text-gray-900 mb-2">{item.question}</p>
                    <p className="text-[13px] leading-relaxed font-semibold text-gray-600">{item.answer}</p>
                  </div>
                ))}
              </div>
            </section>
          );
        }

        if (block.type === "flashcards") {
          return (
            <section key={`${block.type}-${index}`} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <h3 className="text-[13px] font-black uppercase tracking-[2px] text-primary/50 mb-4">{block.title}</h3>
              <FlashcardGrid cards={block.cards} />
            </section>
          );
        }

        if (block.type === "quiz") {
          return (
            <section key={`${block.type}-${index}`} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <h3 className="text-[13px] font-black uppercase tracking-[2px] text-primary/50 mb-4">{block.title}</h3>
              <QuizPanel questions={block.questions} />
            </section>
          );
        }

        if (block.type === "mind_map") {
          return (
            <section key={`${block.type}-${index}`} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <h3 className="text-[13px] font-black uppercase tracking-[2px] text-primary/50 mb-4">{block.title}</h3>
              <div className="rounded-2xl bg-gray-50 p-5">
                <div className="mx-auto mb-5 w-fit rounded-full bg-primary px-5 py-3 text-[14px] font-black text-white shadow-sm">
                  {block.root.label}
                </div>
                <div className="grid md:grid-cols-2 gap-3">
                  {block.root.children.map((child, childIndex) => (
                    <div key={`${child.label}-${childIndex}`} className="rounded-xl border border-gray-100 bg-white p-4">
                      <p className="text-[13px] font-black text-primary mb-2">{child.label}</p>
                      {child.children && child.children.length > 0 && (
                        <ul className="space-y-1 pl-4 list-disc">
                          {child.children.map((grandchild, grandchildIndex) => (
                            <li key={`${grandchild.label}-${grandchildIndex}`} className="text-[12px] font-semibold text-gray-600">{grandchild.label}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </section>
          );
        }

        if (block.type === "presentation_deck") {
          const accent = block.designSystem?.palette?.[0] || "#4F46E5";
          return (
            <section key={`${block.type}-${index}`} className="rounded-[32px] border-2 border-gray-950 bg-white p-4 md:p-6 shadow-[0_8px_0_0_#CFCFCF]">
              <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[2px] text-primary/40">slide deck plan</p>
                  <h2 className="mt-2 text-[32px] md:text-[44px] font-display lowercase leading-none text-primary">{block.title}</h2>
                  {block.subtitle && <p className="mt-3 max-w-2xl text-[13px] font-bold leading-relaxed text-gray-500">{block.subtitle}</p>}
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full border border-primary/15 bg-primary/[0.04] px-3 py-1.5 text-[10px] font-black uppercase tracking-[1px] text-primary">{block.theme}</span>
                  <span className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1.5 text-[10px] font-black uppercase tracking-[1px] text-gray-500">{block.audience}</span>
                </div>
              </div>

              {block.designSystem && (
                <div className="mb-6 grid gap-3 lg:grid-cols-[1fr_1.4fr]">
                  <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                    <p className="mb-3 text-[10px] font-black uppercase tracking-[2px] text-gray-400">palette</p>
                    <div className="flex flex-wrap gap-2">
                      {(block.designSystem.palette || []).map((color) => (
                        <div key={color} className="flex items-center gap-2 rounded-full bg-white px-2.5 py-2 shadow-sm">
                          <span className="h-5 w-5 rounded-full border border-gray-200" style={{ backgroundColor: color }} />
                          <span className="text-[10px] font-black uppercase tracking-[1px] text-gray-500">{color}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                    <p className="mb-2 text-[10px] font-black uppercase tracking-[2px] text-gray-400">deck system</p>
                    <p className="text-[13px] font-bold leading-relaxed text-gray-700">{block.designSystem.typography || "Clean presentation typography."}</p>
                    <p className="mt-1 text-[12px] font-bold text-primary">{block.designSystem.layoutStyle || block.theme}</p>
                  </div>
                </div>
              )}

              <div className="grid gap-6">
                {block.slides.map((slide) => (
                  <SlideCanvas
                    key={`${slide.slideNumber}-${slide.title}`}
                    slide={slide}
                    index={slide.slideNumber - 1}
                    total={block.slides.length}
                    accent={accent}
                    sourceVisual={block.sourceVisual}
                    sourceUrl={block.sourceUrl}
                  />
                ))}
              </div>
            </section>
          );
        }

        return null;
      })}
    </div>
  );
}
