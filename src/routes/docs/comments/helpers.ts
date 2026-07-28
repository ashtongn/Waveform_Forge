import type { CommentThread, DocumentComment } from './types';

/**
 * Assembles the flat comment list returned by the repository into threads.
 *
 * Comments whose root is missing (root deleted, partial sync) are dropped
 * rather than rendered as dangling replies.
 */
export function buildThreads(comments: DocumentComment[]): CommentThread[] {
  const roots = comments.filter((comment) => comment.parentId === null && comment.anchor);
  const repliesByThread = new Map<string, DocumentComment[]>();

  for (const comment of comments) {
    if (comment.parentId === null) continue;
    const bucket = repliesByThread.get(comment.threadId);
    if (bucket) bucket.push(comment);
    else repliesByThread.set(comment.threadId, [comment]);
  }

  return roots.map((root) => {
    const replies = (repliesByThread.get(root.id) ?? []).sort(
      (a, b) => (a.createdAt ?? 0) - (b.createdAt ?? 0),
    );
    const lastActivityAt = Math.max(
      root.updatedAt ?? root.createdAt ?? 0,
      ...replies.map((reply) => reply.updatedAt ?? reply.createdAt ?? 0),
    );

    return {
      id: root.id,
      root,
      replies,
      status: root.status,
      // Non-null: roots are filtered on `comment.anchor` above.
      anchor: root.anchor!,
      lastActivityAt,
    } satisfies CommentThread;
  });
}

/** Distinct author display names across a thread list, alphabetically sorted. */
export function collectAuthors(threads: CommentThread[]): string[] {
  const names = new Set<string>();
  for (const thread of threads) {
    names.add(thread.root.author.name);
    thread.replies.forEach((reply) => names.add(reply.author.name));
  }
  return Array.from(names).sort((a, b) => a.localeCompare(b));
}

/** Compact relative timestamp — "just now", "4h ago", "12 Mar 2026". */
export function formatTimestamp(value: number | null): string {
  if (!value) return 'Saving…';

  const delta = Date.now() - value;
  const minutes = Math.round(delta / 60_000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.round(hours / 24);
  if (days < 7) return `${days}d ago`;

  return new Date(value).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Turns a storage error into something a reader can act on.
 *
 * Raw Firebase strings such as "Missing or insufficient permissions" tell a
 * member nothing about what to do, and are alarming on a public page. The most
 * common cause by far is that the `docComments` security rules have not been
 * deployed yet, so that case is called out explicitly for maintainers.
 */
export function describeCommentError(error: unknown): string {
  const code =
    typeof error === 'object' && error !== null && 'code' in error
      ? String((error as { code: unknown }).code)
      : '';

  if (code.includes('permission-denied') || code.includes('unauthenticated')) {
    return 'Comments are unavailable for this account. If you are an approved member, the docComments security rules may not be deployed yet (firebase deploy --only firestore:rules).';
  }

  if (code.includes('unavailable') || code.includes('network')) {
    return 'Comments are offline. They will reappear once the connection is restored.';
  }

  return error instanceof Error ? error.message : 'Comments could not be loaded.';
}
