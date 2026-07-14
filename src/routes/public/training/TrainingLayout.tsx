import { Link } from 'react-router-dom';

interface TrainingLayoutProps {
  title: string;
  children: React.ReactNode;
}

/**
 * Shared chrome for every training detail page: a breadcrumb back to the
 * catalog and the standard public-safety disclaimer. Individual training
 * modules render only their interactive content and rely on this wrapper for
 * consistent navigation and framing.
 */
export default function TrainingLayout({ title, children }: TrainingLayoutProps) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <nav
          aria-label="Breadcrumb"
          className="font-mono text-sm uppercase tracking-widest text-forge-muted"
        >
          <Link
            to="/training"
            className="transition-colors hover:text-forge-signal"
          >
            Training Lab
          </Link>
          <span className="mx-2 text-forge-border">/</span>
          <span className="text-forge-text">{title}</span>
        </nav>

        <Link
          to="/training"
          className="inline-flex items-center gap-2 self-start text-sm text-forge-accent transition-colors hover:text-forge-signal"
        >
          <span aria-hidden="true">&larr;</span>
          Back to catalog
        </Link>
      </div>

      {children}

      <p className="font-mono text-[0.69rem] uppercase leading-relaxed tracking-[0.1em] text-forge-muted/70">
        This training is intentionally abstract and non-operational. It does not
        contain controlled information, tactical data, RF values, transmit logic,
        or instructions for affecting communications systems. It exists only to
        help new learners visualize conceptual patterns.
      </p>
    </div>
  );
}
