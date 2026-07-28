import type { Element, ElementContent, Root, RootContent } from 'hast';

/**
 * rehype plugin that prepends generated numbers to headings and clauses.
 *
 * Numbers are injected as separate `<span data-wf-ignore>` nodes rather than by
 * rewriting text, which is what makes the whole feature safe:
 *
 *  - **Anchoring.** `buildTextIndex` skips `[data-wf-ignore]` subtrees, so
 *    generated labels never enter the flat document text. Inserting a heading
 *    renumbers the document without shifting a single comment anchor.
 *  - **Search.** For the same reason, searching matches only authored text.
 *  - **Slugs.** This plugin runs *after* `rehype-slug`, so heading ids derive
 *    from the text alone and stay stable across renumbering.
 *  - **Export.** Nothing is written back, so stored Markdown stays semantic.
 *
 * Labels arrive from the numbering engine and are consumed in document order,
 * covering headings and top-level ordered-list items alike. The scanner and this
 * walker agree on what counts: headings at any level, and `ol` elements that are
 * direct children of the root (the column-0 rule).
 */
const HEADING_TAGS = new Set(['h2', 'h3', 'h4', 'h5', 'h6']);

export function rehypeHeadingNumbers(labels: Array<string | null>) {
  return function attach() {
    return (tree: Root) => {
      if (labels.length === 0) return;

      let index = 0;
      const take = () => (index < labels.length ? labels[index++] : null);

      for (const node of tree.children) {
        if (node.type !== 'element') continue;

        if (HEADING_TAGS.has(node.tagName)) {
          decorate(node, take(), 'wf-doc__num');
          continue;
        }

        if (node.tagName === 'ol') {
          numberClauses(node, take);
          continue;
        }

        // Containers introduced by raw HTML may still hold headings.
        eachHeading(node, (heading) => decorate(heading, take(), 'wf-doc__num'));
      }
    };
  };
}

/** Marks the list as clauses and numbers each item, including nested lists. */
function numberClauses(list: Element, take: () => string | null): void {
  addClass(list, 'wf-clauses');

  for (const child of list.children) {
    if (child.type !== 'element' || child.tagName !== 'li') continue;

    const label = take();

    // A loose list item wraps its text in a paragraph; put the number inside so
    // it sits inline with the first line rather than on its own row.
    const paragraph = child.children.find(
      (node): node is Element => node.type === 'element' && node.tagName === 'p',
    );
    decorate(paragraph ?? child, label, 'wf-doc__clause-num');

    // Sub-clauses. Visited after their parent, matching the scanner's order.
    for (const nested of child.children) {
      if (nested.type === 'element' && nested.tagName === 'ol') {
        numberClauses(nested, take);
      }
    }
  }
}

function decorate(
  element: Element,
  label: string | null,
  className: string,
): void {
  if (!label) return;
  element.children.unshift(numberSpan(label, className));
}

function numberSpan(label: string, className: string): ElementContent {
  return {
    type: 'element',
    tagName: 'span',
    properties: {
      className: [className],
      'data-wf-ignore': true,
      'aria-hidden': 'true',
    },
    children: [{ type: 'text', value: label }],
  } satisfies Element;
}

function addClass(element: Element, className: string): void {
  const existing = element.properties?.className;
  const classes = Array.isArray(existing) ? existing : existing ? [existing] : [];
  element.properties = { ...element.properties, className: [...classes, className] };
}

/** Depth-first search for headings inside a container, in document order. */
function eachHeading(node: Element, visit: (heading: Element) => void): void {
  for (const child of node.children as Array<RootContent | ElementContent>) {
    if (child.type !== 'element') continue;
    if (HEADING_TAGS.has(child.tagName)) visit(child);
    else eachHeading(child, visit);
  }
}
