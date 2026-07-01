import type { EquipmentItem, EquipmentStatus } from './types';

// Total units currently checked out across all holders.
export function checkedOutQuantity(item: EquipmentItem): number {
  return item.checkouts.reduce((sum, c) => sum + c.quantity, 0);
}

// Units free to check out: total minus checked-out minus in-service.
export function availableQuantity(item: EquipmentItem): number {
  return Math.max(
    0,
    item.quantity - checkedOutQuantity(item) - item.serviceQuantity,
  );
}

// A single headline status for the row. "Partial" means the units are split
// across more than one state (e.g. some available, some checked out).
export function displayStatus(item: EquipmentItem): EquipmentStatus {
  const total = item.quantity;
  const out = checkedOutQuantity(item);
  const service = item.serviceQuantity;
  const available = total - out - service;

  if (available === total) return 'Available';
  if (out === total) return 'Checked Out';
  if (service === total) return 'In Service';
  return 'Partial';
}

// Same idea, computed from aggregate counts for a collapsed group row.
export function groupStatus(
  total: number,
  available: number,
  out: number,
  service: number,
): EquipmentStatus {
  if (available === total) return 'Available';
  if (out === total) return 'Checked Out';
  if (service === total) return 'In Service';
  return 'Partial';
}

export function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

// Short random id for client-generated checkout entries.
export function makeId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}
