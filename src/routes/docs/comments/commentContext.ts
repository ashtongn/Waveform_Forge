import { createContext, useContext } from 'react';
import type { CommentThread, ThreadStatus } from './types';

/**
 * Comment state exposed to the document UI.
 *
 * Note that no Firestore type appears here — consumers only ever see plain
 * domain objects, which is what keeps the storage implementation swappable.
 */
export interface CommentContextValue {
  threads: CommentThread[];
  /** Distinct author names present in the thread list, for the sidebar filter. */
  authors: string[];
  loading: boolean;
  error: string | null;

  createThread(anchor: CommentThread['anchor'], body: string): Promise<string>;
  reply(threadId: string, parentId: string, body: string): Promise<void>;
  editComment(commentId: string, body: string): Promise<void>;
  deleteComment(commentId: string): Promise<void>;
  setThreadStatus(threadId: string, status: ThreadStatus): Promise<void>;
}

export const CommentContext = createContext<CommentContextValue | undefined>(
  undefined,
);

export function useComments(): CommentContextValue {
  const context = useContext(CommentContext);
  if (!context) {
    throw new Error('useComments must be used within a <CommentProvider>');
  }
  return context;
}
