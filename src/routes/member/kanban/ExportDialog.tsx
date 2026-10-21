import { useEffect, useState, type FormEvent } from 'react';
import type { KanbanTask } from './types';
import { todayIso } from '../equipment/helpers';
import { downloadBlob, printHtml } from '../equipment/export/download';
import {
  groupForExport,
  toCsv,
  toJson,
  toMarkdown,
  toPrintableHtml,
} from './export/exporters';

type Format = 'csv' | 'md' | 'pdf' | 'json';

interface ExportDialogProps {
  tasks: KanbanTask[];
  onClose: () => void;
}

const radioRow =
  'flex items-center gap-2 text-sm text-forge-text cursor-pointer';

const FORMATS: { value: Format; label: string }[] = [
  { value: 'csv', label: 'CSV (spreadsheet)' },
  { value: 'md', label: 'Markdown' },
  { value: 'pdf', label: 'PDF (print)' },
  { value: 'json', label: 'JSON (full snapshot)' },
];

// Overlay + panel styled to match the equipment ExportDialog.
export default function ExportDialog({ tasks, onClose }: ExportDialogProps) {
  const [format, setFormat] = useState<Format>('csv');
  const [includeComplete, setIncludeComplete] = useState(true);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const groups = groupForExport(tasks, includeComplete);
    const name = `kanban-${todayIso()}`;

    if (format === 'csv') {
      downloadBlob(`${name}.csv`, 'text/csv;charset=utf-8', toCsv(groups));
    } else if (format === 'md') {
      downloadBlob(
        `${name}.md`,
        'text/markdown;charset=utf-8',
        toMarkdown(groups),
      );
    } else if (format === 'json') {
      downloadBlob(
        `${name}.json`,
        'application/json;charset=utf-8',
        toJson(groups),
      );
    } else {
      printHtml(toPrintableHtml(groups));
    }
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Export board"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-md rounded-lg border border-forge-border bg-forge-panel p-5 shadow-xl">
        <h2 className="text-lg font-semibold text-forge-text">Export board</h2>
        <p className="mt-1 text-sm text-forge-muted">
          Download {tasks.length} tasks, grouped by column in board order.
        </p>

        <form onSubmit={handleSubmit} className="mt-4 space-y-5">
          <fieldset className="space-y-2">
            <legend className="text-sm font-medium text-forge-text">
              Format
            </legend>
            {FORMATS.map((f) => (
              <label key={f.value} className={radioRow}>
                <input
                  type="radio"
                  name="format"
                  value={f.value}
                  checked={format === f.value}
                  onChange={() => setFormat(f.value)}
                />
                {f.label}
              </label>
            ))}
          </fieldset>

          <label className={radioRow}>
            <input
              type="checkbox"
              checked={includeComplete}
              onChange={(e) => setIncludeComplete(e.target.checked)}
            />
            Include completed tasks
          </label>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-forge-border px-3 py-1.5 text-sm font-medium text-forge-muted transition hover:text-forge-text"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-md bg-forge-accent px-3 py-1.5 text-sm font-semibold text-forge-bg transition hover:bg-forge-accent/90"
            >
              Export
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
