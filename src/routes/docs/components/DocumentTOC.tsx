import { useMemo, useState } from 'react';
import type { OutlineHeading } from '../hooks/useDocumentOutline';

interface DocumentTOCProps {
  headings: OutlineHeading[];
  activeId: string | null;
  onNavigate(id: string): void;
}

interface OutlineSection {
  heading: OutlineHeading;
  children: OutlineHeading[];
}

/**
 * DocumentTOC — collapsible outline of the document.
 *
 * Top-level (`##`) sections are always listed; their sub-headings collapse so a
 * several-hundred-page manual still produces a navigable sidebar. The section
 * containing the active heading auto-expands.
 *
 * Numbers come from the same generated labels rendered in the document — they
 * are never parsed out of the heading text — so the two always agree.
 */
export default function DocumentTOC({
  headings,
  activeId,
  onNavigate,
}: DocumentTOCProps) {
  const sections = useMemo(() => groupHeadings(headings), [headings]);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const activeSectionId = useMemo(() => {
    const owner = sections.find(
      (section) =>
        section.heading.id === activeId ||
        section.children.some((child) => child.id === activeId),
    );
    return owner?.heading.id ?? null;
  }, [sections, activeId]);

  if (headings.length === 0) return null;

  return (
    <nav aria-label="Table of contents" className="flex flex-col gap-1">
      <p className="px-2 pb-2 font-mono text-[0.62rem] uppercase tracking-[0.16em] text-forge-muted">
        Contents
      </p>

      {sections.map((section) => {
        const isActiveSection = section.heading.id === activeSectionId;
        const isOpen = collapsed[section.heading.id] ?? isActiveSection;

        return (
          <div key={section.heading.id}>
            <div className="flex items-stretch">
              <button
                type="button"
                onClick={() => onNavigate(section.heading.id)}
                className={[
                  'flex-1 truncate border-l-2 px-2 py-1.5 text-left text-[0.8rem] transition-colors',
                  section.heading.id === activeId
                    ? 'border-forge-accent text-forge-accent'
                    : 'border-transparent text-forge-muted hover:text-forge-text',
                ].join(' ')}
                title={section.heading.text}
              >
                {section.heading.number && (
                  <span className="mr-1.5 font-mono text-[0.72rem] text-forge-muted/70">
                    {section.heading.number}
                  </span>
                )}
                {section.heading.text}
              </button>

              {section.children.length > 0 && (
                <button
                  type="button"
                  aria-expanded={isOpen}
                  aria-label={`${isOpen ? 'Collapse' : 'Expand'} ${section.heading.text}`}
                  onClick={() =>
                    setCollapsed((current) => ({
                      ...current,
                      [section.heading.id]: !isOpen,
                    }))
                  }
                  className="px-2 text-forge-muted transition-colors hover:text-forge-accent"
                >
                  <span
                    aria-hidden="true"
                    className={`inline-block text-[0.6rem] transition-transform ${
                      isOpen ? 'rotate-90' : ''
                    }`}
                  >
                    ▶
                  </span>
                </button>
              )}
            </div>

            {isOpen &&
              section.children.map((child) => (
                <button
                  key={child.id}
                  type="button"
                  onClick={() => onNavigate(child.id)}
                  className={[
                    'block w-full truncate border-l-2 py-1 pr-2 text-left text-[0.75rem] transition-colors',
                    child.depth >= 4 ? 'pl-8' : 'pl-5',
                    child.id === activeId
                      ? 'border-forge-accent text-forge-accent'
                      : 'border-transparent text-forge-muted/75 hover:text-forge-text',
                  ].join(' ')}
                  title={child.text}
                >
                  {child.number && (
                    <span className="mr-1.5 font-mono text-[0.68rem] text-forge-muted/60">
                      {child.number}
                    </span>
                  )}
                  {child.text}
                </button>
              ))}
          </div>
        );
      })}
    </nav>
  );
}

function groupHeadings(headings: OutlineHeading[]): OutlineSection[] {
  const sections: OutlineSection[] = [];

  for (const heading of headings) {
    if (heading.depth <= 2 || sections.length === 0) {
      sections.push({ heading, children: [] });
    } else {
      sections[sections.length - 1].children.push(heading);
    }
  }

  return sections;
}
