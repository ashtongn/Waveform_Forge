import { useCallback, useEffect, useState, type RefObject } from 'react';
import { rangeToOffsets, type TextIndex } from '../anchoring/textOffsets';

interface SelectionToolbarProps {
  containerRef: RefObject<HTMLElement>;
  /** Current text index for the rendered document. */
  getTextIndex(): TextIndex | null;
  /** When false the component renders nothing and installs no listeners. */
  enabled: boolean;
  onAddComment(selection: { start: number; end: number; quote: string }): void;
}

interface ToolbarState {
  top: number;
  left: number;
  start: number;
  end: number;
  quote: string;
}

/**
 * SelectionToolbar — the Google-Docs-style floating "Add comment" affordance.
 *
 * Behaviour is deliberately conditional on authorization: when `enabled` is
 * false no listeners are attached at all, so unapproved visitors get completely
 * normal browser text selection with zero commenting UI — not a disabled button.
 *
 * The toolbar is positioned with `position: fixed` against the live selection
 * rectangle, so it tracks correctly inside scrollable tables and code blocks.
 */
export default function SelectionToolbar({
  containerRef,
  getTextIndex,
  enabled,
  onAddComment,
}: SelectionToolbarProps) {
  const [state, setState] = useState<ToolbarState | null>(null);

  const evaluateSelection = useCallback(() => {
    const container = containerRef.current;
    const index = getTextIndex();
    if (!container || !index) return setState(null);

    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || selection.rangeCount === 0) {
      return setState(null);
    }

    const range = selection.getRangeAt(0);
    if (!container.contains(range.commonAncestorContainer)) return setState(null);

    const quote = selection.toString();
    if (quote.trim().length < 2) return setState(null);

    const offsets = rangeToOffsets(index, range);
    if (!offsets) return setState(null);

    const rect = range.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) return setState(null);

    setState({
      top: rect.top,
      left: rect.left + rect.width / 2,
      start: offsets.start,
      end: offsets.end,
      quote,
    });
  }, [containerRef, getTextIndex]);

  useEffect(() => {
    if (!enabled) {
      setState(null);
      return;
    }

    let frame = 0;
    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(evaluateSelection);
    };

    document.addEventListener('selectionchange', schedule);
    window.addEventListener('scroll', schedule, true);
    window.addEventListener('resize', schedule);

    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener('selectionchange', schedule);
      window.removeEventListener('scroll', schedule, true);
      window.removeEventListener('resize', schedule);
    };
  }, [enabled, evaluateSelection]);

  if (!enabled || !state) return null;

  return (
    <div
      className="fixed z-40 -translate-x-1/2 -translate-y-full pb-2"
      style={{ top: state.top, left: state.left }}
    >
      <button
        type="button"
        // Keep the selection alive: mousedown would otherwise collapse it.
        onMouseDown={(event) => event.preventDefault()}
        onClick={() => {
          onAddComment({ start: state.start, end: state.end, quote: state.quote });
          window.getSelection()?.removeAllRanges();
          setState(null);
        }}
        className="flex items-center gap-2 border border-forge-accent/60 bg-forge-panel px-3 py-2 font-mono text-[0.68rem] uppercase tracking-[0.12em] text-forge-accent shadow-lg shadow-black/40 transition-colors hover:bg-forge-accent/10"
      >
        <span aria-hidden="true">💬</span>
        Add comment
      </button>
    </div>
  );
}
