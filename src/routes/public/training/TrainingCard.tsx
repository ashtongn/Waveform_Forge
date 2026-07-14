import { Link } from 'react-router-dom';
import type { TrainingDefinition } from './registry';

interface TrainingCardProps {
  training: TrainingDefinition;
}

/**
 * A single catalog card. Available trainings link to their detail page; a
 * `coming_soon` training renders as a non-interactive teaser.
 */
export default function TrainingCard({ training }: TrainingCardProps) {
  const available = training.status === 'available';

  const inner = (
    <article
      className={[
        'flex h-full flex-col border border-forge-border bg-forge-panel/70 p-5 transition',
        available
          ? 'group-hover:border-forge-accent/60 group-hover:bg-forge-panel'
          : 'opacity-60',
      ].join(' ')}
    >
      <div className="flex items-start justify-between gap-3">
        <span aria-hidden="true" className="text-2xl leading-none">
          {training.icon}
        </span>
        <span className="border border-forge-border px-2 py-1 font-mono text-[0.62rem] uppercase tracking-[0.12em] text-forge-muted">
          {available ? training.difficulty : 'Coming soon'}
        </span>
      </div>

      <h2 className="mt-4 text-lg font-semibold uppercase tracking-tight text-forge-text">
        {training.title}
      </h2>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-forge-muted">
        {training.summary}
      </p>

      <div className="mt-4 flex flex-wrap gap-1.5">
        {training.tags.map((tag) => (
          <span
            key={tag}
            className="border border-forge-border bg-black/30 px-2 py-1 font-mono text-[0.62rem] uppercase tracking-[0.1em] text-forge-muted/80"
          >
            {tag}
          </span>
        ))}
      </div>

      {available && (
        <span className="mt-5 inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.1em] text-forge-accent">
          Open training
          <span
            aria-hidden="true"
            className="transition-transform group-hover:translate-x-1"
          >
            &rarr;
          </span>
        </span>
      )}
    </article>
  );

  if (!available) {
    return (
      <div aria-disabled="true" className="group block">
        {inner}
      </div>
    );
  }

  return (
    <Link
      to={`/training/${training.slug}`}
      className="group block focus:outline-none focus-visible:ring-2 focus-visible:ring-forge-accent"
    >
      {inner}
    </Link>
  );
}
