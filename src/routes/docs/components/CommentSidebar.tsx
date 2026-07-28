import { useMemo, useState } from 'react';
import CommentComposer from './CommentComposer';
import CommentThreadCard from './CommentThread';
import { usePermissions } from '../comments/permissions';
import type { CommentThread, ThreadStatus } from '../comments/types';

export interface PendingSelection {
  start: number;
  end: number;
  quote: string;
}

interface CommentSidebarProps {
  threads: CommentThread[];
  loading: boolean;
  error: string | null;
  /** Threads whose anchor could not be re-located in the current Markdown. */
  detachedThreadIds: Set<string>;
  activeThreadId: string | null;
  onSelectThread(threadId: string): void;
  /** Set while an approved member is composing a brand-new thread. */
  pendingSelection: PendingSelection | null;
  onSubmitPending(body: string): Promise<void>;
  onCancelPending(): void;
  /** When non-null, restricts the list to threads matching the global search. */
  globalMatchIds: Set<string> | null;
}

type StatusFilter = ThreadStatus | 'all';

/**
 * CommentSidebar — the review panel.
 *
 * Threads are sorted by most recent activity and can be narrowed by status,
 * author, or a local text filter. Selecting a thread scrolls the document to its
 * highlight (handled by the page, which owns scroll behaviour).
 */
export default function CommentSidebar({
  threads,
  loading,
  error,
  detachedThreadIds,
  activeThreadId,
  onSelectThread,
  pendingSelection,
  onSubmitPending,
  onCancelPending,
  globalMatchIds,
}: CommentSidebarProps) {
  const permissions = usePermissions();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('open');
  const [authorFilter, setAuthorFilter] = useState('all');
  const [filterText, setFilterText] = useState('');

  const authors = useMemo(() => {
    const names = new Set<string>();
    threads.forEach((thread) => {
      names.add(thread.root.author.name);
      thread.replies.forEach((reply) => names.add(reply.author.name));
    });
    return Array.from(names).sort((a, b) => a.localeCompare(b));
  }, [threads]);

  const visible = useMemo(() => {
    const needle = filterText.trim().toLowerCase();

    return threads
      .filter((thread) => statusFilter === 'all' || thread.status === statusFilter)
      .filter(
        (thread) =>
          authorFilter === 'all' ||
          thread.root.author.name === authorFilter ||
          thread.replies.some((reply) => reply.author.name === authorFilter),
      )
      .filter((thread) => !globalMatchIds || globalMatchIds.has(thread.id))
      .filter((thread) => {
        if (!needle) return true;
        const haystack = [
          thread.anchor.exact,
          thread.root.body,
          ...thread.replies.map((reply) => reply.body),
        ]
          .join('\n')
          .toLowerCase();
        return haystack.includes(needle);
      })
      .sort((a, b) => b.lastActivityAt - a.lastActivityAt);
  }, [threads, statusFilter, authorFilter, filterText, globalMatchIds]);

  const counts = useMemo(
    () => ({
      all: threads.length,
      open: threads.filter((thread) => thread.status === 'open').length,
      resolved: threads.filter((thread) => thread.status === 'resolved').length,
    }),
    [threads],
  );

  return (
    <aside aria-label="Comments" className="flex h-full flex-col gap-3">
      <div className="flex items-baseline justify-between">
        <p className="font-mono text-[0.62rem] uppercase tracking-[0.16em] text-forge-muted">
          Comments
        </p>
        {!permissions.can('createThread') && (
          <span className="font-mono text-[0.55rem] uppercase tracking-[0.1em] text-forge-muted/70">
            Read only
          </span>
        )}
      </div>

      {/* New-thread composer, shown only for approved members mid-selection. */}
      {pendingSelection && (
        <div className="border border-forge-accent/60 bg-forge-panel p-3">
          <p className="mb-2 border-l-2 border-forge-accent/50 pl-2 text-[0.72rem] italic leading-snug text-forge-muted">
            {pendingSelection.quote.replace(/\s+/g, ' ').slice(0, 160)}
          </p>
          <CommentComposer
            autoFocus
            submitLabel="Comment"
            placeholder="Add a comment…"
            onSubmit={onSubmitPending}
            onCancel={onCancelPending}
          />
        </div>
      )}

      <div className="flex gap-1">
        {(['open', 'resolved', 'all'] as StatusFilter[]).map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => setStatusFilter(option)}
            className={[
              'flex-1 border px-2 py-1.5 font-mono text-[0.6rem] uppercase tracking-[0.1em] transition-colors',
              statusFilter === option
                ? 'border-forge-accent/60 bg-forge-accent/10 text-forge-accent'
                : 'border-forge-border text-forge-muted hover:text-forge-text',
            ].join(' ')}
          >
            {option} ({counts[option]})
          </button>
        ))}
      </div>

      <div className="flex gap-2">
        <input
          type="search"
          value={filterText}
          onChange={(event) => setFilterText(event.target.value)}
          placeholder="Filter comments…"
          className="min-w-0 flex-1 border border-forge-border bg-black/30 px-2 py-1.5 text-xs text-forge-text placeholder:text-forge-muted/60 focus:border-forge-accent/60 focus:outline-none"
        />
        <select
          value={authorFilter}
          onChange={(event) => setAuthorFilter(event.target.value)}
          aria-label="Filter by author"
          className="border border-forge-border bg-black/30 px-2 py-1.5 text-xs text-forge-text focus:border-forge-accent/60 focus:outline-none"
        >
          <option value="all">All authors</option>
          {authors.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
      </div>

      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-0.5">
        {error && (
          <p className="border border-red-500/40 bg-red-500/5 p-2 text-xs text-red-300">
            {error}
          </p>
        )}

        {loading && (
          <p className="p-2 text-xs text-forge-muted">Loading comments…</p>
        )}

        {!loading && visible.length === 0 && (
          <p className="p-2 text-xs leading-relaxed text-forge-muted">
            {threads.length === 0
              ? permissions.can('createThread')
                ? 'No comments yet. Highlight any passage to start a review thread.'
                : 'No comments have been posted on this document.'
              : 'No comments match the current filters.'}
          </p>
        )}

        {visible.map((thread) => (
          <CommentThreadCard
            key={thread.id}
            thread={thread}
            active={thread.id === activeThreadId}
            detached={detachedThreadIds.has(thread.id)}
            onSelect={onSelectThread}
          />
        ))}
      </div>
    </aside>
  );
}
