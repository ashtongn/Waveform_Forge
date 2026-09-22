import { useEffect, useState, type FormEvent } from 'react';
import type { EquipmentItem } from './types';
import { todayIso } from './helpers';
import { flattenForExport, summarize } from './export/flatten';
import { toCsv, toMarkdown, toPrintableHtml } from './export/exporters';
import { downloadBlob, printHtml } from './export/download';

type Format = 'csv' | 'pdf' | 'md';
type Scope = 'filtered' | 'all';

interface ExportDialogProps {
  filtered: EquipmentItem[];
  all: EquipmentItem[];
  onClose: () => void;
}

const radioRow =
  'flex items-center gap-2 text-sm text-forge-text cursor-pointer';

// Export the inventory as CSV, PDF (via print) or Markdown. Styled as an
// overlay + panel to match CheckoutDialog and the app's dark theme.
export default function ExportDialog({
  filtered,
  all,
  onClose,
}: ExportDialogProps) {
  const [format, setFormat] = useState<Format>('csv');
  const [scope, setScope] = useState<Scope>('filtered');
  const [includeHolders, setIncludeHolders] = useState(true);

  // Close on Escape for keyboard users.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const scopeItems = scope === 'all' ? all : filtered;
    const rows = flattenForExport(scopeItems, includeHolders);
    const summary = summarize(scopeItems);
    const name = `equipment-${todayIso()}`;

    if (format === 'csv') {
      downloadBlob(`${name}.csv`, 'text/csv;charset=utf-8', toCsv(rows));
    } else if (format === 'md') {
      downloadBlob(
        `${name}.md`,
        'text/markdown;charset=utf-8',
        toMarkdown(rows, summary),
      );
    } else {
      printHtml(toPrintableHtml(rows, summary));
    }
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Export equipment"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-md rounded-lg border border-forge-border bg-forge-panel p-5 shadow-xl">
        <h2 className="text-lg font-semibold text-forge-text">
          Export inventory
        </h2>
        <p className="mt-1 text-sm text-forge-muted">
          Download the current inventory or print it to PDF.
        </p>

        <form onSubmit={handleSubmit} className="mt-4 space-y-5">
          <fieldset className="space-y-2">
            <legend className="text-sm font-medium text-forge-text">
              Format
            </legend>
            <label className={radioRow}>
              <input
                type="radio"
                name="format"
                value="csv"
                checked={format === 'csv'}
                onChange={() => setFormat('csv')}
              />
              CSV
            </label>
            <label className={radioRow}>
              <input
                type="radio"
                name="format"
                value="pdf"
                checked={format === 'pdf'}
                onChange={() => setFormat('pdf')}
              />
              PDF
            </label>
            <label className={radioRow}>
              <input
                type="radio"
                name="format"
                value="md"
                checked={format === 'md'}
                onChange={() => setFormat('md')}
              />
              Markdown
            </label>
          </fieldset>

          <fieldset className="space-y-2">
            <legend className="text-sm font-medium text-forge-text">
              Scope
            </legend>
            <label className={radioRow}>
              <input
                type="radio"
                name="scope"
                value="filtered"
                checked={scope === 'filtered'}
                onChange={() => setScope('filtered')}
              />
              Current filtered view ({filtered.length} items)
            </label>
            <label className={radioRow}>
              <input
                type="radio"
                name="scope"
                value="all"
                checked={scope === 'all'}
                onChange={() => setScope('all')}
              />
              Entire inventory ({all.length} items)
            </label>
          </fieldset>

          <label className={radioRow}>
            <input
              type="checkbox"
              checked={includeHolders}
              onChange={(e) => setIncludeHolders(e.target.checked)}
            />
            Include holder details
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
