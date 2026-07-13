import type { Timestamp } from 'firebase/firestore';

// The board's status columns. `ongoing` is long-term continuous work (kept
// distinct from the short-lived `in_progress`). Stored as these stable keys so
// display labels can change without a data migration.
export type TaskStatus =
  | 'backlog'
  | 'ongoing'
  | 'ready'
  | 'in_progress'
  | 'in_review'
  | 'complete';

// Effort/size of a task. Drives the card's accent color (never priority).
export type Difficulty = 'simple' | 'moderate' | 'challenging' | 'extended';

// Priority is a separate designation from difficulty. 1 is highest.
export type Priority = 1 | 2 | 3 | 4;

// The mutable fields persisted to a Kanban task document (plus server-managed
// metadata added by the api layer).
export interface TaskWriteData {
  title: string;
  description: string;
  status: TaskStatus;
  // Free-text assignee: an individual (typically their email) or a group such
  // as "Engineers" or "Programmers". Displayed on the card as typed.
  assigneeName: string;
  dueDate: string; // YYYY-MM-DD, or '' when unset
  difficulty: Difficulty;
  priority: Priority;
  order: number; // sort key within a column
}

// A full task record as read back from Firestore.
export interface KanbanTask extends TaskWriteData {
  id: string;
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
  createdBy: string | null;
  updatedBy: string | null;
}

// The subset of fields edited through the create/edit dialog. Ordering and
// server metadata are managed by the board and api layer.
export interface TaskFormValues {
  title: string;
  description: string;
  status: TaskStatus;
  assignee: string;
  dueDate: string;
  difficulty: Difficulty;
  priority: Priority;
}
