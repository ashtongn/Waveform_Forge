import type { AnchorResolution, TextAnchor } from './types';

/**
 * AnchorResolver — creates and re-locates text anchors.
 *
 * Resolution strategy, in order (first success wins):
 *
 *  1. **Position check** — the stored offsets still contain the exact quote.
 *     O(1), covers the overwhelmingly common "document did not change" case.
 *  2. **Quote search with context scoring** — find every occurrence of the exact
 *     quote and score each by how much of the stored prefix/suffix it reproduces,
 *     with a small tie-break bonus for proximity to the original offset.
 *  3. **Normalized fuzzy search** — retry against a whitespace-collapsed,
 *     case-folded projection of the document, then map the hit back to real
 *     offsets. Survives reflow, casing and punctuation-spacing edits.
 *  4. **Orphan** — the anchored text is gone. The comment is preserved and shown
 *     in the sidebar as "detached" rather than being deleted.
 *
 * Deliberately dependency-free and pure so it is trivially unit-testable.
 */

/** Number of context characters captured on each side of a highlight. */
export const CONTEXT_LENGTH = 40;

/** FNV-1a — small, fast, non-cryptographic. Used only for drift detection. */
export function checksum(value: string): string {
  let hash = 0x811c9dc5;
  const normalized = normalizeWhitespace(value);
  for (let i = 0; i < normalized.length; i += 1) {
    hash ^= normalized.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(16).padStart(8, '0');
}

export function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

/** Builds a durable anchor for `[start, end)` inside `documentText`. */
export function createAnchor(
  documentText: string,
  start: number,
  end: number,
): TextAnchor {
  const exact = documentText.slice(start, end);
  return {
    exact,
    prefix: documentText.slice(Math.max(0, start - CONTEXT_LENGTH), start),
    suffix: documentText.slice(end, Math.min(documentText.length, end + CONTEXT_LENGTH)),
    start,
    end,
    checksum: checksum(exact),
  };
}

/** Re-locates `anchor` inside the current `documentText`. */
export function resolveAnchor(
  anchor: TextAnchor,
  documentText: string,
): AnchorResolution {
  if (!anchor.exact) return { status: 'orphan' };

  // 1. Fast path — offsets are still correct.
  if (documentText.slice(anchor.start, anchor.end) === anchor.exact) {
    return { status: 'exact', start: anchor.start, end: anchor.end };
  }

  // 2. Exact quote occurrences, ranked by surrounding context.
  const occurrences = findAll(documentText, anchor.exact);
  if (occurrences.length > 0) {
    const best = pickBestOccurrence(documentText, anchor, occurrences);
    return {
      status: best.contextScore > 0 || occurrences.length === 1 ? 'exact' : 'approximate',
      start: best.index,
      end: best.index + anchor.exact.length,
    };
  }

  // 3. Fuzzy, whitespace/case-insensitive retry.
  const fuzzy = resolveFuzzy(anchor, documentText);
  if (fuzzy) return { status: 'approximate', ...fuzzy };

  // 4. Give up — keep the comment, mark it detached.
  return { status: 'orphan' };
}

function findAll(haystack: string, needle: string): number[] {
  const hits: number[] = [];
  let from = 0;
  // Cap the number of candidates so a one-word quote in a huge document
  // cannot turn resolution into a pathological scan.
  while (hits.length < 500) {
    const index = haystack.indexOf(needle, from);
    if (index === -1) break;
    hits.push(index);
    from = index + 1;
  }
  return hits;
}

function pickBestOccurrence(
  documentText: string,
  anchor: TextAnchor,
  occurrences: number[],
): { index: number; contextScore: number } {
  let best = { index: occurrences[0], contextScore: -1, distance: Number.MAX_SAFE_INTEGER };

  for (const index of occurrences) {
    const prefix = documentText.slice(Math.max(0, index - CONTEXT_LENGTH), index);
    const suffix = documentText.slice(
      index + anchor.exact.length,
      index + anchor.exact.length + CONTEXT_LENGTH,
    );
    const contextScore =
      commonSuffixLength(prefix, anchor.prefix) + commonPrefixLength(suffix, anchor.suffix);
    const distance = Math.abs(index - anchor.start);

    if (
      contextScore > best.contextScore ||
      (contextScore === best.contextScore && distance < best.distance)
    ) {
      best = { index, contextScore, distance };
    }
  }

  return { index: best.index, contextScore: best.contextScore };
}

function commonPrefixLength(a: string, b: string): number {
  const max = Math.min(a.length, b.length);
  let i = 0;
  while (i < max && a[i] === b[i]) i += 1;
  return i;
}

function commonSuffixLength(a: string, b: string): number {
  const max = Math.min(a.length, b.length);
  let i = 0;
  while (i < max && a[a.length - 1 - i] === b[b.length - 1 - i]) i += 1;
  return i;
}

/**
 * Whitespace-collapsed, case-folded search.
 *
 * We build a projection of the document alongside an index map so a hit in the
 * normalized string can be translated back into real document offsets.
 */
function resolveFuzzy(
  anchor: TextAnchor,
  documentText: string,
): { start: number; end: number } | null {
  const needle = normalizeWhitespace(anchor.exact).toLowerCase();
  if (needle.length < 4) return null;

  const { normalized, map } = normalizeWithMap(documentText);
  const hit = normalized.indexOf(needle);
  if (hit === -1) return null;

  const start = map[hit];
  const lastIndex = map[hit + needle.length - 1];
  if (start === undefined || lastIndex === undefined) return null;
  return { start, end: lastIndex + 1 };
}

function normalizeWithMap(value: string): { normalized: string; map: number[] } {
  let normalized = '';
  const map: number[] = [];
  let pendingSpace = false;

  for (let i = 0; i < value.length; i += 1) {
    const char = value[i];
    if (/\s/.test(char)) {
      pendingSpace = normalized.length > 0;
      continue;
    }
    if (pendingSpace) {
      normalized += ' ';
      map.push(i);
      pendingSpace = false;
    }
    normalized += char.toLowerCase();
    map.push(i);
  }

  return { normalized, map };
}
