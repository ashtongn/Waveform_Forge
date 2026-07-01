import type { Timestamp } from 'firebase/firestore';

// Derived at render time from quantities — never stored on the document.
export type EquipmentStatus =
  | 'Available'
  | 'Checked Out'
  | 'In Service'
  | 'Partial';

// A single person/team holding some quantity of an item. Dates are plain
// YYYY-MM-DD strings so they round-trip cleanly through forms and Firestore.
export interface Checkout {
  id: string;
  person: string;
  quantity: number;
  checkoutDate: string;
  dueDate: string;
  notes: string;
}

// The mutable fields persisted to Firestore (plus server-managed metadata).
export interface EquipmentWriteData {
  assetId: string;
  name: string;
  category: string;
  groupName: string;
  location: string;
  quantity: number;
  serviceQuantity: number;
  checkouts: Checkout[];
  notes: string;
}

// A full equipment record as read back from Firestore.
export interface EquipmentItem extends EquipmentWriteData {
  id: string;
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
  createdBy: string | null;
}

// The subset of fields edited through the add/edit form. Checkouts and the
// derived counts are managed by the check-out / return / service actions.
export interface EquipmentFormValues {
  assetId: string;
  name: string;
  category: string;
  groupName: string;
  location: string;
  quantity: number;
  serviceQuantity: number;
  notes: string;
}
