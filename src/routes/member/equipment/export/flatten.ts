import type { EquipmentItem } from '../types';
import {
  availableQuantity,
  checkedOutQuantity,
  displayStatus,
} from '../helpers';

// A single item flattened into plain scalars + a holder list. This is the
// single source of truth every export format renders from.
export interface ExportRow {
  assetId: string;
  name: string;
  category: string;
  groupName: string;
  location: string;
  quantity: number;
  available: number;
  checkedOut: number;
  serviceQuantity: number;
  status: string;
  holders: string[];
  notes: string;
}

export interface ExportSummary {
  total: number;
  available: number;
  checkedOut: number;
  service: number;
  itemCount: number;
}

export function flattenForExport(
  items: EquipmentItem[],
  includeHolders: boolean,
): ExportRow[] {
  return items.map((item) => ({
    assetId: item.assetId,
    name: item.name,
    category: item.category,
    groupName: item.groupName,
    location: item.location,
    quantity: item.quantity,
    available: availableQuantity(item),
    checkedOut: checkedOutQuantity(item),
    serviceQuantity: item.serviceQuantity,
    status: displayStatus(item),
    holders: includeHolders
      ? item.checkouts.map(
          (c) =>
            `${c.person} (${c.quantity})${c.dueDate ? ` due ${c.dueDate}` : ''}`,
        )
      : [],
    notes: item.notes,
  }));
}

export function summarize(items: EquipmentItem[]): ExportSummary {
  return {
    total: items.reduce((s, i) => s + i.quantity, 0),
    available: items.reduce((s, i) => s + availableQuantity(i), 0),
    checkedOut: items.reduce((s, i) => s + checkedOutQuantity(i), 0),
    service: items.reduce((s, i) => s + i.serviceQuantity, 0),
    itemCount: items.length,
  };
}
