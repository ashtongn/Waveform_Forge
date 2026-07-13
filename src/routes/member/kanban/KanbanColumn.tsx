import { useDroppable } from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import TaskCard from './TaskCard';
import type { KanbanTask, TaskStatus } from './types';

interface KanbanColumnProps {
  status: TaskStatus;
  label: string;
  collapsible: boolean;
  collapsed: boolean;
  tasks: KanbanTask[];
  onToggle: (status: TaskStatus) => void;
  onEditTask: (task: KanbanTask) => void;
  onAddTask: (status: TaskStatus) => void;
}

// A single board column: a droppable target wrapping a sortable list of cards.
// Collapsible columns (Backlog, On going) fold sideways into a slim vertical
// rail so they stop taking horizontal space and the other columns come into
// view without sideways scrolling.
export default function KanbanColumn({
  status,
  label,
  collapsible,
  collapsed,
  tasks,
  onToggle,
  onEditTask,
  onAddTask,
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  // Collapsed rail: a narrow, full-height strip with vertical text. Clicking
  // anywhere on it expands the column again.
  if (collapsible && collapsed) {
    return (
      <button
        type="button"
        onClick={() => onToggle(status)}
        aria-expanded={false}
        title={`Expand ${label}`}
        className="flex w-10 shrink-0 flex-col items-center gap-2 rounded-lg border border-forge-border bg-forge-panel/40 py-3 text-forge-muted transition hover:border-forge-accent hover:text-forge-accent"
      >
        <span className="font-mono text-xs">▸</span>
        <span className="text-sm font-semibold [writing-mode:vertical-rl]">
          {label}
        </span>
        <span className="text-xs tabular-nums">({tasks.length})</span>
      </button>
    );
  }

  return (
    <div className="flex w-72 shrink-0 flex-col">
      <div className="mb-2 flex items-center justify-between gap-2 px-1">
        <button
          type="button"
          onClick={() => collapsible && onToggle(status)}
          className={`flex items-center gap-1.5 text-sm font-semibold text-forge-text ${
            collapsible ? 'hover:text-forge-accent' : 'cursor-default'
          }`}
          aria-expanded={collapsible ? true : undefined}
          title={collapsible ? `Collapse ${label}` : undefined}
        >
          {collapsible && (
            <span className="font-mono text-xs text-forge-muted">◂</span>
          )}
          <span>{label}</span>
          <span className="text-forge-muted">({tasks.length})</span>
        </button>
        <button
          type="button"
          onClick={() => onAddTask(status)}
          className="rounded px-1.5 text-lg leading-none text-forge-muted transition hover:text-forge-accent"
          aria-label={`Add task to ${label}`}
          title={`Add task to ${label}`}
        >
          +
        </button>
      </div>

      <div
        ref={setNodeRef}
        className={`flex min-h-24 flex-1 flex-col gap-2 rounded-lg border p-2 transition ${
          isOver
            ? 'border-forge-accent bg-forge-accent/5'
            : 'border-forge-border bg-forge-panel/40'
        }`}
      >
        <SortableContext
          items={tasks.map((t) => t.id)}
          strategy={verticalListSortingStrategy}
        >
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} onEdit={onEditTask} />
          ))}
        </SortableContext>
        {tasks.length === 0 && (
          <p className="px-1 py-2 text-xs text-forge-muted">No tasks</p>
        )}
      </div>
    </div>
  );
}
