/**
 * Structural scanner.
 *
 * The document numbers two kinds of thing, and they share counters:
 *
 *  - **headings** — `##` through `######`
 *  - **clauses**  — top-level ordered-list items, the numbered prose paragraphs
 *    an engineering specification is built from
 *
 * Sharing counters is what reproduces real specification numbering. In a section
 * that opens with clauses `3.1`–`3.4` and then introduces a sub-heading, that
 * heading is `3.5` — not `3.1` — because both occupy one sequence at that depth.
 *
 * A clause's depth follows its list nesting: a top-level clause sits one below
 * the nearest heading, and each level of indentation goes one deeper. So under
 * `## Audience`, clauses read `3.1`, `3.2`, and a nested list inside `3.1` reads
 * `3.1.1`, `3.1.2`.
 *
 * Ordered lists are clauses; bullet lists are ordinary lists and keep their
 * markers, which is the escape hatch for step-by-step instructions that should
 * not be clause-numbered.
 */

export const MIN_DEPTH = 2;
export const MAX_DEPTH = 6;

/**
 * Switches numbering into appendix mode, LaTeX's `\appendix`. Everything after
 * it is lettered: `Appendix A` with children `A.1`, `A.2`.
 */
export const APPENDIX_MARKER = '<!-- appendix -->';

export type ItemKind = 'heading' | 'clause';

export interface NumberedItem {
  /** Zero-based index into the source's lines. */
  line: number;
  kind: ItemKind;
  /** 2 = `##`. Clauses sit one below their nearest heading. */
  depth: number;
  /** Authored text, with no number. */
  text: string;
  /** True once the appendix marker has been seen. */
  appendix: boolean;
}

const HEADING_PATTERN = /^(#{2,6})\s+(.*\S)\s*$/;
/** Ordered-list item, with any leading indentation captured. */
const CLAUSE_PATTERN = /^(\s*)\d+\.\s+(.*\S)\s*$/;
const FENCE_PATTERN = /^\s*(```|~~~)/;

/**
 * Columns of indentation per nesting level.
 *
 * A `1. ` marker puts its content at column 3, so a nested list must be indented
 * to at least that column. Dividing by it recovers the nesting level for the
 * 3- and 4-space conventions alike.
 */
export const INDENT_PER_LEVEL = 3;

export function scanNumberedItems(markdown: string): NumberedItem[] {
  const items: NumberedItem[] = [];
  let inFence = false;
  let appendix = false;
  let headingDepth = MIN_DEPTH;

  markdown.split(/\r?\n/).forEach((line, index) => {
    if (FENCE_PATTERN.test(line)) {
      inFence = !inFence;
      return;
    }
    if (inFence) return;

    if (line.trim() === APPENDIX_MARKER) {
      appendix = true;
      return;
    }

    const heading = HEADING_PATTERN.exec(line);
    if (heading) {
      headingDepth = heading[1].length;
      items.push({
        line: index,
        kind: 'heading',
        depth: headingDepth,
        text: heading[2],
        appendix,
      });
      return;
    }

    const clause = CLAUSE_PATTERN.exec(line);
    if (clause) {
      const nesting = Math.floor(clause[1].length / INDENT_PER_LEVEL);
      items.push({
        line: index,
        kind: 'clause',
        depth: Math.min(headingDepth + 1 + nesting, MAX_DEPTH),
        text: clause[2],
        appendix,
      });
    }
  });

  return items;
}

/** True when the document enters appendix mode at some point. */
export function hasAppendixMarker(markdown: string): boolean {
  return markdown.split(/\r?\n/).some((line) => line.trim() === APPENDIX_MARKER);
}
