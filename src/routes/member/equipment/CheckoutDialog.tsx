import { useEffect, useState, type FormEvent } from 'react';
import type { EquipmentItem } from './types';
import { availableQuantity } from './helpers';

interface CheckoutValues {
  person: string;
  quantity: number;
  dueDate: string;
  notes: string;
}

interface CheckoutDialogProps {
  item: EquipmentItem;
  onConfirm: (values: CheckoutValues) => void;
  onCancel: () => void;
}

const inputClass =
  'w-full rounded-md border border-forge-border bg-forge-panel/50 px-3 py-2 text-sm text-forge-text outline-none focus:border-forge-accent';

// Modal for checking out some quantity of an item to a person or team. Styled
// as an overlay + panel to match the app's dark theme (the native <dialog> the
// reference uses would not inherit the Tailwind tokens).
export default function CheckoutDialog({
  item,
  onConfirm,
  onCancel,
}: CheckoutDialogProps) {
  const max = availableQuantity(item);
  const [person, setPerson] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');

  // Close on Escape for keyboard users.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onCancel();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onCancel]);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const qty = Math.min(Math.max(1, Math.floor(quantity)), max);
    onConfirm({ person: person.trim(), quantity: qty, dueDate, notes: notes.trim() });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-label={`Check out ${item.assetId}`}
      onMouseDown={(e) => e.target === e.currentTarget && onCancel()}
    >
      <div className="w-full max-w-md rounded-lg border border-forge-border bg-forge-panel p-5 shadow-xl">
        <h2 className="text-lg font-semibold text-forge-text">
          Check out {item.assetId}
        </h2>
        <p className="mt-1 text-sm text-forge-muted">
          {item.name} — {max} available
        </p>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="space-y-1">
            <label htmlFor="co-person" className="block text-sm font-medium text-forge-text">
              Assigned to
            </label>
            <input
              id="co-person"
              required
              value={person}
              onChange={(e) => setPerson(e.target.value)}
              placeholder="Person or team"
              className={inputClass}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label htmlFor="co-qty" className="block text-sm font-medium text-forge-text">
                Quantity
              </label>
              <input
                id="co-qty"
                type="number"
                min={1}
                max={max}
                step={1}
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className={inputClass}
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="co-due" className="block text-sm font-medium text-forge-text">
                Due date
              </label>
              <input
                id="co-due"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>

          <div className="space-y-1">
            <label htmlFor="co-notes" className="block text-sm font-medium text-forge-text">
              Notes
            </label>
            <textarea
              id="co-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional usage notes"
              className={`${inputClass} min-h-[72px] resize-y`}
            />
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onCancel}
              className="rounded-md border border-forge-border px-3 py-1.5 text-sm font-medium text-forge-muted transition hover:text-forge-text"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-md bg-forge-accent px-3 py-1.5 text-sm font-semibold text-forge-bg transition hover:bg-forge-accent/90"
            >
              Check out
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export type { CheckoutValues };
