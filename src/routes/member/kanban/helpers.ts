import type { Difficulty, Priority, TaskStatus } from './types';

// Column definitions in board order. `collapsible` marks the long-term groups
// (Backlog, On going) that a user can fold away.
export const COLUMNS: {
  status: TaskStatus;
  label: string;
  collapsible: boolean;
}[] = [
  { status: 'backlog', label: 'Backlog', collapsible: true },
  { status: 'ongoing', label: 'On going', collapsible: true },
  { status: 'ready', label: 'Ready', collapsible: false },
  { status: 'in_progress', label: 'In progress', collapsible: false },
  { status: 'in_review', label: 'In review', collapsible: false },
  { status: 'complete', label: 'Complete', collapsible: false },
];

// Difficulty owns the card's accent color. Priority is shown separately (a
// neutral P1–P4 chip) so the two are never visually confused.
export const DIFFICULTY_META: Record<
  Difficulty,
  { label: string; accent: string; dot: string; chip: string }
> = {
  simple: {
    label: 'Simple',
    accent: 'border-l-sky-400',
    dot: 'bg-sky-400',
    chip: 'bg-sky-500/15 text-sky-300',
  },
  moderate: {
    label: 'Moderate time',
    accent: 'border-l-amber-400',
    dot: 'bg-amber-400',
    chip: 'bg-amber-500/15 text-amber-300',
  },
  challenging: {
    label: 'Challenging',
    accent: 'border-l-pink-400',
    dot: 'bg-pink-400',
    chip: 'bg-pink-500/15 text-pink-300',
  },
  extended: {
    label: 'Extended',
    accent: 'border-l-purple-400',
    dot: 'bg-purple-400',
    chip: 'bg-purple-500/15 text-purple-300',
  },
};

export const DIFFICULTIES: Difficulty[] = [
  'simple',
  'moderate',
  'challenging',
  'extended',
];

export const PRIORITIES: Priority[] = [1, 2, 3, 4];

// New tasks go to the top of their column. Existing orders are positive, so a
// negative timestamp-based value keeps recent additions above older ones while
// staying unique enough to avoid collisions.
export function newOrder(): number {
  return -Date.now();
}

// The order value to assign a task dropped between `before` and `after` in a
// column. Missing neighbors mean an end of the list.
export function orderBetween(
  before: number | undefined,
  after: number | undefined,
): number {
  if (before === undefined && after === undefined) return newOrder();
  if (before === undefined) return (after as number) - 1;
  if (after === undefined) return (before as number) + 1;
  return (before + after) / 2;
}

export function priorityLabel(priority: Priority): string {
  return `P${priority}`;
}

// localStorage key for a user's collapsed-column preference. Per-uid so the two
// aren't shared on a common browser.
function collapseKey(uid: string): string {
  return `wf.kanban.collapsed.${uid}`;
}

// The columns that start collapsed for a user who has no saved preference yet.
const DEFAULT_COLLAPSED: TaskStatus[] = ['backlog', 'ongoing'];

export function loadCollapsed(uid: string): TaskStatus[] {
  try {
    const raw = localStorage.getItem(collapseKey(uid));
    // No stored preference yet: collapse the long-term columns by default.
    if (raw === null) return [...DEFAULT_COLLAPSED];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as TaskStatus[]) : [];
  } catch {
    return [...DEFAULT_COLLAPSED];
  }
}

export function saveCollapsed(uid: string, statuses: TaskStatus[]): void {
  try {
    localStorage.setItem(collapseKey(uid), JSON.stringify(statuses));
  } catch {
    // Ignore storage failures (private mode, quota) — collapse is non-critical.
  }
}
