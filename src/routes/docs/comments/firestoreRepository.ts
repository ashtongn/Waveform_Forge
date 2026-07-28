import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  Timestamp,
  updateDoc,
  where,
  type DocumentData,
} from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import type {
  CommentRepository,
  CreateReplyInput,
  CreateThreadInput,
  DocumentComment,
  ThreadStatus,
} from './types';

/**
 * Firestore-backed `CommentRepository`.
 *
 * Follows the same conventions as the Kanban and Equipment data layers:
 * `onSnapshot` live subscriptions, server-generated timestamps, and defensive
 * defaults when reading documents back.
 *
 * The query intentionally filters on `documentId` only and sorts client-side —
 * that keeps it on Firestore's automatic single-field index and avoids shipping
 * a composite index definition.
 */
const COLLECTION = 'docComments';

export const firestoreCommentRepository: CommentRepository = {
  subscribe(documentId, onData, onError) {
    const q = query(collection(db, COLLECTION), where('documentId', '==', documentId));

    return onSnapshot(
      q,
      (snapshot) => {
        const comments = snapshot.docs
          .map((snap) => fromFirestore(snap.id, snap.data()))
          .sort((a, b) => (a.createdAt ?? 0) - (b.createdAt ?? 0));
        onData(comments);
      },
      (error) => onError(error),
    );
  },

  async createThread(input: CreateThreadInput) {
    const ref = await addDoc(collection(db, COLLECTION), {
      documentId: input.documentId,
      parentId: null,
      anchor: { ...input.anchor },
      body: input.body,
      authorUid: input.author.uid,
      authorName: input.author.name,
      status: 'open' satisfies ThreadStatus,
      edited: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    // A root comment is its own thread. Written after creation because the id
    // is only known once Firestore has assigned it.
    await updateDoc(ref, { threadId: ref.id });
    return ref.id;
  },

  async createReply(input: CreateReplyInput) {
    const ref = await addDoc(collection(db, COLLECTION), {
      documentId: input.documentId,
      threadId: input.threadId,
      parentId: input.parentId,
      anchor: null,
      body: input.body,
      authorUid: input.author.uid,
      authorName: input.author.name,
      status: 'open' satisfies ThreadStatus,
      edited: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return ref.id;
  },

  updateBody(commentId, body) {
    return updateDoc(doc(db, COLLECTION, commentId), {
      body,
      edited: true,
      updatedAt: serverTimestamp(),
    });
  },

  remove(commentId) {
    return deleteDoc(doc(db, COLLECTION, commentId));
  },

  setThreadStatus(threadId, status) {
    // Status lives on the root comment only; the UI derives thread state from it.
    return updateDoc(doc(db, COLLECTION, threadId), {
      status,
      updatedAt: serverTimestamp(),
    });
  },
};

function fromFirestore(id: string, data: DocumentData): DocumentComment {
  return {
    id,
    documentId: data.documentId ?? '',
    threadId: data.threadId ?? id,
    parentId: data.parentId ?? null,
    anchor: data.anchor ?? null,
    body: data.body ?? '',
    author: {
      uid: data.authorUid ?? '',
      name: data.authorName ?? 'Unknown',
    },
    status: (data.status ?? 'open') as DocumentComment['status'],
    createdAt: toMillis(data.createdAt),
    updatedAt: toMillis(data.updatedAt),
    edited: Boolean(data.edited),
  };
}

function toMillis(value: unknown): number | null {
  return value instanceof Timestamp ? value.toMillis() : null;
}
