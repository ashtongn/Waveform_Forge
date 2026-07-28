import { memo } from 'react';
import MarkdownRenderer from './MarkdownRenderer';
import SectionEditor from './SectionEditor';
import { formatTimestamp } from '../comments/helpers';
import type { DocumentSection } from '../source/types';

interface DocumentBodyProps {
  sections: DocumentSection[];
  /** True when an approved member may revise this document. */
  canEdit: boolean;
  /** Id of the section currently open in the editor, if any. */
  editingSectionId: string | null;
  onStartEditing(sectionId: string): void;
  onCancelEditing(): void;
  onSaveSection(sectionId: string, content: string): Promise<void>;
}

/**
 * DocumentBody — renders the document one section at a time.
 *
 * Splitting the render has three benefits beyond editing:
 *  - each section memoizes independently, so revising one heading does not
 *    re-render several hundred pages;
 *  - the edit affordance can sit exactly where the reader is looking;
 *  - a save replaces only that section's DOM.
 *
 * The `.wf-doc` typography wrapper stays on the outer element so the background
 * grid and heading rhythm remain continuous across sections.
 */
export default function DocumentBody({
  sections,
  canEdit,
  editingSectionId,
  onStartEditing,
  onCancelEditing,
  onSaveSection,
}: DocumentBodyProps) {
  return (
    <div className="wf-doc">
      {sections.map((section) => (
        <DocumentSectionBlock
          key={section.id}
          section={section}
          canEdit={canEdit}
          editing={editingSectionId === section.id}
          onStartEditing={onStartEditing}
          onCancelEditing={onCancelEditing}
          onSaveSection={onSaveSection}
        />
      ))}
    </div>
  );
}

interface SectionBlockProps {
  section: DocumentSection;
  canEdit: boolean;
  editing: boolean;
  onStartEditing(sectionId: string): void;
  onCancelEditing(): void;
  onSaveSection(sectionId: string, content: string): Promise<void>;
}

const DocumentSectionBlock = memo(function DocumentSectionBlock({
  section,
  canEdit,
  editing,
  onStartEditing,
  onCancelEditing,
  onSaveSection,
}: SectionBlockProps) {
  if (editing) {
    return (
      <section>
        <SectionEditor
          initialContent={section.content}
          onSave={(content) => onSaveSection(section.id, content)}
          onCancel={onCancelEditing}
        />
      </section>
    );
  }

  return (
    <section className="group relative">
      {canEdit && (
        <div
          data-wf-ignore
          className="pointer-events-none absolute right-0 top-2 z-10 flex items-center gap-2 opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100"
        >
          {section.updatedAt && (
            <span className="font-mono text-[0.55rem] uppercase tracking-[0.1em] text-forge-muted/70">
              {section.updatedByName ?? 'Unknown'} · {formatTimestamp(section.updatedAt)}
            </span>
          )}
          <button
            type="button"
            onClick={() => onStartEditing(section.id)}
            className="pointer-events-auto border border-forge-border bg-forge-panel px-2 py-1 font-mono text-[0.6rem] uppercase tracking-[0.12em] text-forge-muted transition-colors hover:border-forge-accent/60 hover:text-forge-accent"
          >
            Edit
          </button>
        </div>
      )}

      <MarkdownRenderer content={section.content} />
    </section>
  );
});
