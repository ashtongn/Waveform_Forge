import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../auth/useAuth';
import { subscribeToProfiles, setProfileStatus } from '../../auth/admin';
import type { Profile, UserStatus } from '../../auth/types';
import LoadingScreen from '../../components/LoadingScreen';

const statusBadge: Record<UserStatus, string> = {
  pending: 'bg-amber-500/15 text-amber-300',
  approved: 'bg-emerald-500/15 text-emerald-300',
  denied: 'bg-red-500/15 text-red-300',
};

function formatDate(profile: Profile): string {
  const ts = profile.createdAt;
  if (!ts) return '—';
  try {
    return ts.toDate().toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return '—';
  }
}

export default function AdminHome() {
  const { user } = useAuth();
  const [profiles, setProfiles] = useState<Profile[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyUid, setBusyUid] = useState<string | null>(null);

  useEffect(() => {
    return subscribeToProfiles(
      (data) => {
        setProfiles(data);
        setError(null);
      },
      () => setError('Could not load sign-ups. Please refresh and try again.'),
    );
  }, []);

  const pending = useMemo(
    () => (profiles ?? []).filter((p) => p.status === 'pending'),
    [profiles],
  );
  const others = useMemo(
    () => (profiles ?? []).filter((p) => p.status !== 'pending'),
    [profiles],
  );

  async function updateStatus(uid: string, status: UserStatus) {
    setBusyUid(uid);
    setError(null);
    try {
      await setProfileStatus(uid, status);
    } catch {
      setError('That action failed. Please try again.');
    } finally {
      setBusyUid(null);
    }
  }

  if (profiles === null && !error) return <LoadingScreen />;

  return (
    <section className="space-y-8">
      <header className="space-y-1">
        <p className="font-mono text-sm uppercase tracking-widest text-forge-accent">
          Admin
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">
          Sign-up approvals
        </h1>
        <p className="text-forge-muted">
          Review new sign-ups and grant or deny access to member features.
        </p>
      </header>

      {error && (
        <p role="alert" className="text-sm text-red-400">
          {error}
        </p>
      )}

      <div className="space-y-3">
        <h2 className="text-lg font-semibold">
          Pending <span className="text-forge-muted">({pending.length})</span>
        </h2>
        {pending.length === 0 ? (
          <p className="text-sm text-forge-muted">
            No pending sign-ups right now.
          </p>
        ) : (
          <ul className="space-y-2">
            {pending.map((p) => (
              <li
                key={p.uid}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-forge-border bg-forge-panel/50 p-4"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium text-forge-text">
                    {p.email ?? p.uid}
                  </p>
                  <p className="text-xs text-forge-muted">
                    Requested {formatDate(p)}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={busyUid === p.uid}
                    onClick={() => updateStatus(p.uid, 'approved')}
                    className="rounded-md bg-forge-accent px-3 py-1.5 text-sm font-semibold text-forge-bg transition hover:bg-forge-accent/90 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    disabled={busyUid === p.uid}
                    onClick={() => updateStatus(p.uid, 'denied')}
                    className="rounded-md border border-forge-border px-3 py-1.5 text-sm font-medium text-forge-muted transition hover:text-forge-text disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Deny
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="space-y-3">
        <h2 className="text-lg font-semibold">
          All accounts{' '}
          <span className="text-forge-muted">({others.length})</span>
        </h2>
        {others.length === 0 ? (
          <p className="text-sm text-forge-muted">No other accounts yet.</p>
        ) : (
          <ul className="space-y-2">
            {others.map((p) => {
              const isSelf = p.uid === user?.uid;
              return (
                <li
                  key={p.uid}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-forge-border bg-forge-panel/50 p-4"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium text-forge-text">
                      {p.email ?? p.uid}
                      {isSelf && (
                        <span className="ml-2 text-xs text-forge-muted">
                          (you)
                        </span>
                      )}
                    </p>
                    <div className="mt-1 flex items-center gap-2 text-xs">
                      <span
                        className={`rounded px-2 py-0.5 font-medium ${statusBadge[p.status]}`}
                      >
                        {p.status}
                      </span>
                      {p.role === 'admin' && (
                        <span className="rounded bg-forge-accent/15 px-2 py-0.5 font-medium text-forge-accent">
                          admin
                        </span>
                      )}
                    </div>
                  </div>
                  {!isSelf && p.role !== 'admin' && (
                    <div className="flex gap-2">
                      {p.status !== 'approved' && (
                        <button
                          type="button"
                          disabled={busyUid === p.uid}
                          onClick={() => updateStatus(p.uid, 'approved')}
                          className="rounded-md bg-forge-accent px-3 py-1.5 text-sm font-semibold text-forge-bg transition hover:bg-forge-accent/90 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          Approve
                        </button>
                      )}
                      {p.status !== 'denied' && (
                        <button
                          type="button"
                          disabled={busyUid === p.uid}
                          onClick={() => updateStatus(p.uid, 'denied')}
                          className="rounded-md border border-forge-border px-3 py-1.5 text-sm font-medium text-forge-muted transition hover:text-forge-text disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          Deny
                        </button>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
