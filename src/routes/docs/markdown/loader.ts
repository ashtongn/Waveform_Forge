import { parseFrontMatter } from './frontmatter';

/**
 * MarkdownLoader.
 *
 * Every `.md` file in `/docs` is registered with Vite as a lazily-imported raw
 * string. Consequences:
 *
 *  - **Single source of truth.** The page renders `/docs/training_plan.md`
 *    directly; the content is never duplicated into the app.
 *  - **Automatic updates.** Editing the Markdown hot-reloads in development and
 *    is picked up by the next build in production.
 *  - **Scalable.** Each document is a separate lazy chunk, so a several-hundred
 *    page manual is only downloaded when its page is opened.
 *  - **Deploy-safe.** Bundling avoids runtime `fetch()` and therefore avoids the
 *    GitHub Pages `base` path pitfalls that plague `/public` assets.
 *
 * Adding a document is literally: drop the file in `/docs`, add a registry entry.
 */
const MARKDOWN_MODULES = import.meta.glob('/docs/*.md', {
  query: '?raw',
  import: 'default',
}) as Record<string, () => Promise<string>>;

export interface DocumentMetadata {
  title: string;
  version: string | null;
  lastUpdated: string | null;
  lastEditor: string | null;
  classification: string | null;
  summary: string | null;
}

export interface LoadedDocument {
  metadata: DocumentMetadata;
  /** Markdown body with front matter stripped. */
  content: string;
  /** Front matter verbatim, re-attached when the document is exported. */
  frontMatter: string;
}

export function listAvailableMarkdownPaths(): string[] {
  return Object.keys(MARKDOWN_MODULES);
}

export async function loadMarkdownDocument(
  path: string,
  fallbackTitle: string,
): Promise<LoadedDocument> {
  const loader = MARKDOWN_MODULES[path];
  if (!loader) {
    throw new Error(`Markdown document not found: ${path}`);
  }

  const raw = await loader();
  const { data, content, raw: frontMatter } = parseFrontMatter(raw);

  return {
    content,
    frontMatter,
    metadata: {
      title: data.title ?? extractFirstHeading(content) ?? fallbackTitle,
      version: data.version ?? null,
      lastUpdated: data.lastUpdated ?? null,
      lastEditor: data.lastEditor ?? null,
      classification: data.classification ?? null,
      summary: data.summary ?? null,
    },
  };
}

function extractFirstHeading(content: string): string | null {
  const match = /^#\s+(.+)$/m.exec(content);
  return match ? match[1].trim() : null;
}
