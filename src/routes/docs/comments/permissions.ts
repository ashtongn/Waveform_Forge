import { createContext, useContext } from 'react';
import type { Profile } from '../../../auth/types';
import type { User } from 'firebase/auth';

/**
 * Centralized authorization layer for the living-document experience.
 *
 * Every gated interaction in the UI asks this service rather than re-deriving
 * rules from `profile.status`/`profile.role`. That means the policy lives in one
 * auditable place and can grow (per-document roles, moderators, org policy)
 * without touching a single component.
 *
 * Client-side checks are a UX affordance only — Firestore rules remain the
 * real enforcement boundary.
 */
export type DocumentAction =
  | 'highlight'
  | 'createThread'
  | 'reply'
  | 'edit'
  | 'delete'
  | 'resolve'
  | 'reopen'
  // Document body, not comments.
  | 'editDocument'
  | 'importDocument';

export interface PermissionTarget {
  /** Uid of the user who authored the thing being acted upon. */
  authorUid?: string | null;
}

export interface Actor {
  uid: string | null;
  /** Display label used when attributing new comments. */
  name: string;
  approved: boolean;
  admin: boolean;
}

export interface PermissionService {
  actor: Actor;
  /**
   * False while the auth state is still resolving. Consumers use this to avoid
   * briefly telling a signed-in member that they are a read-only visitor.
   */
  ready: boolean;
  /** Why the actor cannot collaborate, for explaining the read-only state. */
  readOnlyReason: 'none' | 'signed-out' | 'awaiting-approval';
  /** True when the actor may perform `action` against `target`. */
  can(action: DocumentAction, target?: PermissionTarget): boolean;
}

/** Read-only visitor: may read everything, may write nothing. */
export const ANONYMOUS_ACTOR: Actor = {
  uid: null,
  name: 'Guest',
  approved: false,
  admin: false,
};

export function createActor(user: User | null, profile: Profile | null): Actor {
  if (!user) return ANONYMOUS_ACTOR;
  return {
    uid: user.uid,
    name: displayNameFor(profile?.email ?? user.email),
    approved: profile?.status === 'approved',
    admin: profile?.role === 'admin',
  };
}

export function createPermissionService(
  actor: Actor,
  ready: boolean,
): PermissionService {
  const isCollaborator = actor.approved || actor.admin;
  const owns = (target?: PermissionTarget) =>
    Boolean(actor.uid) && target?.authorUid === actor.uid;

  return {
    actor,
    ready,
    readOnlyReason: isCollaborator
      ? 'none'
      : actor.uid
        ? 'awaiting-approval'
        : 'signed-out',
    can(action, target) {
      if (!isCollaborator) return false;

      switch (action) {
        // Authoring is open to any approved member.
        case 'highlight':
        case 'createThread':
        case 'reply':
          return true;

        // The document is collaboratively maintained: any approved member may
        // revise it, and any approved member may perform the one-time import
        // that moves it from the repository copy into the live store.
        case 'editDocument':
        case 'importDocument':
          return true;

        // Mutating existing content is owner-or-admin.
        case 'edit':
        case 'delete':
          return actor.admin || owns(target);

        // Thread lifecycle: the thread author or an admin closes/reopens it.
        case 'resolve':
        case 'reopen':
          return actor.admin || owns(target);

        default:
          return false;
      }
    },
  };
}

/** `first.last@example.mil` -> `First Last`. Falls back to the raw address. */
function displayNameFor(email: string | null | undefined): string {
  if (!email) return 'Member';
  const local = email.split('@')[0];
  if (!local) return email;
  return local
    .split(/[._-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export const PermissionContext = createContext<PermissionService | undefined>(
  undefined,
);

export function usePermissions(): PermissionService {
  const context = useContext(PermissionContext);
  if (!context) {
    throw new Error('usePermissions must be used within a <PermissionProvider>');
  }
  return context;
}
