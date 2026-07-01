export default function About() {
  return (
    <article className="prose-invert max-w-3xl space-y-6">
      <header className="space-y-2">
        <p className="font-mono text-sm uppercase tracking-widest text-forge-accent">
          About the Team
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">What We Do</h1>
      </header>

      <p className="text-lg leading-relaxed text-forge-muted">
        Our team designs, develops, and refines waveform solutions for complex
        signal environments. We bring together programmers and engineers to turn
        difficult communication challenges into reliable, well-engineered
        capabilities.
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-forge-border bg-forge-panel/50 p-5">
          <h2 className="text-base font-semibold text-forge-text">
            Engineering
          </h2>
          <p className="mt-1 text-sm text-forge-muted">
            We analyze signal environments and engineer robust waveform designs
            from concept through validation.
          </p>
        </div>
        <div className="rounded-lg border border-forge-border bg-forge-panel/50 p-5">
          <h2 className="text-base font-semibold text-forge-text">
            Software
          </h2>
          <p className="mt-1 text-sm text-forge-muted">
            We build and maintain the software that implements, tests, and
            deploys our waveform solutions.
          </p>
        </div>
      </div>

      <p className="text-sm leading-relaxed text-forge-muted">
        Waveform Forge is our internal operations hub. This public page shares a
        general overview of our mission; internal tools and resources are
        available to approved team members after signing in.
      </p>
    </article>
  );
}
