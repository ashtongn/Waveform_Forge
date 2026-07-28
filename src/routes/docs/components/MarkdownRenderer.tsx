import { memo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import rehypeSlug from 'rehype-slug';

/**
 * MarkdownRenderer.
 *
 * Renders one chunk of Markdown — usually a single document section — with
 * GitHub-flavoured Markdown (tables, task lists, strikethrough, autolinks), raw
 * inline HTML, and automatic heading slugs used by the table of contents and
 * deep links.
 *
 * The `.wf-doc` typography wrapper lives on the caller so the background grid
 * and heading rhythm stay continuous across sections.
 *
 * Two properties matter for the rest of the system:
 *
 *  1. **It is memoized on `content`.** The highlight layer mutates this
 *     subtree directly; memoization guarantees React never reconciles it while
 *     those mutations are live. Only a genuine content change re-renders it.
 *  2. **`data-wf-ignore`.** Any decorative text injected into the flow is
 *     marked so it stays out of the anchoring text index.
 *
 * Security note: `rehype-raw` is safe for the repository-seeded copy, which is a
 * build-time asset. Sections edited in-app are authored only by approved
 * members — the same trust level as any other shared team collection — and
 * comment bodies, which are open to a wider audience, are rendered as plain
 * text elsewhere rather than through this component.
 */
interface MarkdownRendererProps {
  content: string;
}

function MarkdownRendererBase({ content }: MarkdownRendererProps) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeRaw, rehypeSlug]}
      components={{
        a: ({ href, children, ...props }) => {
          const external = Boolean(href && /^https?:\/\//i.test(href));
          return (
            <a
              {...props}
              href={href}
              target={external ? '_blank' : undefined}
              rel={external ? 'noreferrer noopener' : undefined}
            >
              {children}
            </a>
          );
        },
        table: ({ children, ...props }) => (
          <div className="wf-doc__table-scroll">
            <table {...props}>{children}</table>
          </div>
        ),
        img: ({ ...props }) => <img {...props} loading="lazy" decoding="async" />,
      }}
    >
      {content}
    </ReactMarkdown>
  );
}

const MarkdownRenderer = memo(MarkdownRendererBase);
MarkdownRenderer.displayName = 'MarkdownRenderer';

export default MarkdownRenderer;
