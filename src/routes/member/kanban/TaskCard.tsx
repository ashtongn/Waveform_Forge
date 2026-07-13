import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { DIFFICULTY_META, priorityLabel } from './helpers';
import type { KanbanTask } from './types';

interface TaskCardProps {
  task: KanbanTask;
  onEdit: (task: KanbanTask) => void;
}

// Draggable + sortable task card. The left accent border and the small dot are
// driven by difficulty; the neutral "Pn" chip carries priority so the two are
// never confused.
export default function TaskCard({ task, onEdit }: TaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const diff = DIFFICULTY_META[task.difficulty];

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => onEdit(task)}
      className={`cursor-grab touch-none rounded-md border border-forge-border border-l-4 ${diff.accent} bg-forge-panel p-3 text-left shadow-sm transition hover:border-forge-accent focus:outline-none focus:ring-1 focus:ring-forge-accent active:cursor-grabbing`}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onEdit(task);
        }
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="min-w-0 flex-1 text-sm font-medium text-forge-text">
          {task.title || 'Untitled task'}
        </p>
        <span
          className="shrink-0 rounded bg-forge-border/70 px-1.5 py-0.5 font-mono text-[11px] font-semibold text-forge-muted"
          title={`Priority ${task.priority}`}
        >
          {priorityLabel(task.priority)}
        </span>
      </div>

      {task.description && (
        <p className="mt-1 line-clamp-2 text-xs text-forge-muted">
          {task.description}
        </p>
      )}

      <div className="mt-3 flex items-center justify-between gap-2 text-xs text-forge-muted">
        <span className="inline-flex min-w-0 items-center gap-1.5">
          <span className={`h-2 w-2 shrink-0 rounded-full ${diff.dot}`} />
          <span className="truncate">{task.assigneeName || 'Unassigned'}</span>
        </span>
        {task.dueDate && (
          <span className="shrink-0 tabular-nums">{task.dueDate}</span>
        )}
      </div>
    </div>
  );
}
