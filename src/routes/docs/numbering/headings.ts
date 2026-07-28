/**
 * Heading scanning and the one-time de-numbering migration.
 *
 * Everything here operates on raw Markdown text and is deliberately pure, so it
 * can be reused by the renderer, the editor's live outline, the export path and
 * the migration without any of them sharing state.
 *
 * Fenced code blocks are tracked throughout: a `## comment` inside a code sample
 * is never mistaken for a heading.
 */

/** `##` through `####`. `#` is the document title and is never numbered. */
export const MIN_DEPTH = 2;
export const MAX_DEPTH = 4;

export interface HeadingLine {
  /** Zero-based index into the source's lines. */
  line: number;
  /** 2 for `##`, 3 for `###`, 4 for `####`. */
  depth: number;
  /** Heading text with the `#` markers stripped. */
  text: string;
}

const HEADING_PATTERN = /^(#{2,4})\s+(.*\S)\s*$/;
const FENCE_PATTERN = /^\s*(```|~~~)/;

/**
 * A leading manual number such as `3`, `3.2` or `3.2.1`, with an optional
 * trailing dot. Anchored to the start of the heading text so it can only ever
 * match a numeric prefix — `Appendix A` and `802.11 Overview` are untouched
 * because the latter is not followed by whitespace at the right position.
 */
const MANUAL_NUMBER_PATTERN = /^\d+(?:\.\d+)*\.?\s+/;

/** Scans Markdown for numberable headings, in document order. */
export function scanHeadings(markdown: string): HeadingLine[] {
  const headings: HeadingLine[] = [];
  let inFence = false;

  markdown.split(/\r?\n/).forEach((line, index) => {
    if (FENCE_PATTERN.test(line)) {
      inFence = !inFence;
      return;
    }
    if (inFence) return;

    const match = HEADING_PATTERN.exec(line);
    if (!match) return;

    headings.push({
      line: index,
      depth: match[1].length,
      text: match[2],
    });
  });

  return headings;
}

/** True when any heading still carries a hand-maintained number. */
export function hasManualHeadingNumbers(markdown: string): boolean {
  return scanHeadings(markdown).some((heading) =>
    MANUAL_NUMBER_PATTERN.test(heading.text),
  );
}

/**
 * Migration: removes manual numeric prefixes from headings.
 *
 * Only heading lines are rewritten. Numbered lists, tables, and any text inside
 * fenced code are left exactly as they were — this is why the migration scans
 * line by line rather than running a global replace.
 */
export function stripManualHeadingNumbers(markdown: string): string {
  const lines = markdown.split(/\r?\n/);
  let inFence = false;

  const next = lines.map((line) => {
    if (FENCE_PATTERN.test(line)) {
      inFence = !inFence;
      return line;
    }
    if (inFence) return line;

    const match = HEADING_PATTERN.exec(line);
    if (!match) return line;

    const text = match[2].replace(MANUAL_NUMBER_PATTERN, '');
    return text ? `${match[1]} ${text}` : line;
  });

  return next.join('\n');
}
