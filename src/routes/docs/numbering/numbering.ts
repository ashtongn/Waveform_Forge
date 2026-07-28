import { MAX_DEPTH, MIN_DEPTH, scanHeadings } from './headings';

/**
 * The numbering engine.
 *
 * Numbers are derived from document structure and never stored. This is the
 * LaTeX model: authors write `### SDR Basics`, the renderer displays `1.2 SDR
 * Basics`, and inserting a heading renumbers everything after it for free.
 *
 * The engine is a pure fold over the document, which is what makes the rest of
 * the system simple:
 *
 *  - the document is split into independently rendered sections, so numbering
 *    is computed once at the document level and handed to each section as a
 *    list of labels;
 *  - the editor can number a *draft* by folding from the counter state that
 *    section starts at, so the preview updates as you type without needing the
 *    rest of the document;
 *  - the table of contents reads the same generated labels, so the two can
 *    never disagree.
 *
 * Extension points for later work (cross-references, promote/demote,
 * drag-and-drop reordering, figure and table numbering, PDF export) all reduce
 * to changing the section contents and re-folding — no consumer needs to know
 * how a label was produced.
 */

/** Counter values carried between sections. Index 0 is `##`. */
export type CounterState = readonly number[];

export const INITIAL_COUNTERS: CounterState = [0, 0, 0];

export interface NumberedHeading {
  depth: number;
  /** Heading text exactly as authored, with no number. */
  text: string;
  /** Generated label, e.g. `3.2.1`. */
  label: string;
}

export interface NumberingResult {
  headings: NumberedHeading[];
  /** Counter state after this chunk, to be fed into the next one. */
  end: CounterState;
}

/** Numbers one chunk of Markdown, continuing from `start`. */
export function numberMarkdown(
  markdown: string,
  start: CounterState = INITIAL_COUNTERS,
): NumberingResult {
  const counters = [...start];
  const headings: NumberedHeading[] = [];

  for (const heading of scanHeadings(markdown)) {
    const index = heading.depth - MIN_DEPTH;
    if (index < 0 || index > MAX_DEPTH - MIN_DEPTH) continue;

    counters[index] += 1;
    // Every deeper counter restarts beneath a new parent.
    for (let deeper = index + 1; deeper < counters.length; deeper += 1) {
      counters[deeper] = 0;
    }

    headings.push({
      depth: heading.depth,
      text: heading.text,
      label: counters.slice(0, index + 1).join('.'),
    });
  }

  return { headings, end: counters };
}

export interface SectionNumbering {
  /** Labels for this section's headings, in document order. */
  labels: string[];
  /** Counter state entering the section, so a draft can be renumbered live. */
  start: CounterState;
}

export interface NumberableSection {
  id: string;
  content: string;
}

/**
 * Folds the numbering across every section of the document.
 *
 * Returns per-section results keyed by section id so each memoized section can
 * receive only its own labels and re-render independently.
 */
export function numberSections(
  sections: NumberableSection[],
): Map<string, SectionNumbering> {
  const result = new Map<string, SectionNumbering>();
  let counters = INITIAL_COUNTERS;

  for (const section of sections) {
    const start = counters;
    const { headings, end } = numberMarkdown(section.content, start);
    result.set(section.id, { labels: headings.map((h) => h.label), start });
    counters = end;
  }

  return result;
}
