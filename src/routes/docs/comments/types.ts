import type { TextAnchor } from '../anchoring/types';

/** Lifecycle of a comment thread. */
export type ThreadStatus = 'open' | 'resolved';

export interface CommentAuthor {
  uid: string;
  /** Human-readable label (derived from the account email). */
  name: string;
}

/**
 * A single comment.
 *
 * Threads are modelled flat: the root comment's own id doubles as the
 * `threadId`, and replies point back at it. This keeps Firestore reads to a
 * single query per document and makes resolve/unresolve a one-document write.
 */
export interface DocumentComment {
  id: string;
  /** Which living document this belongs to (`commentNamespace`). */
  documentId: string;
  /** Root comment id. Equals `id` for roots. */
  threadId: string;
  /** Null for roots, otherwise the comment being replied to. */
  parentId: string | null;
  /** Only roots carry an anchor. */
  anchor: TextAnchor | null;
  body: string;
  author: CommentAuthor;
  status: ThreadStatus;
  /** Epoch milliseconds; null while a local write is pending. */
  createdAt: number | null;
  updatedAt: number | null;
  edited: boolean;
}

/** A root comment plus its replies, assembled client-side. */
export interface CommentThread {
  id: string;
  root: DocumentComment;
  replies: DocumentComment[];
  status: ThreadStatus;
  anchor: TextAnchor;
  /** Newest activity in the thread, used for sorting. */
  lastActivityAt: number;
}

export interface CreateThreadInput {
  documentId: string;
  anchor: TextAnchor;
  body: string;
  author: CommentAuthor;
}

export interface CreateReplyInput {
  documentId: string;
  threadId: string;
  parentId: string;
  body: string;
  author: CommentAuthor;
}

export type Unsubscribe = () => void;

/**
 * CommentRepository — the single seam between UI and storage.
 *
 * Nothing in the component tree imports Firestore directly. Swapping in a REST
 * backend, a local cache, or an in-memory store for tests means implementing
 * this interface and passing it to `<CommentProvider repository={...} />`.
 */
export interface CommentRepository {
  /** Live subscription to every comment on a document. */
  subscribe(
    documentId: string,
    onData: (comments: DocumentComment[]) => void,
    onError: (error: Error) => void,
  ): Unsubscribe;

  createThread(input: CreateThreadInput): Promise<string>;
  createReply(input: CreateReplyInput): Promise<string>;
  updateBody(commentId: string, body: string): Promise<void>;
  remove(commentId: string): Promise<void>;
  setThreadStatus(threadId: string, status: ThreadStatus): Promise<void>;
}
