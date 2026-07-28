import { MIN_DEPTH, scanNumberedItems, type ItemKind } from './scan';

/**
 * The numbering engine.
 *
 * Numbers are derived from document structure and never stored. This is the
 * LaTeX model: authors write `### SDR Basics`, the renderer displays
 * `1.2 SDR Basics`, and inserting anything renumbers everything below it.
 *
 * The engine is a pure fold, which is what keeps the rest of the system simple:
 *
 *  - the document is split into independently rendered sections, so the fold
 *    runs once and hands each section its own labels;
 *  - the editor numbers a *draft* by folding from the state that section starts
 *    at, so the preview updates as you type without the rest of the document;
 *  - the table of contents consumes the same labels, so they cannot disagree.
 *
 * Extension points for later work — cross-references, promote/demote,
 * drag-and-drop reordering, figure and table numbering, PDF export — all reduce
 * to changing section content and re-folding. No consumer needs to know how a
 * label was produced.
 */

/**
 * Fold state carried between sections.
 *
 * `topLabel` is a string rather than a number because appendices are lettered:
 * once appendix mode begins the top level counts `A`, `B`, `C`, and children
 * become `A.1`, `A.2`.
 */
export interface NumberingState {
  readonly sectionIndex: number;
  readonly appendixIndex: number;
  /** Label carried by the current top-level section, e.g. `3` or `A`. */
  readonly topLabel: string | null;
  /** Counters for depths 3..6. */
  readonly counters: readonly number[];
}

export const INITIAL_STATE: NumberingState = {
  sectionIndex: 0,
  appendixIndex: 0,
  topLabel: null,
  counters: [0, 0, 0, 0],
};

export interface NumberedLabel {
  kind: ItemKind;
  depth: number;
  text: string;
  /**
   * Generated label, or null when the item is intentionally unnumbered —
   * appendix top-level headings, whose text already reads "Appendix A".
   */
  label: string | null;
}

export interface NumberingResult {
  labels: NumberedLabel[];
  end: NumberingState;
}

/** Numbers one chunk of Markdown, continuing from `start`. */
export function numberMarkdown(
  markdown: string,
  start: NumberingState = INITIAL_STATE,
): NumberingResult {
  let sectionIndex = start.sectionIndex;
  let appendixIndex = start.appendixIndex;
  let topLabel = start.topLabel;
  const counters = [...start.counters];

  const labels: NumberedLabel[] = [];

  for (const item of scanNumberedItems(markdown)) {
    let label: string | null;

    if (item.depth === MIN_DEPTH) {
      counters.fill(0);

      if (item.appendix) {
        appendixIndex += 1;
        topLabel = appendixLetter(appendixIndex);
        // The heading text already reads "Appendix A"; numbering it as well
        // would render "A Appendix A". Its children still inherit the letter.
        label = null;
      } else {
        sectionIndex += 1;
        topLabel = String(sectionIndex);
        label = topLabel;
      }
    } else {
      const index = item.depth - MIN_DEPTH - 1;
      counters[index] += 1;
      for (let deeper = index + 1; deeper < counters.length; deeper += 1) {
        counters[deeper] = 0;
      }
      label = [topLabel ?? '', ...counters.slice(0, index + 1)].join('.');
    }

    labels.push({ kind: item.kind, depth: item.depth, text: item.text, label });
  }

  return {
    labels,
    end: { sectionIndex, appendixIndex, topLabel, counters },
  };
}

/** 1 -> A, 2 -> B, ... 27 -> AA. */
export function appendixLetter(index: number): string {
  let remaining = index;
  let out = '';
  while (remaining > 0) {
    out = String.fromCharCode(65 + ((remaining - 1) % 26)) + out;
    remaining = Math.floor((remaining - 1) / 26);
  }
  return out;
}

export interface SectionNumbering {
  /** Labels for this section's numbered items, in document order. */
  labels: Array<string | null>;
  /** Fold state entering the section, so a draft can be renumbered live. */
  start: NumberingState;
}

export interface NumberableSection {
  id: string;
  content: string;
}

/** Folds the numbering across every section of the document. */
export function numberSections(
  sections: NumberableSection[],
): Map<string, SectionNumbering> {
  const result = new Map<string, SectionNumbering>();
  let state = INITIAL_STATE;

  for (const section of sections) {
    const start = state;
    const { labels, end } = numberMarkdown(section.content, start);
    result.set(section.id, { labels: labels.map((item) => item.label), start });
    state = end;
  }

  return result;
}
