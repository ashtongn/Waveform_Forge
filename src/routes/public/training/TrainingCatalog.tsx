import TrainingCard from './TrainingCard';
import { getAllTrainings } from './registry';

/**
 * Public Training Lab catalog — the landing page for `/training`. Lists every
 * registered training as a card. Education-only: no auth, no progress tracking.
 */
export default function TrainingCatalog() {
  const trainings = getAllTrainings();

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <p className="font-mono text-sm uppercase tracking-widest text-forge-signal">
            Waveform Forge / Training Lab
          </p>
          <h1 className="text-3xl font-semibold uppercase tracking-tight sm:text-4xl">
            Interactive Trainings
          </h1>
          <p className="max-w-2xl leading-relaxed text-forge-muted">
            A growing set of abstract, education-only trainings. Each one is a
            self-contained interactive lesson built to help new learners
            visualize conceptual patterns. Choose a training to begin.
          </p>
        </div>
        <p className="max-w-xs border border-forge-border bg-white/[0.025] px-3 py-2.5 text-right font-mono text-[0.72rem] uppercase leading-relaxed tracking-[0.08em] text-forge-muted">
          Visual-only training • no RF values • no signal generation
        </p>
      </header>

      <section
        aria-label="Available trainings"
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
      >
        {trainings.map((training) => (
          <TrainingCard key={training.slug} training={training} />
        ))}
      </section>
    </div>
  );
}
