/**
 * DOM <-> character-offset utilities.
 *
 * Every anchoring and highlighting operation works against a single flat
 * "document text" string: the concatenation of every text node inside the
 * rendered Markdown container, in document order.
 *
 * Because both anchoring and painting use the exact same traversal, offsets are
 * always consistent — even after we have wrapped parts of the document in
 * highlight <span> elements (wrapping changes the element tree but never the
 * text content).
 */

export interface TextNodeEntry {
  node: Text;
  /** Inclusive start offset of this node inside the flat document text. */
  start: number;
  /** Exclusive end offset. */
  end: number;
}

export interface TextIndex {
  entries: TextNodeEntry[];
  text: string;
}

/** Elements marked with this attribute are excluded from the text index. */
const IGNORE_ATTRIBUTE = 'data-wf-ignore';

/**
 * Walks `root` and builds the flat text index.
 *
 * Text inside `[data-wf-ignore]` subtrees (UI chrome injected into the document
 * flow, e.g. heading anchor buttons) is skipped so it can never shift offsets.
 */
export function buildTextIndex(root: HTMLElement): TextIndex {
  const entries: TextNodeEntry[] = [];
  let offset = 0;
  let text = '';

  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const parent = node.parentElement;
      if (!parent) return NodeFilter.FILTER_REJECT;
      if (parent.closest(`[${IGNORE_ATTRIBUTE}]`)) return NodeFilter.FILTER_REJECT;
      if (!node.nodeValue) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    },
  });

  let current = walker.nextNode() as Text | null;
  while (current) {
    const value = current.nodeValue ?? '';
    entries.push({ node: current, start: offset, end: offset + value.length });
    text += value;
    offset += value.length;
    current = walker.nextNode() as Text | null;
  }

  return { entries, text };
}

/** Converts a live DOM `Range` into flat-text offsets, or null if unmappable. */
export function rangeToOffsets(
  index: TextIndex,
  range: Range,
): { start: number; end: number } | null {
  const start = pointToOffset(index, range.startContainer, range.startOffset);
  const end = pointToOffset(index, range.endContainer, range.endOffset);
  if (start === null || end === null || start >= end) return null;
  return { start, end };
}

function pointToOffset(
  index: TextIndex,
  container: Node,
  containerOffset: number,
): number | null {
  if (container.nodeType === Node.TEXT_NODE) {
    const entry = index.entries.find((candidate) => candidate.node === container);
    if (!entry) return null;
    return entry.start + Math.min(containerOffset, entry.end - entry.start);
  }

  // Element boundary: map to the first text node at or after the child index.
  const children = Array.from(container.childNodes);
  const target = children[containerOffset] ?? null;
  if (!target) {
    // Boundary sits after the last child — use the end of the last contained node.
    const last = lastEntryWithin(index, container);
    return last ? last.end : null;
  }
  const first = firstEntryWithin(index, target);
  return first ? first.start : null;
}

function firstEntryWithin(index: TextIndex, node: Node): TextNodeEntry | null {
  return index.entries.find((entry) => node.contains(entry.node)) ?? null;
}

function lastEntryWithin(index: TextIndex, node: Node): TextNodeEntry | null {
  for (let i = index.entries.length - 1; i >= 0; i -= 1) {
    if (node.contains(index.entries[i].node)) return index.entries[i];
  }
  return null;
}

/** Converts flat-text offsets back into a live DOM `Range`. */
export function offsetsToRange(
  index: TextIndex,
  start: number,
  end: number,
): Range | null {
  const startEntry = index.entries.find(
    (entry) => start >= entry.start && start < entry.end,
  );
  const endEntry = index.entries.find(
    (entry) => end > entry.start && end <= entry.end,
  );
  if (!startEntry || !endEntry) return null;

  const range = document.createRange();
  range.setStart(startEntry.node, start - startEntry.start);
  range.setEnd(endEntry.node, end - endEntry.start);
  return range;
}

/** First element that contains the given offset — used for scroll-into-view. */
export function elementAtOffset(index: TextIndex, offset: number): HTMLElement | null {
  const entry = index.entries.find(
    (candidate) => offset >= candidate.start && offset < candidate.end,
  );
  return entry?.node.parentElement ?? null;
}
