/**
 * One-time migration from hand-maintained numbering to generated numbering.
 *
 * Legacy documents carry their numbers as literal text in two forms, and they
 * must be treated differently:
 *
 *  - `## 6.3 Core Training Requirements` — a numbered **heading**. Drop the
 *    prefix; the renderer regenerates it.
 *  - `6.3.1. Waveform Development Flight Mission` — a numbered **line** that is
 *    really one of two things:
 *      * a *title* (short, no terminal punctuation) followed by its body, which
 *        is a heading that was never marked up as one;
 *      * a *clause* (a full sentence), which is a numbered paragraph.
 *
 * Titles become real headings at the depth their number implies, so they join
 * the outline and the table of contents. Clauses become ordered-list items,
 * nested to match their number: `3.1.1` under `3.1` becomes an indented item
 * inside it, so the renderer can regenerate the same hierarchy.
 *
 * Everything else is left strictly alone: tables, bullet lists, indented lists
 * and anything inside a fenced code block are never rewritten.
 */

import { INDENT_PER_LEVEL } from './scan';

const HEADING_PATTERN = /^(#{2,6})\s+(.*\S)\s*$/;
const MANUAL_HEADING_NUMBER = /^\d+(?:\.\d+)*\.?\s+/;
/** A legacy numbered line: at least two groups, e.g. `1.1.` or `6.3.1.`. */
const LEGACY_NUMBERED_LINE = /^(\d+(?:\.\d+)+)\.\s+(.*\S)\s*$/;
const FENCE_PATTERN = /^\s*(```|~~~)/;

/**
 * Distinguishes a title from a clause.
 *
 * Terminal punctuation is the signal: a clause is prose and ends in a full
 * stop, colon or semicolon; a title does not. Question and exclamation marks
 * are deliberately *not* terminal markers here, because titles legitimately use
 * them — the training plan's `Who Is Fourier?` is a section title.
 *
 * Measured against the real training plan this separates the two groups without
 * overlap: 107 titles (longest 103 characters) and 41 clauses (shortest 44,
 * median 307). Every original number regenerates exactly, which is the real
 * proof. The length ceiling is only a guard against unpunctuated prose in
 * future edits; nothing in the document approaches it.
 */
const MAX_TITLE_LENGTH = 160;

export function looksLikeTitle(text: string): boolean {
  return !/[.:;]$/.test(text) && text.length <= MAX_TITLE_LENGTH;
}

export interface MigrationChange {
  line: number;
  from: string;
  to: string;
  /** The manual number that was removed, for verification. */
  originalNumber: string | null;
  becomes: 'heading' | 'clause';
}

export interface MigrationResult {
  markdown: string;
  changes: MigrationChange[];
}

/** True when the Markdown still carries any hand-maintained numbering. */
export function needsNumberingMigration(markdown: string): boolean {
  return migrateManualNumbering(markdown).changes.length > 0;
}

export function migrateManualNumbering(markdown: string): MigrationResult {
  const lines = markdown.split(/\r?\n/);
  const changes: MigrationChange[] = [];
  let inFence = false;

  /**
   * Group count of the shallowest clause under the current heading. Anything
   * deeper than this is a sub-clause and gets indented by that difference.
   * Reset whenever a heading is emitted, since a new heading restarts the
   * clause hierarchy beneath it.
   */
  let baseGroups: number | null = null;

  const next = lines.map((line, index) => {
    if (FENCE_PATTERN.test(line)) {
      inFence = !inFence;
      return line;
    }
    if (inFence) return line;

    // 1. Numbered headings: strip the prefix, keep the level.
    const heading = HEADING_PATTERN.exec(line);
    if (heading) {
      baseGroups = null;

      const number = MANUAL_HEADING_NUMBER.exec(heading[2])?.[0];
      if (!number) return line;

      const text = heading[2].slice(number.length);
      if (!text) return line;

      const replacement = `${heading[1]} ${text}`;
      changes.push({
        line: index,
        from: line,
        to: replacement,
        originalNumber: number.trim().replace(/\.$/, ''),
        becomes: 'heading',
      });
      return replacement;
    }

    // 2. Legacy numbered lines: promote titles, listify clauses.
    const numbered = LEGACY_NUMBERED_LINE.exec(line);
    if (!numbered) return line;

    const [, number, text] = numbered;
    const groups = number.split('.').length;

    if (looksLikeTitle(text)) {
      baseGroups = null;
      // `6.3.1` has three groups, so it belongs at depth 4 (`####`).
      const depth = Math.min(groups + 1, 6);
      const replacement = `${'#'.repeat(depth)} ${text}`;
      changes.push({
        line: index,
        from: line,
        to: replacement,
        originalNumber: number,
        becomes: 'heading',
      });
      return replacement;
    }

    if (baseGroups === null) baseGroups = groups;
    const indent = ' '.repeat(Math.max(0, groups - baseGroups) * INDENT_PER_LEVEL);

    // Ordered-list items only need a `1.` marker; the rendered number is
    // generated, so the literal digit is irrelevant.
    const replacement = `${indent}1. ${text}`;
    changes.push({
      line: index,
      from: line,
      to: replacement,
      originalNumber: number,
      becomes: 'clause',
    });
    return replacement;
  });

  return { markdown: next.join('\n'), changes };
}
