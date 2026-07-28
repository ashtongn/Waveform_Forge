import type { DocumentMetadata } from '../markdown/loader';

interface VersionBannerProps {
  metadata: DocumentMetadata;
  sourcePath: string;
  openThreadCount: number;
  resolvedThreadCount: number;
}

/**
 * VersionBanner — the "official document" header.
 *
 * Values come from the Markdown file's YAML front matter, keeping the file the
 * single source of truth for its own provenance. Missing fields are simply
 * omitted rather than rendered as placeholders.
 */
export default function VersionBanner({
  metadata,
  sourcePath,
  openThreadCount,
  resolvedThreadCount,
}: VersionBannerProps) {
  const facts: Array<[string, string]> = [];
  if (metadata.version) facts.push(['Version', metadata.version]);
  if (metadata.lastUpdated) facts.push(['Last updated', metadata.lastUpdated]);
  if (metadata.lastEditor) facts.push(['Last editor', metadata.lastEditor]);
  facts.push(['Open comments', String(openThreadCount)]);
  facts.push(['Resolved', String(resolvedThreadCount)]);

  return (
    <header className="border border-forge-border bg-forge-panel/70">
      <div className="flex flex-col gap-2 border-b border-forge-border px-5 py-4">
        <p className="font-mono text-[0.7rem] uppercase tracking-[0.18em] text-forge-signal">
          Waveform Forge / Living Document
        </p>
        <h1 className="text-2xl font-semibold uppercase tracking-tight text-forge-text sm:text-3xl">
          {metadata.title}
        </h1>
        {metadata.summary && (
          <p className="max-w-3xl text-sm leading-relaxed text-forge-muted">
            {metadata.summary}
          </p>
        )}
      </div>

      <dl className="grid grid-cols-2 divide-forge-border sm:grid-cols-3 lg:grid-cols-5">
        {facts.map(([label, value]) => (
          <div key={label} className="border-b border-r border-forge-border px-5 py-3">
            <dt className="font-mono text-[0.62rem] uppercase tracking-[0.14em] text-forge-muted">
              {label}
            </dt>
            <dd className="mt-1 truncate text-sm text-forge-text" title={value}>
              {value}
            </dd>
          </div>
        ))}
      </dl>

      <div className="flex flex-wrap items-center justify-between gap-2 px-5 py-3">
        <p className="font-mono text-[0.62rem] uppercase tracking-[0.12em] text-forge-muted/80">
          Source of truth&nbsp;
          <span className="text-forge-accent">{sourcePath}</span>
        </p>
        {metadata.classification && (
          <p className="border border-forge-border px-2 py-1 font-mono text-[0.62rem] uppercase tracking-[0.12em] text-forge-muted">
            {metadata.classification}
          </p>
        )}
      </div>
    </header>
  );
}
