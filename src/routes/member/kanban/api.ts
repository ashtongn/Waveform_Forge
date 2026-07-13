import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import { auth, db } from '../../../lib/firebase';
import type { KanbanTask, TaskStatus, TaskWriteData } from './types';

const COLLECTION = 'Kanban';

// Live-subscribe to the whole board, ordered by the sort key. Grouping into
// columns is done client-side, so no composite index is required. Returns the
// unsubscribe function.
export function subscribeToTasks(
  onData: (tasks: KanbanTask[]) => void,
  onError: (err: Error) => void,
) {
  const q = query(collection(db, COLLECTION), orderBy('order'));
  return onSnapshot(
    q,
    (snap) => {
      const tasks = snap.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          title: data.title ?? '',
          description: data.description ?? '',
          status: (data.status ?? 'backlog') as TaskStatus,
          assigneeName: data.assigneeName ?? '',
          dueDate: data.dueDate ?? '',
          difficulty: data.difficulty ?? 'simple',
          priority: data.priority ?? 4,
          order: typeof data.order === 'number' ? data.order : 0,
          createdAt: data.createdAt ?? null,
          updatedAt: data.updatedAt ?? null,
          createdBy: data.createdBy ?? null,
          updatedBy: data.updatedBy ?? null,
        } satisfies KanbanTask;
      });
      onData(tasks);
    },
    (err) => onError(err),
  );
}

export function createTask(data: TaskWriteData) {
  return addDoc(collection(db, COLLECTION), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    createdBy: auth.currentUser?.uid ?? null,
    updatedBy: auth.currentUser?.uid ?? null,
  });
}

export function updateTask(id: string, data: Partial<TaskWriteData>) {
  return updateDoc(doc(db, COLLECTION, id), {
    ...data,
    updatedAt: serverTimestamp(),
    updatedBy: auth.currentUser?.uid ?? null,
  });
}

// Persist a drag result: the new column and/or the new sort position. Only the
// moved document is written, so a drop costs a single update.
export function moveTask(id: string, status: TaskStatus, order: number) {
  return updateTask(id, { status, order });
}

export function deleteTask(id: string) {
  return deleteDoc(doc(db, COLLECTION, id));
}

// A member option for the assignee dropdown.
export interface MemberOption {
  uid: string;
  email: string;
}

// Live-subscribe to approved members for the assignee dropdown. Requires the
// relaxed profiles read rule (approved members may read the profile list).
// Returns the unsubscribe function.
export function subscribeToApprovedMembers(
  onData: (members: MemberOption[]) => void,
  onError: (err: Error) => void,
) {
  const q = query(
    collection(db, 'profiles'),
    where('status', '==', 'approved'),
  );
  return onSnapshot(
    q,
    (snap) => {
      const members = snap.docs
        .map((d) => ({ uid: d.id, email: d.data().email ?? '' }))
        .sort((a, b) => a.email.localeCompare(b.email));
      onData(members);
    },
    (err) => onError(err),
  );
}
