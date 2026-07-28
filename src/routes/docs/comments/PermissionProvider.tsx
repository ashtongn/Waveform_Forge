import { useMemo, type ReactNode } from 'react';
import { useAuth } from '../../../auth/useAuth';
import {
  createActor,
  createPermissionService,
  PermissionContext,
} from './permissions';

/**
 * Bridges the application's auth state into the document permission service.
 *
 * This is the only place where `useAuth()` is consulted for document
 * authorization; every consumer downstream depends on `usePermissions()`.
 */
export default function PermissionProvider({ children }: { children: ReactNode }) {
  const { user, profile, loading } = useAuth();

  const service = useMemo(
    () => createPermissionService(createActor(user, profile), !loading),
    [user, profile, loading],
  );

  return (
    <PermissionContext.Provider value={service}>
      {children}
    </PermissionContext.Provider>
  );
}
