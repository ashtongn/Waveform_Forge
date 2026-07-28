import { buildTextIndex, type TextIndex } from './textOffsets';
import type { HighlightRange } from './types';

/**
 * HighlightOverlay (DOM layer).
 *
 * Paints character ranges into already-rendered Markdown by splitting text nodes
 * and wrapping the covered segments in `<span data-wf-highlight>`.
 *
 * Why wrap instead of drawing absolutely-positioned rectangles?
 *  - highlights reflow perfectly with the text (tables, code blocks, wrapping)
 *  - they are hit-testable, so clicking a highlight can open its thread
 *  - no scroll/resize recalculation, which matters for very long documents
 *
 * Overlapping ranges are handled by splitting at every boundary, so a segment
 * covered by two comments simply carries both ids.
 *
 * IMPORTANT: this mutates DOM that React rendered. The Markdown output is
 * memoized so React never re-reconciles it while highlights are applied, and
 * `clearHighlights` fully restores the original text nodes before any change.
 */

const HIGHLIGHT_ATTRIBUTE = 'data-wf-highlight';

const KIND_CLASS: Record<HighlightRange['kind'], string> = {
  comment: 'wf-hl wf-hl--comment',
  resolved: 'wf-hl wf-hl--resolved',
  search: 'wf-hl wf-hl--search',
  'search-active': 'wf-hl wf-hl--search-active',
};

/** Removes every highlight wrapper and re-merges the split text nodes. */
export function clearHighlights(root: HTMLElement): void {
  const wrappers = root.querySelectorAll<HTMLElement>(`[${HIGHLIGHT_ATTRIBUTE}]`);
  wrappers.forEach((wrapper) => {
    const parent = wrapper.parentNode;
    if (!parent) return;
    parent.replaceChild(document.createTextNode(wrapper.textContent ?? ''), wrapper);
  });
  if (wrappers.length > 0) root.normalize();
}

/**
 * Applies `ranges` to `root`.
 *
 * Returns a freshly built text index so callers can reuse it for scrolling or
 * selection mapping without a second traversal.
 */
export function applyHighlights(
  root: HTMLElement,
  ranges: HighlightRange[],
): TextIndex {
  clearHighlights(root);
  const index = buildTextIndex(root);
  if (ranges.length === 0) return index;

  // Text nodes and ranges are both in ascending offset order, so a single
  // moving cursor keeps this linear instead of O(nodes x ranges) — which
  // matters when a broad search query produces thousands of hits.
  const sorted = [...ranges].sort((a, b) => a.start - b.start);
  let cursor = 0;

  // Group work per text node so each node is rewritten at most once.
  for (const entry of index.entries) {
    while (cursor < sorted.length && sorted[cursor].end <= entry.start) cursor += 1;

    const overlapping: HighlightRange[] = [];
    for (let i = cursor; i < sorted.length && sorted[i].start < entry.end; i += 1) {
      if (sorted[i].end > entry.start) overlapping.push(sorted[i]);
    }
    if (overlapping.length === 0) continue;

    const boundaries = new Set<number>([entry.start, entry.end]);
    for (const range of overlapping) {
      if (range.start > entry.start) boundaries.add(range.start);
      if (range.end < entry.end) boundaries.add(range.end);
    }

    const points = Array.from(boundaries).sort((a, b) => a - b);
    const fragment = document.createDocumentFragment();
    const value = entry.node.nodeValue ?? '';

    for (let i = 0; i < points.length - 1; i += 1) {
      const from = points[i];
      const to = points[i + 1];
      const slice = value.slice(from - entry.start, to - entry.start);
      if (!slice) continue;

      const covering = overlapping.filter(
        (range) => range.start <= from && range.end >= to,
      );

      if (covering.length === 0) {
        fragment.appendChild(document.createTextNode(slice));
        continue;
      }

      fragment.appendChild(createWrapper(slice, covering));
    }

    entry.node.parentNode?.replaceChild(fragment, entry.node);
  }

  // The tree changed, so hand back a rebuilt index.
  return buildTextIndex(root);
}

function createWrapper(text: string, covering: HighlightRange[]): HTMLElement {
  const span = document.createElement('span');
  span.setAttribute(HIGHLIGHT_ATTRIBUTE, '');
  span.textContent = text;

  const classes = new Set<string>();
  for (const range of covering) {
    KIND_CLASS[range.kind].split(' ').forEach((token) => classes.add(token));
  }
  span.className = Array.from(classes).join(' ');

  const commentIds = covering
    .filter((range) => range.kind === 'comment' || range.kind === 'resolved')
    .map((range) => range.id);

  if (commentIds.length > 0) {
    span.setAttribute('data-wf-thread', commentIds.join(' '));
    span.setAttribute('role', 'button');
    span.setAttribute('tabindex', '0');
    span.setAttribute(
      'aria-label',
      `Highlighted text with ${commentIds.length} comment thread${
        commentIds.length === 1 ? '' : 's'
      }`,
    );
  }

  const searchId = covering.find((range) => range.kind === 'search-active')?.id;
  if (searchId) span.setAttribute('data-wf-search-active', searchId);

  return span;
}
