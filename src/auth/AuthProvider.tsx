import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { AuthContext, type AuthContextValue } from './AuthContext';
import type { Profile } from './types';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // Track Firebase Auth state.
  useEffect(() => {
    return onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);
      if (!nextUser) {
        setProfile(null);
        setLoading(false);
      } else {
        // Keep loading until the profile snapshot (below) resolves.
        setLoading(true);
      }
    });
  }, []);

  // Subscribe to the signed-in user's /profiles/{uid} document in real time so
  // that an admin approval/denial reflects immediately without a page reload.
  useEffect(() => {
    if (!user) return;

    const ref = doc(db, 'profiles', user.uid);
    return onSnapshot(
      ref,
      (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          setProfile({
            uid: user.uid,
            email: user.email,
            role: data.role,
            status: data.status,
            createdAt: data.createdAt ?? null,
          });
        } else {
          // Signed in but no profile doc yet (e.g. mid-signup).
          setProfile(null);
        }
        setLoading(false);
      },
      () => {
        // Permission error or offline: don't leave the app stuck loading.
        setProfile(null);
        setLoading(false);
      },
    );
  }, [user]);

  const value = useMemo<AuthContextValue>(
    () => ({ user, profile, loading }),
    [user, profile, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
