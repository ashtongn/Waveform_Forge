import { useState } from 'react';
import { useAuth } from '../../auth/useAuth';
import { logOut, requestReapproval } from '../../auth/actions';

// Shown to a signed-in user whose profile is not 'approved'. Pending users see
// a "waiting for review" message; denied users can re-request review (which
// moves their status back to 'pending' via the rules-permitted self-update).
export default function AccountStatus() {
  const { user, profile } = useAuth();
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const status = profile?.status;

  async function handleReapply() {
    if (!user) return;
    setError(null);
    setWorking(true);
    try {
      await requestReapproval(user.uid);
      // The live profile snapshot will flip status to 'pending' automatically.
    } catch {
      setError('Could not submit your request. Please try again.');
      setWorking(false);
    }
  }

  return (
    <section className="mx-auto max-w-md space-y-6 text-center">
      <header className="space-y-2">
        <p className="font-mono text-sm uppercase tracking-widest text-forge-accent">
          Account status
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">
          {status === 'denied' ? 'Access not approved' : 'Awaiting approval'}
        </h1>
      </header>

      {status === 'denied' ? (
        <p className="text-forge-muted">
          Your request for access was not approved. If you think this was a
          mistake, you can ask an admin to review it again.
        </p>
      ) : (
        <p className="text-forge-muted">
          Your account has been created and is waiting for an admin to review
          and approve it. You&apos;ll get access to member features once
          approved.
        </p>
      )}

      {error && (
        <p role="alert" className="text-sm text-red-400">
          {error}
        </p>
      )}

      <div className="flex flex-col items-center gap-3">
        {status === 'denied' && (
          <button
            type="button"
            onClick={handleReapply}
            disabled={working}
            className="rounded-md bg-forge-accent px-4 py-2 text-sm font-semibold text-forge-bg transition hover:bg-forge-accent/90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {working ? 'Submitting…' : 'Request review again'}
          </button>
        )}
        <button
          type="button"
          onClick={() => logOut()}
          className="text-sm font-medium text-forge-muted hover:text-forge-text"
        >
          Sign out
        </button>
      </div>
    </section>
  );
}
