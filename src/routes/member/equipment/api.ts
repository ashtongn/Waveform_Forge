import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore';
import { auth, db } from '../../../lib/firebase';
import type { EquipmentItem, EquipmentWriteData } from './types';

const COLLECTION = 'equipment';

// Live-subscribe to the whole inventory, ordered by asset id. Filtering,
// searching and grouping are done client-side, so no composite indexes are
// needed. Returns the unsubscribe function.
export function subscribeToEquipment(
  onData: (items: EquipmentItem[]) => void,
  onError: (err: Error) => void,
) {
  const q = query(collection(db, COLLECTION), orderBy('assetId'));
  return onSnapshot(
    q,
    (snap) => {
      const items = snap.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          assetId: data.assetId ?? '',
          name: data.name ?? '',
          category: data.category ?? '',
          groupName: data.groupName ?? '',
          location: data.location ?? '',
          quantity: data.quantity ?? 1,
          serviceQuantity: data.serviceQuantity ?? 0,
          checkouts: Array.isArray(data.checkouts) ? data.checkouts : [],
          notes: data.notes ?? '',
          createdAt: data.createdAt ?? null,
          updatedAt: data.updatedAt ?? null,
          createdBy: data.createdBy ?? null,
        } satisfies EquipmentItem;
      });
      onData(items);
    },
    (err) => onError(err),
  );
}

export function createEquipment(data: EquipmentWriteData) {
  return addDoc(collection(db, COLLECTION), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    createdBy: auth.currentUser?.uid ?? null,
  });
}

export function updateEquipment(id: string, data: EquipmentWriteData) {
  return updateDoc(doc(db, COLLECTION, id), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export function deleteEquipment(id: string) {
  return deleteDoc(doc(db, COLLECTION, id));
}

// Extract just the persisted fields from a full item, e.g. when re-saving after
// a checkout/return/service change.
export function toWriteData(item: EquipmentItem): EquipmentWriteData {
  return {
    assetId: item.assetId,
    name: item.name,
    category: item.category,
    groupName: item.groupName,
    location: item.location,
    quantity: item.quantity,
    serviceQuantity: item.serviceQuantity,
    checkouts: item.checkouts,
    notes: item.notes,
  };
}
