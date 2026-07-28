import { memo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import rehypeSlug from 'rehype-slug';

/**
 * MarkdownRenderer.
 *
 * Renders the document with GitHub-flavoured Markdown (tables, task lists,
 * strikethrough, autolinks), raw inline HTML, and automatic heading slugs used
 * by the table of contents and deep links.
 *
 * Two properties matter for the rest of the system:
 *
 *  1. **It is memoized on `content`.** The highlight layer mutates this
 *     subtree directly; memoization guarantees React never reconciles it while
 *     those mutations are live. Only a genuine document change re-renders it.
 *  2. **`data-wf-ignore`.** Any decorative text injected into the flow is
 *     marked so it stays out of the anchoring text index.
 *
 * Security note: `rehype-raw` is safe here because the Markdown is a
 * build-time, repository-controlled asset — never user-submitted input. Comment
 * bodies, which *are* user input, are rendered as plain text elsewhere.
 */
interface MarkdownRendererProps {
  content: string;
}

function MarkdownRendererBase({ content }: MarkdownRendererProps) {
  return (
    <div className="wf-doc">
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
    </div>
  );
}

const MarkdownRenderer = memo(MarkdownRendererBase);
MarkdownRenderer.displayName = 'MarkdownRenderer';

export default MarkdownRenderer;
