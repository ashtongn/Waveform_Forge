import type { Timestamp } from 'firebase/firestore';

// Authority for `role: 'admin'` ultimately comes from the hard-coded admin UID
// in the Firestore Security Rules, not from this field alone.
export type UserRole = 'member' | 'admin';

// New sign-ups start as 'pending'. Only the admin can move a profile to
// 'approved' or 'denied'. A 'denied' user may re-request (back to 'pending').
export type UserStatus = 'pending' | 'approved' | 'denied';

export interface Profile {
  uid: string;
  email: string | null;
  role: UserRole;
  status: UserStatus;
  createdAt: Timestamp | null;
}
