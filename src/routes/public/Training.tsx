import JammingVisualization from './training/JammingVisualization';

/**
 * Public, education-only training page. Available to everyone (no member
 * approval). It presents an abstract, frequency-domain visualization so new
 * learners can compare conceptual jamming categories. It does not transmit,
 * generate, or expose any operational signal parameters.
 */
export default function Training() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <p className="font-mono text-sm uppercase tracking-widest text-forge-signal">
            Waveform Forge / Training Lab
          </p>
          <h1 className="text-3xl font-semibold uppercase tracking-tight sm:text-4xl">
            Jamming Visualization
          </h1>
        </div>
        <p className="max-w-xs border border-forge-border bg-white/[0.025] px-3 py-2.5 text-right font-mono text-[0.72rem] uppercase leading-relaxed tracking-[0.08em] text-forge-muted sm:text-right">
          Visual-only training • no RF values • no signal generation
        </p>
      </header>

      {/* Hero / intent */}
      <section className="relative overflow-hidden border border-forge-border bg-forge-panel/80 p-5 shadow-2xl sm:p-8">
        <div className="grid gap-6 lg:grid-cols-[1.35fr_0.65fr] lg:items-end">
          <div>
            <p className="font-mono text-xs uppercase tracking-widest text-forge-signal">
              Educational spectrum behavior reference
            </p>
            <p className="mt-4 max-w-2xl leading-relaxed text-forge-muted">
              This page demonstrates how different jamming categories can be
              represented from an abstract frequency-domain perspective. It is
              intentionally conceptual: the axis is unlabeled, the amplitudes are
              fictional, and the animation does not transmit, propagate,
              synthesize, or provide operational signal parameters.
            </p>
            <div className="mt-6 grid grid-cols-1 gap-2.5 sm:grid-cols-3">
              {[
                { label: 'Mode', value: 'Educational' },
                { label: 'Signal data', value: 'Fictional' },
                { label: 'Output', value: 'Canvas only' },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="border border-forge-border bg-black/40 p-3"
                >
                  <div className="font-mono text-[0.68rem] uppercase tracking-[0.12em] text-forge-muted/70">
                    {stat.label}
                  </div>
                  <div className="mt-2 font-mono text-sm text-forge-text">
                    {stat.value}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <aside className="border border-forge-border bg-black/20 p-4">
            <div className="mb-3 font-mono text-[0.72rem] uppercase tracking-[0.14em] text-forge-accent">
              Layout intent
            </div>
            <ul className="grid gap-2.5 text-sm text-forge-muted">
              {[
                'Top navigation selects the jamming category.',
                'The blue trace represents a small training signal.',
                'The red trace appears only when “jamming active” is toggled.',
                'The lower waterfall gives learners a time-history view.',
              ].map((item) => (
                <li
                  key={item}
                  className="grid grid-cols-[18px_1fr] items-start gap-2"
                >
                  <span className="mt-1.5 h-1.5 w-1.5 border border-forge-signal bg-forge-signal/10" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </aside>
        </div>
      </section>

      {/* Interactive trainer */}
      <JammingVisualization />

      {/* Educational modules */}
      <section
        aria-label="How to use this page"
        className="grid grid-cols-1 gap-3 sm:grid-cols-3"
      >
        {[
          {
            kicker: 'Learn / 01',
            title: 'Pick a category',
            body: 'Use the top tabs to select a conceptual jamming type and read its plain-language description.',
          },
          {
            kicker: 'Learn / 02',
            title: 'Toggle the overlay',
            body: 'Enable “jamming active” to reveal the red overlay and compare it against the blue training signal.',
          },
          {
            kicker: 'Learn / 03',
            title: 'Read the waterfall',
            body: 'Watch the lower history view to see how each abstract pattern evolves over time.',
          },
        ].map((module) => (
          <article
            key={module.kicker}
            className="border border-forge-border bg-forge-panel/70 p-4 sm:p-5"
          >
            <div className="font-mono text-[0.68rem] uppercase tracking-[0.14em] text-forge-accent">
              {module.kicker}
            </div>
            <h3 className="mt-3 text-base font-semibold uppercase tracking-tight">
              {module.title}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-forge-muted">
              {module.body}
            </p>
          </article>
        ))}
      </section>

      {/* Public-safety note */}
      <p className="font-mono text-[0.69rem] uppercase leading-relaxed tracking-[0.1em] text-forge-muted/70">
        This page is intentionally abstract and non-operational. It does not
        contain controlled information, tactical data, RF values, transmit logic,
        or instructions for affecting communications systems. It exists only to
        help new learners visualize conceptual patterns.
      </p>
    </div>
  );
}
