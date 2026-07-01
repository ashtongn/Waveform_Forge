import { useEffect, useState, type FormEvent } from 'react';
import type { EquipmentFormValues, EquipmentItem } from './types';

interface EquipmentFormProps {
  editing: EquipmentItem | null;
  onSave: (values: EquipmentFormValues) => void | Promise<void>;
  onCancelEdit: () => void;
}

const inputClass =
  'w-full rounded-md border border-forge-border bg-forge-panel/50 px-3 py-2 text-sm text-forge-text outline-none focus:border-forge-accent';
const labelClass = 'block text-sm font-medium text-forge-text';

const EMPTY: EquipmentFormValues = {
  assetId: '',
  name: '',
  category: '',
  groupName: '',
  location: '',
  quantity: 1,
  serviceQuantity: 0,
  notes: '',
};

// Add / edit form for an item's static attributes. Checkouts are handled by the
// dedicated check-out / return actions, so they are intentionally not editable
// here — this keeps a single source of truth for who holds what.
export default function EquipmentForm({
  editing,
  onSave,
  onCancelEdit,
}: EquipmentFormProps) {
  const [values, setValues] = useState<EquipmentFormValues>(EMPTY);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (editing) {
      setValues({
        assetId: editing.assetId,
        name: editing.name,
        category: editing.category,
        groupName: editing.groupName,
        location: editing.location,
        quantity: editing.quantity,
        serviceQuantity: editing.serviceQuantity,
        notes: editing.notes,
      });
    } else {
      setValues(EMPTY);
    }
  }, [editing]);

  function set<K extends keyof EquipmentFormValues>(
    key: K,
    value: EquipmentFormValues[K],
  ) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onSave(values);
      if (!editing) setValues(EMPTY);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 gap-3">
        <div className="space-y-1">
          <label htmlFor="f-assetId" className={labelClass}>
            Asset ID
          </label>
          <input
            id="f-assetId"
            required
            value={values.assetId}
            onChange={(e) => set('assetId', e.target.value)}
            placeholder="EQ-001"
            className={inputClass}
          />
        </div>
        <div className="space-y-1">
          <label htmlFor="f-name" className={labelClass}>
            Equipment name
          </label>
          <input
            id="f-name"
            required
            value={values.name}
            onChange={(e) => set('name', e.target.value)}
            placeholder="Camera Kit"
            className={inputClass}
          />
        </div>
        <div className="space-y-1">
          <label htmlFor="f-category" className={labelClass}>
            Category
          </label>
          <input
            id="f-category"
            value={values.category}
            onChange={(e) => set('category', e.target.value)}
            placeholder="Audio, Camera, Tools"
            className={inputClass}
          />
        </div>
        <div className="space-y-1">
          <label htmlFor="f-group" className={labelClass}>
            Group
          </label>
          <input
            id="f-group"
            value={values.groupName}
            onChange={(e) => set('groupName', e.target.value)}
            placeholder="Laptops"
            className={inputClass}
          />
        </div>
        <div className="space-y-1">
          <label htmlFor="f-location" className={labelClass}>
            Location
          </label>
          <input
            id="f-location"
            value={values.location}
            onChange={(e) => set('location', e.target.value)}
            placeholder="Warehouse A"
            className={inputClass}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label htmlFor="f-qty" className={labelClass}>
              Total quantity
            </label>
            <input
              id="f-qty"
              type="number"
              min={1}
              step={1}
              value={values.quantity}
              onChange={(e) => set('quantity', Number(e.target.value))}
              className={inputClass}
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="f-service" className={labelClass}>
              In service
            </label>
            <input
              id="f-service"
              type="number"
              min={0}
              step={1}
              value={values.serviceQuantity}
              onChange={(e) => set('serviceQuantity', Number(e.target.value))}
              className={inputClass}
            />
          </div>
        </div>
      </div>

      <div className="space-y-1">
        <label htmlFor="f-notes" className={labelClass}>
          Notes
        </label>
        <textarea
          id="f-notes"
          value={values.notes}
          onChange={(e) => set('notes', e.target.value)}
          placeholder="Condition, accessories, maintenance notes"
          className={`${inputClass} min-h-[72px] resize-y`}
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-md bg-forge-accent px-4 py-2 text-sm font-semibold text-forge-bg transition hover:bg-forge-accent/90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {editing ? 'Save changes' : 'Add equipment'}
        </button>
        {editing && (
          <button
            type="button"
            onClick={onCancelEdit}
            className="rounded-md border border-forge-border px-4 py-2 text-sm font-medium text-forge-muted transition hover:text-forge-text"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
