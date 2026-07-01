import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <section className="space-y-10">
      <div className="space-y-4">
        <p className="font-mono text-sm uppercase tracking-widest text-forge-accent">
          Central Operations Hub
        </p>
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
          Waveform Forge
        </h1>
        <p className="max-w-2xl text-lg text-forge-muted">
          The team&apos;s home for equipment tracking, project management,
          training, and onboarding — built for the programmers and engineers who
          design and refine waveform solutions.
        </p>
        <div className="flex flex-wrap gap-3 pt-2">
          <Link
            to="/about"
            className="rounded-md bg-forge-accent px-4 py-2 text-sm font-semibold text-forge-bg transition hover:bg-forge-accent/90"
          >
            Learn what we do
          </Link>
          <span className="rounded-md border border-forge-border px-4 py-2 text-sm font-medium text-forge-muted">
            Team sign-in — coming soon
          </span>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[
          {
            title: 'Equipment Tracking',
            body: 'Inventory and check-in/check-out for team assets.',
          },
          {
            title: 'Kanban Boards',
            body: 'Real-time project and task tracking for the team.',
          },
          {
            title: 'Training & Onboarding',
            body: 'Lessons, references, and material for new members.',
          },
        ].map((card) => (
          <div
            key={card.title}
            className="rounded-lg border border-forge-border bg-forge-panel/50 p-5"
          >
            <h2 className="text-base font-semibold text-forge-text">
              {card.title}
            </h2>
            <p className="mt-1 text-sm text-forge-muted">{card.body}</p>
            <p className="mt-3 font-mono text-xs uppercase tracking-wider text-forge-accent/70">
              Members only · in development
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
