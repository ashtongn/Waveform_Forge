import { useEffect, useMemo, useState } from 'react';
import LoadingScreen from '../../../components/LoadingScreen';
import EquipmentForm from './EquipmentForm';
import EquipmentTable from './EquipmentTable';
import CheckoutDialog, { type CheckoutValues } from './CheckoutDialog';
import {
  createEquipment,
  deleteEquipment,
  subscribeToEquipment,
  toWriteData,
  updateEquipment,
} from './api';
import {
  availableQuantity,
  checkedOutQuantity,
  makeId,
  todayIso,
} from './helpers';
import type {
  Checkout,
  EquipmentFormValues,
  EquipmentItem,
  EquipmentWriteData,
} from './types';

type SortKey = 'assetId' | 'name' | 'category';
type StatusFilter = '' | 'Available' | 'Checked Out' | 'In Service';

const controlClass =
  'w-full rounded-md border border-forge-border bg-forge-panel/50 px-3 py-2 text-sm text-forge-text outline-none focus:border-forge-accent';

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-forge-border bg-forge-panel/50 p-4">
      <p className="text-xs uppercase tracking-wide text-forge-muted">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums text-forge-text">
        {value}
      </p>
    </div>
  );
}

// Clamp form values into a valid, storable shape. Service units can never
// exceed what's not already checked out.
function toWrite(
  values: EquipmentFormValues,
  checkouts: Checkout[],
): EquipmentWriteData {
  const quantity = Math.max(1, Math.floor(values.quantity) || 1);
  const out = checkouts.reduce((s, c) => s + c.quantity, 0);
  const serviceQuantity = Math.min(
    Math.max(0, Math.floor(values.serviceQuantity) || 0),
    Math.max(0, quantity - out),
  );
  return {
    assetId: values.assetId.trim(),
    name: values.name.trim(),
    category: values.category.trim(),
    groupName: values.groupName.trim(),
    location: values.location.trim(),
    quantity,
    serviceQuantity,
    checkouts,
    notes: values.notes.trim(),
  };
}

export default function EquipmentTracker() {
  const [items, setItems] = useState<EquipmentItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [sortBy, setSortBy] = useState<SortKey>('assetId');

  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(
    new Set(),
  );
  const [editing, setEditing] = useState<EquipmentItem | null>(null);
  const [checkoutTarget, setCheckoutTarget] = useState<EquipmentItem | null>(
    null,
  );

  useEffect(() => {
    return subscribeToEquipment(
      (data) => {
        setItems(data);
        setError(null);
      },
      () => setError('Could not load equipment. Please refresh and try again.'),
    );
  }, []);

  // Keep the editing target in sync with live updates from other members.
  const list = useMemo(() => items ?? [], [items]);
  const editingLive = editing
    ? (list.find((i) => i.id === editing.id) ?? null)
    : null;

  const categories = useMemo(
    () => [...new Set(list.map((i) => i.category).filter(Boolean))].sort(),
    [list],
  );

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return list
      .filter((item) => {
        const holders = item.checkouts
          .map((c) => `${c.person} ${c.dueDate} ${c.notes}`)
          .join(' ');
        const haystack = [
          item.assetId,
          item.name,
          item.groupName,
          item.category,
          item.location,
          holders,
          item.notes,
        ]
          .join(' ')
          .toLowerCase();

        const statusOk =
          !statusFilter ||
          (statusFilter === 'Available' && availableQuantity(item) > 0) ||
          (statusFilter === 'Checked Out' && checkedOutQuantity(item) > 0) ||
          (statusFilter === 'In Service' && item.serviceQuantity > 0);

        return (
          (!term || haystack.includes(term)) &&
          statusOk &&
          (!categoryFilter || item.category === categoryFilter)
        );
      })
      .sort((a, b) =>
        String(a[sortBy] || '').localeCompare(String(b[sortBy] || ''), undefined, {
          numeric: true,
        }),
      );
  }, [list, search, statusFilter, categoryFilter, sortBy]);

  const summary = useMemo(
    () => ({
      total: list.reduce((s, i) => s + i.quantity, 0),
      available: list.reduce((s, i) => s + availableQuantity(i), 0),
      out: list.reduce((s, i) => s + checkedOutQuantity(i), 0),
      service: list.reduce((s, i) => s + i.serviceQuantity, 0),
    }),
    [list],
  );

  function reportError(message: string) {
    setError(message);
  }

  async function handleSave(values: EquipmentFormValues) {
    setError(null);
    const write = toWrite(values, editingLive?.checkouts ?? []);
    try {
      if (editingLive) {
        await updateEquipment(editingLive.id, write);
        setEditing(null);
      } else {
        await createEquipment(write);
      }
    } catch {
      reportError('Could not save the item. Please try again.');
    }
  }

  async function handleDelete(item: EquipmentItem) {
    if (!window.confirm(`Delete ${item.assetId} — ${item.name}?`)) return;
    try {
      await deleteEquipment(item.id);
      if (editing?.id === item.id) setEditing(null);
    } catch {
      reportError('Could not delete the item. Please try again.');
    }
  }

  async function handleCheckoutConfirm(values: CheckoutValues) {
    const item = checkoutTarget;
    setCheckoutTarget(null);
    if (!item || !values.person || values.quantity <= 0) return;
    const checkout: Checkout = {
      id: makeId(),
      person: values.person,
      quantity: values.quantity,
      checkoutDate: todayIso(),
      dueDate: values.dueDate,
      notes: values.notes,
    };
    const next = { ...toWriteData(item), checkouts: [...item.checkouts, checkout] };
    try {
      await updateEquipment(item.id, next);
    } catch {
      reportError('Could not check out the item. Please try again.');
    }
  }

  async function handleReturn(item: EquipmentItem, checkout: Checkout) {
    const input = window.prompt(
      `Quantity to return from ${checkout.person}`,
      String(checkout.quantity),
    );
    if (input === null) return;
    const amount = Math.min(
      checkout.quantity,
      Math.max(0, Math.floor(Number(input)) || 0),
    );
    if (amount <= 0) return;

    const remaining = checkout.quantity - amount;
    const checkouts =
      remaining > 0
        ? item.checkouts.map((c) =>
            c.id === checkout.id ? { ...c, quantity: remaining } : c,
          )
        : item.checkouts.filter((c) => c.id !== checkout.id);
    try {
      await updateEquipment(item.id, { ...toWriteData(item), checkouts });
    } catch {
      reportError('Could not return the item. Please try again.');
    }
  }

  async function handleService(item: EquipmentItem) {
    const available = availableQuantity(item);
    const input = window.prompt(
      `Quantity to mark in service for ${item.assetId}`,
      String(available),
    );
    if (input === null) return;
    const amount = Math.min(
      available,
      Math.max(0, Math.floor(Number(input)) || 0),
    );
    if (amount <= 0) return;
    try {
      await updateEquipment(item.id, {
        ...toWriteData(item),
        serviceQuantity: item.serviceQuantity + amount,
      });
    } catch {
      reportError('Could not update the item. Please try again.');
    }
  }

  async function handleAvailable(item: EquipmentItem) {
    const input = window.prompt(
      `Quantity to mark available for ${item.assetId}`,
      String(item.serviceQuantity),
    );
    if (input === null) return;
    const amount = Math.min(
      item.serviceQuantity,
      Math.max(0, Math.floor(Number(input)) || 0),
    );
    if (amount <= 0) return;
    try {
      await updateEquipment(item.id, {
        ...toWriteData(item),
        serviceQuantity: item.serviceQuantity - amount,
      });
    } catch {
      reportError('Could not update the item. Please try again.');
    }
  }

  function toggleGroup(name: string) {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }

  if (items === null && !error) return <LoadingScreen />;

  return (
    <section className="space-y-8">
      <header className="space-y-1">
        <p className="font-mono text-sm uppercase tracking-widest text-forge-accent">
          Member area
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">
          Equipment tracker
        </h1>
        <p className="text-forge-muted">
          Shared inventory for the waveform team. Add gear, check it out to
          people, and track what&apos;s in service.
        </p>
      </header>

      {error && (
        <p role="alert" className="text-sm text-red-400">
          {error}
        </p>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Total units" value={summary.total} />
        <StatCard label="Available" value={summary.available} />
        <StatCard label="Checked out" value={summary.out} />
        <StatCard label="In service" value={summary.service} />
      </div>

      <div className="rounded-lg border border-forge-border bg-forge-panel/50 p-5">
        <h2 className="mb-4 text-lg font-semibold">
          {editingLive ? 'Edit equipment' : 'Add equipment'}
        </h2>
        <EquipmentForm
          editing={editingLive}
          onSave={handleSave}
          onCancelEdit={() => setEditing(null)}
        />
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search asset, name, person…"
            className={controlClass}
            aria-label="Search equipment"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            className={controlClass}
            aria-label="Filter by status"
          >
            <option value="">All statuses</option>
            <option value="Available">Available</option>
            <option value="Checked Out">Checked Out</option>
            <option value="In Service">In Service</option>
          </select>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className={controlClass}
            aria-label="Filter by category"
          >
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortKey)}
            className={controlClass}
            aria-label="Sort by"
          >
            <option value="assetId">Sort: Asset ID</option>
            <option value="name">Sort: Name</option>
            <option value="category">Sort: Category</option>
          </select>
        </div>

        <EquipmentTable
          items={filtered}
          collapsedGroups={collapsedGroups}
          onToggleGroup={toggleGroup}
          onEdit={(item) => {
            setEditing(item);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onDelete={handleDelete}
          onCheckout={setCheckoutTarget}
          onReturn={handleReturn}
          onService={handleService}
          onAvailable={handleAvailable}
        />
      </div>

      {checkoutTarget && (
        <CheckoutDialog
          item={checkoutTarget}
          onConfirm={handleCheckoutConfirm}
          onCancel={() => setCheckoutTarget(null)}
        />
      )}
    </section>
  );
}
