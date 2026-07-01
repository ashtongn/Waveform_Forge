import { Fragment } from 'react';
import type { Checkout, EquipmentItem, EquipmentStatus } from './types';
import {
  availableQuantity,
  checkedOutQuantity,
  displayStatus,
  groupStatus,
} from './helpers';

interface EquipmentTableProps {
  items: EquipmentItem[];
  collapsedGroups: Set<string>;
  onToggleGroup: (name: string) => void;
  onEdit: (item: EquipmentItem) => void;
  onDelete: (item: EquipmentItem) => void;
  onCheckout: (item: EquipmentItem) => void;
  onReturn: (item: EquipmentItem, checkout: Checkout) => void;
  onService: (item: EquipmentItem) => void;
  onAvailable: (item: EquipmentItem) => void;
}

const STATUS_BADGE: Record<EquipmentStatus, string> = {
  Available: 'bg-emerald-500/15 text-emerald-300',
  'Checked Out': 'bg-amber-500/15 text-amber-300',
  'In Service': 'bg-red-500/15 text-red-300',
  Partial: 'bg-sky-500/15 text-sky-300',
};

function StatusBadge({ status }: { status: EquipmentStatus }) {
  return (
    <span
      className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${STATUS_BADGE[status]}`}
    >
      {status}
    </span>
  );
}

const cell = 'px-3 py-2 align-top text-sm';
const numCell = `${cell} tabular-nums`;
const actionBtn =
  'rounded border border-forge-border px-2 py-1 text-xs font-medium text-forge-muted transition hover:text-forge-text';

// One data row for a single item.
function ItemRow({
  item,
  child,
  onEdit,
  onDelete,
  onCheckout,
  onReturn,
  onService,
  onAvailable,
}: {
  item: EquipmentItem;
  child: boolean;
} & Pick<
  EquipmentTableProps,
  'onEdit' | 'onDelete' | 'onCheckout' | 'onReturn' | 'onService' | 'onAvailable'
>) {
  const available = availableQuantity(item);
  const out = checkedOutQuantity(item);

  return (
    <tr className="border-t border-forge-border/60">
      <td className={`${cell} ${child ? 'pl-8' : ''} font-mono text-xs`}>
        {item.assetId}
      </td>
      <td className={cell}>
        <div className="font-medium text-forge-text">{item.name}</div>
        {item.notes && (
          <div className="mt-0.5 text-xs text-forge-muted">{item.notes}</div>
        )}
      </td>
      <td className={cell}>{item.category || '—'}</td>
      <td className={cell}>
        <StatusBadge status={displayStatus(item)} />
      </td>
      <td className={numCell}>{item.quantity}</td>
      <td className={numCell}>{available}</td>
      <td className={numCell}>{out}</td>
      <td className={numCell}>{item.serviceQuantity}</td>
      <td className={cell}>
        {item.checkouts.length === 0 ? (
          <span className="text-forge-muted">—</span>
        ) : (
          <div className="space-y-1">
            {item.checkouts.map((c) => (
              <div
                key={c.id}
                className="rounded border border-forge-border/70 bg-forge-bg/40 p-1.5 text-xs"
              >
                <div className="font-medium text-forge-text">
                  {c.person} ({c.quantity})
                </div>
                <div className="text-forge-muted">
                  {c.checkoutDate}
                  {c.dueDate ? ` · due ${c.dueDate}` : ''}
                </div>
                {c.notes && <div className="text-forge-muted">{c.notes}</div>}
                <button
                  type="button"
                  onClick={() => onReturn(item, c)}
                  className={`${actionBtn} mt-1`}
                >
                  Return
                </button>
              </div>
            ))}
          </div>
        )}
      </td>
      <td className={cell}>{item.location || '—'}</td>
      <td className={cell}>
        <div className="flex flex-wrap gap-1">
          <button type="button" onClick={() => onEdit(item)} className={actionBtn}>
            Edit
          </button>
          {available > 0 && (
            <button
              type="button"
              onClick={() => onCheckout(item)}
              className="rounded bg-forge-accent px-2 py-1 text-xs font-semibold text-forge-bg transition hover:bg-forge-accent/90"
            >
              Check out
            </button>
          )}
          {available > 0 && (
            <button
              type="button"
              onClick={() => onService(item)}
              className="rounded border border-amber-500/40 px-2 py-1 text-xs font-medium text-amber-300 transition hover:bg-amber-500/10"
            >
              Service
            </button>
          )}
          {item.serviceQuantity > 0 && (
            <button
              type="button"
              onClick={() => onAvailable(item)}
              className={actionBtn}
            >
              Available
            </button>
          )}
          <button
            type="button"
            onClick={() => onDelete(item)}
            className="rounded border border-red-500/40 px-2 py-1 text-xs font-medium text-red-300 transition hover:bg-red-500/10"
          >
            Delete
          </button>
        </div>
      </td>
    </tr>
  );
}

export default function EquipmentTable(props: EquipmentTableProps) {
  const { items, collapsedGroups, onToggleGroup } = props;

  // Preserve order while collecting grouped items together. Items without a
  // group are rendered as standalone rows.
  const rows: Array<
    | { type: 'item'; item: EquipmentItem }
    | { type: 'group'; name: string; items: EquipmentItem[] }
  > = [];
  const groupIndex = new Map<string, number>();
  for (const item of items) {
    if (!item.groupName) {
      rows.push({ type: 'item', item });
      continue;
    }
    const existing = groupIndex.get(item.groupName);
    if (existing === undefined) {
      groupIndex.set(item.groupName, rows.length);
      rows.push({ type: 'group', name: item.groupName, items: [item] });
    } else {
      (rows[existing] as { items: EquipmentItem[] }).items.push(item);
    }
  }

  const headers = [
    'Asset ID',
    'Name',
    'Category',
    'Status',
    'Total',
    'Avail',
    'Out',
    'Service',
    'Holders',
    'Location',
    'Actions',
  ];

  return (
    <div className="overflow-x-auto rounded-lg border border-forge-border">
      <table className="min-w-[960px] w-full border-collapse">
        <thead>
          <tr className="bg-forge-bg/40 text-left text-xs uppercase tracking-wide text-forge-muted">
            {headers.map((h) => (
              <th key={h} className="px-3 py-2 font-medium">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {items.length === 0 && (
            <tr>
              <td
                colSpan={headers.length}
                className="px-3 py-8 text-center text-sm text-forge-muted"
              >
                No equipment matches the current filters.
              </td>
            </tr>
          )}
          {rows.map((row) => {
            if (row.type === 'item') {
              return (
                <ItemRow
                  key={row.item.id}
                  item={row.item}
                  child={false}
                  onEdit={props.onEdit}
                  onDelete={props.onDelete}
                  onCheckout={props.onCheckout}
                  onReturn={props.onReturn}
                  onService={props.onService}
                  onAvailable={props.onAvailable}
                />
              );
            }

            const collapsed = collapsedGroups.has(row.name);
            const total = row.items.reduce((s, i) => s + i.quantity, 0);
            const available = row.items.reduce(
              (s, i) => s + availableQuantity(i),
              0,
            );
            const out = row.items.reduce((s, i) => s + checkedOutQuantity(i), 0);
            const service = row.items.reduce(
              (s, i) => s + i.serviceQuantity,
              0,
            );
            const category = [
              ...new Set(row.items.map((i) => i.category).filter(Boolean)),
            ].join(', ');
            const location = [
              ...new Set(row.items.map((i) => i.location).filter(Boolean)),
            ].join(', ');

            return (
              <Fragment key={row.name}>
                <tr className="border-t-2 border-forge-border bg-forge-bg/60">
                  <td className={`${cell} font-semibold`} colSpan={2}>
                    <button
                      type="button"
                      onClick={() => onToggleGroup(row.name)}
                      aria-label={`${collapsed ? 'Expand' : 'Collapse'} ${row.name}`}
                      className="mr-2 inline-flex h-5 w-5 items-center justify-center rounded border border-forge-border text-forge-muted transition hover:text-forge-text"
                    >
                      {collapsed ? '+' : '−'}
                    </button>
                    {row.name}
                    <span className="ml-2 text-xs font-normal text-forge-muted">
                      {row.items.length} item(s)
                    </span>
                  </td>
                  <td className={cell}>{category || '—'}</td>
                  <td className={cell}>
                    <StatusBadge
                      status={groupStatus(total, available, out, service)}
                    />
                  </td>
                  <td className={numCell}>{total}</td>
                  <td className={numCell}>{available}</td>
                  <td className={numCell}>{out}</td>
                  <td className={numCell}>{service}</td>
                  <td className={cell} />
                  <td className={cell}>{location || '—'}</td>
                  <td className={cell} />
                </tr>
                {!collapsed &&
                  row.items.map((item) => (
                    <ItemRow
                      key={item.id}
                      item={item}
                      child
                      onEdit={props.onEdit}
                      onDelete={props.onDelete}
                      onCheckout={props.onCheckout}
                      onReturn={props.onReturn}
                      onService={props.onService}
                      onAvailable={props.onAvailable}
                    />
                  ))}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
