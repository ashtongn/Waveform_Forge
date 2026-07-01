import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { Profile, UserStatus } from './types';

// Live-subscribe to all profiles, newest first. Only the admin UID can read the
// full collection (enforced by the Firestore rules), so this is admin-only.
// Returns the unsubscribe function.
export function subscribeToProfiles(
  onData: (profiles: Profile[]) => void,
  onError: (err: Error) => void,
) {
  const q = query(collection(db, 'profiles'), orderBy('createdAt', 'desc'));
  return onSnapshot(
    q,
    (snap) => {
      const profiles = snap.docs.map((d) => {
        const data = d.data();
        return {
          uid: d.id,
          email: data.email ?? null,
          role: data.role,
          status: data.status,
          createdAt: data.createdAt ?? null,
        } satisfies Profile;
      });
      onData(profiles);
    },
    (err) => onError(err),
  );
}

// Admin-only status change. The Firestore rules permit this only for the
// hard-coded admin UID.
export function setProfileStatus(uid: string, status: UserStatus) {
  return updateDoc(doc(db, 'profiles', uid), { status });
}
