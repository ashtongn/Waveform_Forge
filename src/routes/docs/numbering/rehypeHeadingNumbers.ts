import type { Element, ElementContent, Root, RootContent } from 'hast';

/**
 * rehype plugin that prepends generated numbers to headings.
 *
 * The number is injected as a separate `<span data-wf-ignore>` rather than by
 * rewriting the heading text, which is what makes the whole feature safe:
 *
 *  - **Anchoring.** `buildTextIndex` skips `[data-wf-ignore]` subtrees, so
 *    generated labels never enter the flat document text. Inserting a heading
 *    renumbers the document without shifting a single comment anchor.
 *  - **Search.** For the same reason, searching matches only authored text.
 *  - **Slugs.** This plugin must run *after* `rehype-slug`, so heading ids are
 *    derived from the text alone and stay stable across renumbering.
 *  - **Export.** Nothing is written back into the Markdown, so the stored
 *    source and any export remain clean and semantic.
 *
 * Labels are supplied by the numbering engine and consumed in document order.
 * Headings authored as raw HTML would not be counted by the Markdown scanner
 * and are therefore skipped here too, keeping the two in step.
 */
const NUMBERED_TAGS = new Set(['h2', 'h3', 'h4']);

export function rehypeHeadingNumbers(labels: string[]) {
  return function attach() {
    return (tree: Root) => {
      if (labels.length === 0) return;

      let index = 0;
      eachElement(tree.children, (element) => {
        if (!NUMBERED_TAGS.has(element.tagName)) return;

        const label = labels[index];
        index += 1;
        if (!label) return;

        element.children.unshift(numberSpan(label));
      });
    };
  };
}

function numberSpan(label: string): ElementContent {
  return {
    type: 'element',
    tagName: 'span',
    properties: {
      className: ['wf-doc__num'],
      'data-wf-ignore': true,
      'aria-hidden': 'true',
    },
    children: [{ type: 'text', value: label }],
  } satisfies Element;
}

/** Pre-order depth-first walk, so elements arrive in document order. */
function eachElement(
  nodes: Array<RootContent | ElementContent>,
  visit: (element: Element) => void,
): void {
  for (const node of nodes) {
    if (node.type !== 'element') continue;
    visit(node);
    eachElement(node.children, visit);
  }
}
