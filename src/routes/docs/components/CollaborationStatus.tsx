import { Link, useLocation } from 'react-router-dom';
import { usePermissions } from '../comments/permissions';

/**
 * CollaborationStatus — states plainly whether the reader can annotate.
 *
 * Without this the page is silent about authorization: an approved member and a
 * signed-out visitor see an identical document, and the only difference (a
 * toolbar that appears on selection) is invisible until you try it. Members who
 * were simply signed out on a shared machine had no way to tell why commenting
 * "did not work".
 *
 * Renders nothing until auth resolves, so a member never sees a flash of the
 * read-only notice.
 */
export default function CollaborationStatus() {
  const permissions = usePermissions();
  const location = useLocation();

  if (!permissions.ready) return null;

  if (permissions.can('createThread')) {
    return (
      <p className="flex flex-wrap items-center gap-2 border border-forge-signal/40 bg-forge-signal/5 px-4 py-2.5 font-mono text-[0.65rem] uppercase tracking-[0.12em] text-forge-signal">
        <span aria-hidden="true">●</span>
        Review mode — select any passage to open a comment thread
        <span className="text-forge-muted/70">
          · signed in as {permissions.actor.name}
        </span>
      </p>
    );
  }

  const signedOut = permissions.readOnlyReason === 'signed-out';

  return (
    <p className="flex flex-wrap items-center gap-2 border border-forge-border bg-white/[0.02] px-4 py-2.5 font-mono text-[0.65rem] uppercase tracking-[0.12em] text-forge-muted">
      <span aria-hidden="true">○</span>
      Read only —{' '}
      {signedOut
        ? 'sign in as an approved member to comment'
        : 'your account is awaiting approval'}
      {signedOut && (
        <Link
          to="/login"
          state={{ from: location }}
          className="text-forge-accent underline-offset-2 hover:underline"
        >
          Sign in
        </Link>
      )}
    </p>
  );
}
