import type { DocumentSearchState } from '../hooks/useDocumentSearch';

interface DocumentSearchProps {
  search: DocumentSearchState;
  commentMatchCount: number;
}

/**
 * DocumentSearch — single input searching both the document body and comments.
 *
 * Body hits are painted inline by the highlight layer; comment hits are surfaced
 * as a count and simultaneously filter the sidebar.
 */
export default function DocumentSearch({
  search,
  commentMatchCount,
}: DocumentSearchProps) {
  const hasQuery = search.query.trim().length >= 2;

  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor="wf-doc-search"
        className="px-2 font-mono text-[0.62rem] uppercase tracking-[0.16em] text-forge-muted"
      >
        Search
      </label>

      <div className="flex items-center border border-forge-border bg-black/30 focus-within:border-forge-accent/60">
        <input
          id="wf-doc-search"
          type="search"
          value={search.query}
          onChange={(event) => search.setQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key !== 'Enter') return;
            event.preventDefault();
            if (event.shiftKey) search.goToPrevious();
            else search.goToNext();
          }}
          placeholder="Document and comments…"
          className="min-w-0 flex-1 bg-transparent px-2.5 py-2 text-sm text-forge-text placeholder:text-forge-muted/60 focus:outline-none"
        />

        {hasQuery && (
          <div className="flex items-center gap-0.5 pr-1">
            <span className="px-1 font-mono text-[0.65rem] text-forge-muted">
              {search.matches.length === 0
                ? '0'
                : `${search.activeIndex + 1}/${search.matches.length}`}
            </span>
            <button
              type="button"
              onClick={search.goToPrevious}
              aria-label="Previous match"
              className="px-1.5 py-1 text-forge-muted transition-colors hover:text-forge-accent"
            >
              ↑
            </button>
            <button
              type="button"
              onClick={search.goToNext}
              aria-label="Next match"
              className="px-1.5 py-1 text-forge-muted transition-colors hover:text-forge-accent"
            >
              ↓
            </button>
          </div>
        )}
      </div>

      {hasQuery && (
        <p className="px-2 font-mono text-[0.62rem] uppercase tracking-[0.1em] text-forge-muted/80">
          {search.matches.length} in document · {commentMatchCount} in comments
        </p>
      )}
    </div>
  );
}
