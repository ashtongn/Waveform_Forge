import { formatTimestamp } from '../comments/helpers';
import type { DocumentMetadata } from '../markdown/loader';

interface VersionBannerProps {
  metadata: DocumentMetadata;
  sourcePath: string;
  /** True when the body is served from the editable store, not the repo copy. */
  live: boolean;
  lastUpdatedAt: number | null;
  lastEditor: string | null;
  openThreadCount: number;
  resolvedThreadCount: number;
  onExport(): void;
}

/**
 * VersionBanner — the "official document" header.
 *
 * Provenance is taken from the live store when the document has been imported,
 * and from the Markdown file's YAML front matter otherwise, so the banner always
 * describes the copy actually on screen. Missing fields are omitted rather than
 * rendered as placeholders.
 */
export default function VersionBanner({
  metadata,
  sourcePath,
  live,
  lastUpdatedAt,
  lastEditor,
  openThreadCount,
  resolvedThreadCount,
  onExport,
}: VersionBannerProps) {
  const facts: Array<[string, string]> = [];
  if (metadata.version) facts.push(['Version', metadata.version]);

  const updated = live && lastUpdatedAt ? formatTimestamp(lastUpdatedAt) : metadata.lastUpdated;
  if (updated) facts.push(['Last updated', updated]);

  const editor = (live ? lastEditor : null) ?? metadata.lastEditor;
  if (editor) facts.push(['Last editor', editor]);

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
          {live ? 'Live document · seeded from' : 'Source of truth'}&nbsp;
          <span className="text-forge-accent">{sourcePath}</span>
        </p>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onExport}
            title="Download the current Markdown so it can be committed back to the repository"
            className="border border-forge-border px-2 py-1 font-mono text-[0.62rem] uppercase tracking-[0.12em] text-forge-muted transition-colors hover:border-forge-accent/60 hover:text-forge-accent"
          >
            Export .md
          </button>

          {metadata.classification && (
            <p className="border border-forge-border px-2 py-1 font-mono text-[0.62rem] uppercase tracking-[0.12em] text-forge-muted">
              {metadata.classification}
            </p>
          )}
        </div>
      </div>
    </header>
  );
}
