import { Link } from 'react-router-dom';
import { getAllLivingDocuments } from '../registry';

/**
 * Catalog section listing the living Markdown documents.
 *
 * Rendered directly beneath the interactive RF training modules so the Training
 * Lab reads as: hands-on modules first, then the formal reference documents.
 * Driven entirely by the living-document registry.
 */
export default function LivingDocumentSection() {
  const documents = getAllLivingDocuments();
  if (documents.length === 0) return null;

  return (
    <section aria-label="Training documents" className="space-y-4 pt-2">
      <div className="space-y-2 border-t border-forge-border pt-6">
        <p className="font-mono text-sm uppercase tracking-widest text-forge-signal">
          Waveform Forge / Reference Documents
        </p>
        <h2 className="text-2xl font-semibold uppercase tracking-tight sm:text-3xl">
          Waveform Development Flight Training Plan
        </h2>
        <p className="max-w-2xl leading-relaxed text-forge-muted">
          Living engineering documents rendered straight from their Markdown
          source. Anyone may read, search, and follow the discussion; approved
          Waveform&nbsp;Forge members can highlight any passage and open a review
          thread against it.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {documents.map((document) => (
          <Link
            key={document.slug}
            to={`/docs/${document.slug}`}
            className="group block focus:outline-none focus-visible:ring-2 focus-visible:ring-forge-accent"
          >
            <article className="flex h-full flex-col border border-forge-border bg-forge-panel/70 p-5 transition group-hover:border-forge-accent/60 group-hover:bg-forge-panel">
              <div className="flex items-start justify-end">
                <span className="border border-forge-border px-2 py-1 font-mono text-[0.62rem] uppercase tracking-[0.12em] text-forge-muted">
                  Living document
                </span>
              </div>

              <h3 className="mt-4 text-lg font-semibold uppercase tracking-tight text-forge-text">
                {document.title}
              </h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-forge-muted">
                {document.summary}
              </p>

              <div className="mt-4 flex flex-wrap gap-1.5">
                {document.tags.map((tag) => (
                  <span
                    key={tag}
                    className="border border-forge-border bg-black/30 px-2 py-1 font-mono text-[0.62rem] uppercase tracking-[0.1em] text-forge-muted/80"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              <span className="mt-5 inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.1em] text-forge-accent">
                Open document
                <span
                  aria-hidden="true"
                  className="transition-transform group-hover:translate-x-1"
                >
                  &rarr;
                </span>
              </span>
            </article>
          </Link>
        ))}
      </div>
    </section>
  );
}
