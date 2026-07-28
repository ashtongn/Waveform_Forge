import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { CommentContext, type CommentContextValue } from './commentContext';
import { buildThreads, collectAuthors, describeCommentError } from './helpers';
import { usePermissions } from './permissions';
import type { CommentRepository, DocumentComment, ThreadStatus } from './types';

interface CommentProviderProps {
  /** Firestore partition key for this document. */
  documentId: string;
  /** Injected storage implementation — see `CommentRepository`. */
  repository: CommentRepository;
  children: ReactNode;
}

/**
 * CommentProvider.
 *
 * Owns the live comment subscription, assembles threads, and exposes the write
 * operations. It performs an authorization check before every mutation so a
 * missing UI guard can never silently produce an unauthorized write attempt.
 *
 * Reads are intentionally unauthenticated-friendly: public visitors receive the
 * same thread list, they simply have no mutating affordances.
 */
export default function CommentProvider({
  documentId,
  repository,
  children,
}: CommentProviderProps) {
  const permissions = usePermissions();
  const [comments, setComments] = useState<DocumentComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    const unsubscribe = repository.subscribe(
      documentId,
      (next) => {
        setComments(next);
        setLoading(false);
      },
      (err) => {
        setError(describeCommentError(err));
        setLoading(false);
      },
    );

    return unsubscribe;
  }, [documentId, repository]);

  const threads = useMemo(() => buildThreads(comments), [comments]);
  const authors = useMemo(() => collectAuthors(threads), [threads]);

  const requireActor = useCallback(() => {
    const { uid, name } = permissions.actor;
    if (!uid) throw new Error('You must be signed in to comment.');
    return { uid, name };
  }, [permissions]);

  const createThread = useCallback<CommentContextValue['createThread']>(
    async (anchor, body) => {
      if (!permissions.can('createThread')) {
        throw new Error('You do not have permission to comment on this document.');
      }
      try {
        return await repository.createThread({
          documentId,
          anchor,
          body: body.trim(),
          author: requireActor(),
        });
      } catch (err) {
        throw new Error(describeCommentError(err));
      }
    },
    [documentId, permissions, repository, requireActor],
  );

  const reply = useCallback<CommentContextValue['reply']>(
    async (threadId, parentId, body) => {
      if (!permissions.can('reply')) {
        throw new Error('You do not have permission to reply.');
      }
      try {
        await repository.createReply({
          documentId,
          threadId,
          parentId,
          body: body.trim(),
          author: requireActor(),
        });
      } catch (err) {
        throw new Error(describeCommentError(err));
      }
    },
    [documentId, permissions, repository, requireActor],
  );

  const findComment = useCallback(
    (commentId: string) => comments.find((comment) => comment.id === commentId),
    [comments],
  );

  const editComment = useCallback<CommentContextValue['editComment']>(
    async (commentId, body) => {
      const target = findComment(commentId);
      if (!permissions.can('edit', { authorUid: target?.author.uid })) {
        throw new Error('You may only edit your own comments.');
      }
      try {
        await repository.updateBody(commentId, body.trim());
      } catch (err) {
        throw new Error(describeCommentError(err));
      }
    },
    [findComment, permissions, repository],
  );

  const deleteComment = useCallback<CommentContextValue['deleteComment']>(
    async (commentId) => {
      const target = findComment(commentId);
      if (!permissions.can('delete', { authorUid: target?.author.uid })) {
        throw new Error('You may only delete your own comments.');
      }
      try {
        await repository.remove(commentId);
      } catch (err) {
        throw new Error(describeCommentError(err));
      }
    },
    [findComment, permissions, repository],
  );

  const setThreadStatus = useCallback<CommentContextValue['setThreadStatus']>(
    async (threadId, status: ThreadStatus) => {
      const target = findComment(threadId);
      const action = status === 'resolved' ? 'resolve' : 'reopen';
      if (!permissions.can(action, { authorUid: target?.author.uid })) {
        throw new Error('You do not have permission to change this thread.');
      }
      try {
        await repository.setThreadStatus(threadId, status);
      } catch (err) {
        throw new Error(describeCommentError(err));
      }
    },
    [findComment, permissions, repository],
  );

  const value = useMemo<CommentContextValue>(
    () => ({
      threads,
      authors,
      loading,
      error,
      createThread,
      reply,
      editComment,
      deleteComment,
      setThreadStatus,
    }),
    [
      threads,
      authors,
      loading,
      error,
      createThread,
      reply,
      editComment,
      deleteComment,
      setThreadStatus,
    ],
  );

  return <CommentContext.Provider value={value}>{children}</CommentContext.Provider>;
}
