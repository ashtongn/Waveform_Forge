import { useEffect, useMemo, useState } from 'react';
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import LoadingScreen from '../../../components/LoadingScreen';
import { useAuth } from '../../../auth/useAuth';
import KanbanColumn from './KanbanColumn';
import TaskCard from './TaskCard';
import TaskDialog from './TaskDialog';
import {
  createTask,
  deleteTask,
  moveTask,
  subscribeToApprovedMembers,
  subscribeToTasks,
  updateTask,
  type MemberOption,
} from './api';
import {
  COLUMNS,
  loadCollapsed,
  newOrder,
  orderBetween,
  saveCollapsed,
} from './helpers';
import type { KanbanTask, TaskFormValues, TaskStatus } from './types';

const COLUMN_STATUSES = COLUMNS.map((c) => c.status);

export default function KanbanBoard() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<KanbanTask[] | null>(null);
  const [members, setMembers] = useState<MemberOption[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);

  const [collapsed, setCollapsed] = useState<Set<TaskStatus>>(new Set());
  const [editing, setEditing] = useState<KanbanTask | null>(null);
  const [creatingIn, setCreatingIn] = useState<TaskStatus | null>(null);

  useEffect(() => {
    return subscribeToTasks(
      (data) => {
        setTasks(data);
        setError(null);
      },
      () => setError('Could not load the board. Please refresh and try again.'),
    );
  }, []);

  useEffect(() => {
    return subscribeToApprovedMembers(
      (data) => setMembers(data),
      () => {
        // Non-fatal: the board still works, the assignee list is just empty.
      },
    );
  }, []);

  // Restore per-user collapse preference once we know the uid.
  useEffect(() => {
    if (!user) return;
    setCollapsed(new Set(loadCollapsed(user.uid)));
  }, [user]);

  const sensors = useSensors(
    // A small drag threshold so a plain click still opens the editor.
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const list = useMemo(() => tasks ?? [], [tasks]);

  // Group into columns. The subscription already returns tasks ordered by their
  // sort key, so each column list is in display order.
  const grouped = useMemo(() => {
    const map = new Map<TaskStatus, KanbanTask[]>();
    for (const status of COLUMN_STATUSES) map.set(status, []);
    for (const task of list) {
      const bucket = map.get(task.status);
      if (bucket) bucket.push(task);
      else map.get('backlog')?.push(task);
    }
    return map;
  }, [list]);

  const activeTask = activeId
    ? (list.find((t) => t.id === activeId) ?? null)
    : null;

  function toggleColumn(status: TaskStatus) {
    if (!user) return;
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(status)) next.delete(status);
      else next.add(status);
      saveCollapsed(user.uid, [...next]);
      return next;
    });
  }

  function handleDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id));
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;

    const activeTaskLocal = list.find((t) => t.id === active.id);
    if (!activeTaskLocal) return;

    const overId = String(over.id);

    // The destination column is either a column dropped onto directly, or the
    // column of the card the pointer is over.
    let destStatus: TaskStatus;
    if (COLUMN_STATUSES.includes(overId as TaskStatus)) {
      destStatus = overId as TaskStatus;
    } else {
      const overTask = list.find((t) => t.id === overId);
      if (!overTask) return;
      destStatus = overTask.status;
    }

    // Destination column in display order, excluding the task being moved.
    const destTasks = (grouped.get(destStatus) ?? []).filter(
      (t) => t.id !== active.id,
    );

    // Insert position: before the card under the pointer, or at the end when
    // dropping onto an empty column body.
    let index = destTasks.length;
    if (!COLUMN_STATUSES.includes(overId as TaskStatus)) {
      const overIndex = destTasks.findIndex((t) => t.id === overId);
      if (overIndex !== -1) index = overIndex;
    }

    const order = orderBetween(
      destTasks[index - 1]?.order,
      destTasks[index]?.order,
    );

    if (destStatus === activeTaskLocal.status && order === activeTaskLocal.order)
      return;

    moveTask(String(active.id), destStatus, order).catch(() =>
      setError('Could not move the task. Please try again.'),
    );
  }

  async function handleSave(values: TaskFormValues) {
    setError(null);
    const assignee = members.find((m) => m.uid === values.assigneeUid);
    const base = {
      title: values.title,
      description: values.description.trim(),
      status: values.status,
      assigneeUid: values.assigneeUid,
      assigneeName: assignee?.email ?? '',
      dueDate: values.dueDate,
      difficulty: values.difficulty,
      priority: values.priority,
    };
    try {
      if (editing) {
        await updateTask(editing.id, base);
      } else {
        await createTask({ ...base, order: newOrder() });
      }
      setEditing(null);
      setCreatingIn(null);
    } catch {
      setError('Could not save the task. Please try again.');
    }
  }

  async function handleDelete(task: KanbanTask) {
    if (!window.confirm(`Delete “${task.title || 'Untitled task'}”?`)) return;
    try {
      await deleteTask(task.id);
      setEditing(null);
    } catch {
      setError('Could not delete the task. Please try again.');
    }
  }

  const dialogOpen = editing !== null || creatingIn !== null;

  if (tasks === null && !error) return <LoadingScreen />;

  return (
    <section className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-1">
          <p className="font-mono text-sm uppercase tracking-widest text-forge-accent">
            Member area
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">Kanban board</h1>
          <p className="text-forge-muted">
            Plan and track the team&apos;s work. Drag cards between groups or
            reorder within a group.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setCreatingIn('backlog')}
          className="rounded-md bg-forge-accent px-4 py-2 text-sm font-semibold text-forge-bg transition hover:bg-forge-accent/90"
        >
          New task
        </button>
      </header>

      {error && (
        <p role="alert" className="text-sm text-red-400">
          {error}
        </p>
      )}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={() => setActiveId(null)}
      >
        <div className="flex gap-4 overflow-x-auto pb-4">
          {COLUMNS.map((col) => (
            <KanbanColumn
              key={col.status}
              status={col.status}
              label={col.label}
              collapsible={col.collapsible}
              collapsed={collapsed.has(col.status)}
              tasks={grouped.get(col.status) ?? []}
              onToggle={toggleColumn}
              onEditTask={setEditing}
              onAddTask={setCreatingIn}
            />
          ))}
        </div>

        <DragOverlay>
          {activeTask ? (
            <div className="w-72">
              <TaskCard task={activeTask} onEdit={() => {}} />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {dialogOpen && (
        <TaskDialog
          editing={editing}
          defaultStatus={creatingIn ?? 'backlog'}
          members={members}
          onSave={handleSave}
          onDelete={handleDelete}
          onCancel={() => {
            setEditing(null);
            setCreatingIn(null);
          }}
        />
      )}
    </section>
  );
}
