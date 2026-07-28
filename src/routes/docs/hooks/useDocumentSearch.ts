import { useCallback, useDeferredValue, useEffect, useMemo, useState } from 'react';
import type { CommentThread } from '../comments/types';

export interface SearchMatch {
  start: number;
  end: number;
}

export interface DocumentSearchState {
  query: string;
  setQuery(value: string): void;
  /** Ranges in the flat document text, capped for very large documents. */
  matches: SearchMatch[];
  /** Index into `matches` of the currently focused hit, or -1. */
  activeIndex: number;
  goToNext(): void;
  goToPrevious(): void;
  /** Threads whose body text or quoted text matches the query. */
  matchingThreadIds: Set<string>;
}

/** Hard ceiling so a one-character query cannot lock up a huge document. */
const MAX_MATCHES = 1500;

/**
 * Unified search across the document body and the comment threads.
 *
 * The query is deferred (React 18 concurrent feature) so typing stays
 * responsive while the match scan runs against a very long string.
 */
export function useDocumentSearch(
  documentText: string,
  threads: CommentThread[],
): DocumentSearchState {
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(-1);
  const deferredQuery = useDeferredValue(query);

  const matches = useMemo<SearchMatch[]>(() => {
    const needle = deferredQuery.trim().toLowerCase();
    if (needle.length < 2 || !documentText) return [];

    const haystack = documentText.toLowerCase();
    const hits: SearchMatch[] = [];
    let from = 0;

    while (hits.length < MAX_MATCHES) {
      const index = haystack.indexOf(needle, from);
      if (index === -1) break;
      hits.push({ start: index, end: index + needle.length });
      from = index + needle.length;
    }

    return hits;
  }, [deferredQuery, documentText]);

  const matchingThreadIds = useMemo(() => {
    const needle = deferredQuery.trim().toLowerCase();
    const ids = new Set<string>();
    if (needle.length < 2) return ids;

    for (const thread of threads) {
      const haystack = [
        thread.anchor.exact,
        thread.root.body,
        thread.root.author.name,
        ...thread.replies.flatMap((reply) => [reply.body, reply.author.name]),
      ]
        .join('\n')
        .toLowerCase();

      if (haystack.includes(needle)) ids.add(thread.id);
    }

    return ids;
  }, [deferredQuery, threads]);

  // Reset the cursor whenever the result set changes.
  useEffect(() => {
    setActiveIndex(matches.length > 0 ? 0 : -1);
  }, [matches]);

  const goToNext = useCallback(() => {
    setActiveIndex((current) =>
      matches.length === 0 ? -1 : (current + 1) % matches.length,
    );
  }, [matches.length]);

  const goToPrevious = useCallback(() => {
    setActiveIndex((current) =>
      matches.length === 0 ? -1 : (current - 1 + matches.length) % matches.length,
    );
  }, [matches.length]);

  return {
    query,
    setQuery,
    matches,
    activeIndex,
    goToNext,
    goToPrevious,
    matchingThreadIds,
  };
}
