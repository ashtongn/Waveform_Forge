import { useState } from 'react';
import CommentComposer from './CommentComposer';
import { useComments } from '../comments/commentContext';
import { formatTimestamp } from '../comments/helpers';
import { usePermissions } from '../comments/permissions';
import type { CommentThread as Thread, DocumentComment } from '../comments/types';

interface CommentThreadProps {
  thread: Thread;
  /** True when this thread's highlight is the one currently focused. */
  active: boolean;
  /** True when the anchored text could no longer be found in the document. */
  detached: boolean;
  onSelect(threadId: string): void;
}

/**
 * CommentThread — one anchored discussion.
 *
 * Every mutating control is rendered only when the centralized permission
 * service allows it, so read-only visitors see a clean, manual-like transcript
 * with no disabled buttons.
 */
export default function CommentThreadCard({
  thread,
  active,
  detached,
  onSelect,
}: CommentThreadProps) {
  const { reply, setThreadStatus } = useComments();
  const permissions = usePermissions();
  const [replying, setReplying] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const isResolved = thread.status === 'resolved';
  const canReply = permissions.can('reply');
  const canToggle = permissions.can(isResolved ? 'reopen' : 'resolve', {
    authorUid: thread.root.author.uid,
  });

  return (
    <article
      id={`wf-thread-${thread.id}`}
      onClick={() => onSelect(thread.id)}
      className={[
        'cursor-pointer border bg-forge-panel/70 p-3 transition-colors',
        active ? 'border-forge-accent/70 bg-forge-panel' : 'border-forge-border',
        isResolved ? 'opacity-70' : '',
      ].join(' ')}
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <blockquote
          className={[
            'flex-1 border-l-2 pl-2 text-[0.72rem] italic leading-snug',
            detached ? 'border-red-500/60 text-forge-muted/60' : 'border-forge-accent/50 text-forge-muted',
          ].join(' ')}
        >
          {truncate(thread.anchor.exact, 140)}
        </blockquote>

        <span className="shrink-0 border border-forge-border px-1.5 py-0.5 font-mono text-[0.55rem] uppercase tracking-[0.1em] text-forge-muted">
          {detached ? 'Detached' : isResolved ? 'Resolved' : 'Open'}
        </span>
      </div>

      <CommentBody comment={thread.root} />

      {thread.replies.length > 0 && (
        <div className="mt-2 space-y-2 border-l border-forge-border pl-3">
          {thread.replies.map((item) => (
            <CommentBody key={item.id} comment={item} />
          ))}
        </div>
      )}

      <div className="mt-2 flex flex-wrap items-center gap-2">
        {canReply && !replying && (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              setReplying(true);
            }}
            className="font-mono text-[0.62rem] uppercase tracking-[0.12em] text-forge-accent transition-colors hover:text-forge-signal"
          >
            Reply
          </button>
        )}

        {canToggle && (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              setActionError(null);
              setThreadStatus(thread.id, isResolved ? 'open' : 'resolved').catch(
                (err: unknown) =>
                  setActionError(
                    err instanceof Error ? err.message : 'Could not update the thread.',
                  ),
              );
            }}
            className="font-mono text-[0.62rem] uppercase tracking-[0.12em] text-forge-muted transition-colors hover:text-forge-text"
          >
            {isResolved ? 'Reopen' : 'Resolve'}
          </button>
        )}
      </div>

      {actionError && (
        <p className="mt-2 text-xs leading-snug text-red-400">{actionError}</p>
      )}

      {replying && (
        <div className="mt-2" onClick={(event) => event.stopPropagation()}>
          <CommentComposer
            autoFocus
            submitLabel="Reply"
            placeholder="Add a reply…"
            onSubmit={async (body) => {
              await reply(thread.id, thread.root.id, body);
              setReplying(false);
            }}
            onCancel={() => setReplying(false)}
          />
        </div>
      )}
    </article>
  );
}

/** A single message: author, timestamp, body, and owner-only controls. */
function CommentBody({ comment }: { comment: DocumentComment }) {
  const { editComment, deleteComment } = useComments();
  const permissions = usePermissions();
  const [editing, setEditing] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const target = { authorUid: comment.author.uid };
  const canEdit = permissions.can('edit', target);
  const canDelete = permissions.can('delete', target);

  if (editing) {
    return (
      <div onClick={(event) => event.stopPropagation()}>
        <CommentComposer
          autoFocus
          submitLabel="Save"
          placeholder="Update your comment…"
          initialValue={comment.body}
          onSubmit={async (body) => {
            await editComment(comment.id, body);
            setEditing(false);
          }}
          onCancel={() => setEditing(false)}
        />
      </div>
    );
  }

  return (
    <div className="text-sm">
      <div className="flex items-baseline gap-2">
        <span className="font-medium text-forge-text">{comment.author.name}</span>
        <span className="font-mono text-[0.6rem] uppercase tracking-[0.1em] text-forge-muted/80">
          {formatTimestamp(comment.createdAt)}
          {comment.edited ? ' · edited' : ''}
        </span>
      </div>

      <p className="mt-0.5 whitespace-pre-wrap leading-relaxed text-forge-muted">
        {comment.body}
      </p>

      {(canEdit || canDelete) && (
        <div className="mt-1 flex gap-2">
          {canEdit && (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                setEditing(true);
              }}
              className="font-mono text-[0.58rem] uppercase tracking-[0.1em] text-forge-muted/70 transition-colors hover:text-forge-text"
            >
              Edit
            </button>
          )}
          {canDelete && (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                setActionError(null);
                deleteComment(comment.id).catch((err: unknown) =>
                  setActionError(
                    err instanceof Error ? err.message : 'Could not delete the comment.',
                  ),
                );
              }}
              className="font-mono text-[0.58rem] uppercase tracking-[0.1em] text-forge-muted/70 transition-colors hover:text-red-400"
            >
              Delete
            </button>
          )}
        </div>
      )}

      {actionError && (
        <p className="mt-1 text-xs leading-snug text-red-400">{actionError}</p>
      )}
    </div>
  );
}

function truncate(value: string, max: number): string {
  const clean = value.replace(/\s+/g, ' ').trim();
  return clean.length > max ? `${clean.slice(0, max)}…` : clean;
}
