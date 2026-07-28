/**
 * Anchoring types.
 *
 * A `TextAnchor` is a storage-friendly description of "a span of text inside a
 * document". It deliberately records several redundant selectors so a comment
 * can survive edits to the underlying Markdown:
 *
 *  - `exact`    — the highlighted text itself (W3C TextQuoteSelector)
 *  - `prefix`   — characters immediately before the highlight
 *  - `suffix`   — characters immediately after the highlight
 *  - `start`/`end` — character offsets into the rendered plain text
 *                    (W3C TextPositionSelector; a fast hint, never trusted alone)
 *  - `checksum` — cheap hash of the normalized quote, used to detect drift
 *
 * This mirrors the W3C Web Annotation Data Model, which is the standard
 * approach used by Hypothesis and similar annotation tools.
 */
export interface TextAnchor {
  exact: string;
  prefix: string;
  suffix: string;
  start: number;
  end: number;
  checksum: string;
}

/** How confident we are that a resolved range is the original highlight. */
export type AnchorConfidence = 'exact' | 'approximate';

export type AnchorResolution =
  | { status: AnchorConfidence; start: number; end: number }
  | { status: 'orphan' };

/** A resolved character range ready to be painted into the DOM. */
export interface HighlightRange {
  /** Stable identifier — comment thread id, or a synthetic id for search hits. */
  id: string;
  start: number;
  end: number;
  kind: 'comment' | 'resolved' | 'search' | 'search-active';
}
