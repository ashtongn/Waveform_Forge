import { useEffect, useState, type FormEvent } from 'react';
import { COLUMNS, DIFFICULTIES, DIFFICULTY_META, PRIORITIES } from './helpers';
import type { MemberOption } from './api';
import type {
  Difficulty,
  KanbanTask,
  Priority,
  TaskFormValues,
  TaskStatus,
} from './types';

interface TaskDialogProps {
  // The task being edited, or null when creating a new one.
  editing: KanbanTask | null;
  // Column the "New task" button was pressed from (create mode default).
  defaultStatus: TaskStatus;
  members: MemberOption[];
  onSave: (values: TaskFormValues) => void | Promise<void>;
  onDelete: (task: KanbanTask) => void | Promise<void>;
  onCancel: () => void;
}

const inputClass =
  'w-full rounded-md border border-forge-border bg-forge-panel/50 px-3 py-2 text-sm text-forge-text outline-none focus:border-forge-accent';
const labelClass = 'block text-sm font-medium text-forge-text';

// Modal for creating and editing a task. Styled as an overlay + panel to match
// the app's dark theme, mirroring the equipment CheckoutDialog.
export default function TaskDialog({
  editing,
  defaultStatus,
  members,
  onSave,
  onDelete,
  onCancel,
}: TaskDialogProps) {
  const [values, setValues] = useState<TaskFormValues>({
    title: '',
    description: '',
    status: defaultStatus,
    assigneeUid: null,
    dueDate: '',
    difficulty: 'simple',
    priority: 4,
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (editing) {
      setValues({
        title: editing.title,
        description: editing.description,
        status: editing.status,
        assigneeUid: editing.assigneeUid,
        dueDate: editing.dueDate,
        difficulty: editing.difficulty,
        priority: editing.priority,
      });
    }
  }, [editing]);

  // Close on Escape for keyboard users.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onCancel();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onCancel]);

  function set<K extends keyof TaskFormValues>(
    key: K,
    value: TaskFormValues[K],
  ) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onSave({ ...values, title: values.title.trim() });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-label={editing ? 'Edit task' : 'New task'}
      onMouseDown={(e) => e.target === e.currentTarget && onCancel()}
    >
      <div className="w-full max-w-lg rounded-lg border border-forge-border bg-forge-panel p-5 shadow-xl">
        <h2 className="text-lg font-semibold text-forge-text">
          {editing ? 'Edit task' : 'New task'}
        </h2>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="space-y-1">
            <label htmlFor="t-title" className={labelClass}>
              Title
            </label>
            <input
              id="t-title"
              required
              value={values.title}
              onChange={(e) => set('title', e.target.value)}
              placeholder="Short summary of the work"
              className={inputClass}
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="t-desc" className={labelClass}>
              Details
            </label>
            <textarea
              id="t-desc"
              value={values.description}
              onChange={(e) => set('description', e.target.value)}
              placeholder="Optional description"
              className={`${inputClass} min-h-[72px] resize-y`}
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <label htmlFor="t-status" className={labelClass}>
                Group
              </label>
              <select
                id="t-status"
                value={values.status}
                onChange={(e) => set('status', e.target.value as TaskStatus)}
                className={inputClass}
              >
                {COLUMNS.map((c) => (
                  <option key={c.status} value={c.status}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label htmlFor="t-assignee" className={labelClass}>
                Assignee
              </label>
              <select
                id="t-assignee"
                value={values.assigneeUid ?? ''}
                onChange={(e) => set('assigneeUid', e.target.value || null)}
                className={inputClass}
              >
                <option value="">Unassigned</option>
                {members.map((m) => (
                  <option key={m.uid} value={m.uid}>
                    {m.email}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label htmlFor="t-due" className={labelClass}>
                Due date
              </label>
              <input
                id="t-due"
                type="date"
                value={values.dueDate}
                onChange={(e) => set('dueDate', e.target.value)}
                className={inputClass}
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="t-priority" className={labelClass}>
                Priority
              </label>
              <select
                id="t-priority"
                value={values.priority}
                onChange={(e) =>
                  set('priority', Number(e.target.value) as Priority)
                }
                className={inputClass}
              >
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    P{p}
                    {p === 1 ? ' (highest)' : p === 4 ? ' (lowest)' : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label htmlFor="t-difficulty" className={labelClass}>
              Difficulty
            </label>
            <select
              id="t-difficulty"
              value={values.difficulty}
              onChange={(e) => set('difficulty', e.target.value as Difficulty)}
              className={inputClass}
            >
              {DIFFICULTIES.map((d) => (
                <option key={d} value={d}>
                  {DIFFICULTY_META[d].label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-between gap-2 pt-1">
            <div>
              {editing && (
                <button
                  type="button"
                  onClick={() => onDelete(editing)}
                  className="rounded-md border border-red-500/40 px-3 py-1.5 text-sm font-medium text-red-300 transition hover:bg-red-500/10"
                >
                  Delete
                </button>
              )}
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onCancel}
                className="rounded-md border border-forge-border px-3 py-1.5 text-sm font-medium text-forge-muted transition hover:text-forge-text"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="rounded-md bg-forge-accent px-3 py-1.5 text-sm font-semibold text-forge-bg transition hover:bg-forge-accent/90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {editing ? 'Save changes' : 'Create task'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
