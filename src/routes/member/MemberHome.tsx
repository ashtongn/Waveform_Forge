import { useAuth } from '../../auth/useAuth';

// Placeholder landing for approved members. Real member features (equipment,
// kanban, training) will be added as their own protected routes.
export default function MemberHome() {
  const { user } = useAuth();

  return (
    <section className="space-y-4">
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
    </section>
  );
}
