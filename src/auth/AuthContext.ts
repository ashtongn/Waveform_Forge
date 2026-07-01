import { createContext } from 'react';
import type { User } from 'firebase/auth';
import type { Profile } from './types';

export interface AuthContextValue {
  // The Firebase Auth user, or null when signed out.
  user: User | null;
  // The Firestore /profiles/{uid} document for the signed-in user. Null when
  // signed out, or briefly null while the first snapshot is still loading.
  profile: Profile | null;
  // True until the initial auth state (and profile, if signed in) has resolved.
  // Guards should render nothing/a spinner while this is true to avoid flashed
  // redirects.
  loading: boolean;
}

export const AuthContext = createContext<AuthContextValue | undefined>(
  undefined,
);
