import { Link } from 'react-router-dom';
import { useAuth } from '../../auth/useAuth';

// Placeholder landing for approved members. Real member features (equipment,
// kanban, training) will be added as their own protected routes.
export default function MemberHome() {
  const { user } = useAuth();

  return (
    <section className="space-y-8">
      <div className="space-y-4">
        <p className="font-mono text-sm uppercase tracking-widest text-forge-accent">
          Member area
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">
          Welcome{user?.email ? `, ${user.email}` : ''}
        </h1>
        <p className="max-w-2xl text-forge-muted">
          You&apos;re approved. Member features — equipment tracking, kanban
          boards, and training — will appear here as they&apos;re built.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Link
          to="/app/equipment"
          className="rounded-lg border border-forge-border bg-forge-panel/50 p-5 transition hover:border-forge-accent"
        >
          <h2 className="text-lg font-semibold text-forge-text">
            Equipment tracker
          </h2>
          <p className="mt-1 text-sm text-forge-muted">
            Add gear, check it out to people, and track what&apos;s in service.
          </p>
        </Link>
        <Link
          to="/app/kanban"
          className="rounded-lg border border-forge-border bg-forge-panel/50 p-5 transition hover:border-forge-accent"
        >
          <h2 className="text-lg font-semibold text-forge-text">
            Kanban board
          </h2>
          <p className="mt-1 text-sm text-forge-muted">
            Plan and track the team&apos;s work across backlog, in-progress, and
            done.
          </p>
        </Link>
      </div>
    </section>
  );
}
