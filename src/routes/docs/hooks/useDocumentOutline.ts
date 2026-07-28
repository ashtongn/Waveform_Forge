import { useEffect, useState, type RefObject } from 'react';

export interface OutlineHeading {
  id: string;
  /** Authored heading text, with the generated number excluded. */
  text: string;
  /** Generated section number, e.g. `3.2.1`, or null if unnumbered. */
  number: string | null;
  /** 2 = `##`, 3 = `###`, 4 = `####`. */
  depth: number;
}

/**
 * Builds the table of contents from the *rendered* headings rather than by
 * re-parsing the Markdown.
 *
 * That guarantees the ids used by the TOC are byte-identical to the ones
 * `rehype-slug` generated — no need to reimplement GitHub's slug algorithm and
 * keep it in sync — and that the numbers shown in the TOC are the very same
 * generated labels rendered in the document, so the two can never disagree.
 *
 * Also tracks the heading currently in view so the TOC can highlight the active
 * section while scrolling. A top-biased root margin makes the active entry
 * change as a section's heading reaches the top of the viewport, which is what
 * readers expect from documentation sites.
 */
export function useDocumentOutline(
  containerRef: RefObject<HTMLElement>,
  contentKey: string,
): { headings: OutlineHeading[]; activeId: string | null } {
  const [headings, setHeadings] = useState<OutlineHeading[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Limited to `##` and `###`: the document numbers deeper levels, but a
    // contents list several hundred entries long stops being navigable.
    const nodes = Array.from(
      container.querySelectorAll<HTMLHeadingElement>('h2[id], h3[id]'),
    );

    setHeadings(
      nodes.map((node) => ({
        id: node.id,
        text: authoredText(node),
        number: node.querySelector('.wf-doc__num')?.textContent?.trim() ?? null,
        depth: Number(node.tagName.slice(1)),
      })),
    );
    setActiveId(nodes[0]?.id ?? null);

    if (nodes.length === 0) return;

    const visible = new Set<string>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const id = (entry.target as HTMLElement).id;
          if (entry.isIntersecting) visible.add(id);
          else visible.delete(id);
        }

        // Pick the first heading (in document order) currently in the band.
        const next = nodes.find((node) => visible.has(node.id));
        if (next) setActiveId(next.id);
      },
      { rootMargin: '-96px 0px -70% 0px', threshold: 0 },
    );

    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, [containerRef, contentKey]);

  return { headings, activeId };
}

/**
 * Heading text with decorations removed.
 *
 * Mirrors the rule used by the anchoring text index: anything inside a
 * `[data-wf-ignore]` subtree is presentation, not content.
 */
function authoredText(heading: HTMLHeadingElement): string {
  let text = '';
  heading.childNodes.forEach((node) => {
    if (node.nodeType === Node.ELEMENT_NODE) {
      const element = node as HTMLElement;
      if (element.hasAttribute('data-wf-ignore')) return;
    }
    text += node.textContent ?? '';
  });
  return text.trim();
}
