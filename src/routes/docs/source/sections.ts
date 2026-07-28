/**
 * Section splitting.
 *
 * The document is divided at top-level `##` headings. Everything before the
 * first one (the H1 and its preamble) becomes section 0.
 *
 * Sections are the unit of editing and of storage:
 *  - a member edits one section at a time, so payloads stay small and two
 *    people working on different parts of the manual never collide;
 *  - each section is its own Firestore document, so a save touches one small
 *    record instead of rewriting several hundred pages.
 *
 * Fenced code blocks are tracked so a `##` comment inside a code sample cannot
 * accidentally split the document.
 */

export interface ParsedSection {
  /** Heading text without the `##`, or null for the preamble. */
  heading: string | null;
  /** Raw Markdown, including the heading line itself. */
  content: string;
}

const HEADING_PATTERN = /^##\s+(.*)$/;
const FENCE_PATTERN = /^\s*(```|~~~)/;

export function splitSections(markdown: string): ParsedSection[] {
  const sections: ParsedSection[] = [];
  let buffer: string[] = [];
  let heading: string | null = null;
  let inFence = false;

  const flush = () => {
    const content = buffer.join('\n').trim();
    if (content) sections.push({ heading, content });
  };

  for (const line of markdown.split(/\r?\n/)) {
    if (FENCE_PATTERN.test(line)) inFence = !inFence;

    const match = !inFence ? HEADING_PATTERN.exec(line) : null;
    if (match) {
      flush();
      buffer = [line];
      heading = match[1].trim();
      continue;
    }

    buffer.push(line);
  }

  flush();
  return sections;
}

/** Reassembles sections into a single Markdown document. */
export function joinSections(contents: string[]): string {
  return contents.map((content) => content.trim()).join('\n\n');
}

/** Derives the display heading for a section from its Markdown. */
export function headingOf(content: string): string | null {
  for (const line of content.split(/\r?\n/)) {
    const match = HEADING_PATTERN.exec(line);
    if (match) return match[1].trim();
  }
  return null;
}
