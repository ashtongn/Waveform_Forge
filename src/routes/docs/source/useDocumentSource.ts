import { useCallback, useEffect, useMemo, useState } from 'react';
import { describeCommentError } from '../comments/helpers';
import {
  migrateManualNumbering,
  needsNumberingMigration,
} from '../numbering/migrate';
import { splitSections } from './sections';
import type { DocumentSection, DocumentSourceRepository, SectionAuthor } from './types';

export interface DocumentSourceState {
  /** Sections to render, from the live store or the repository copy. */
  sections: DocumentSection[];
  /** True once the document has been imported and is editable. */
  live: boolean;
  loading: boolean;
  error: string | null;
  /** Most recent section edit, or null while serving the repository copy. */
  lastUpdatedAt: number | null;
  lastEditor: string | null;
  /** Changes whenever the rendered text changes; used to re-index the DOM. */
  revision: string;

  /**
   * True when stored sections still carry hand-maintained heading numbers.
   * Numbers are generated at render time now, so these must be migrated away.
   */
  needsHeadingMigration: boolean;

  importFromRepository(author: SectionAuthor): Promise<void>;
  saveSection(sectionId: string, content: string, author: SectionAuthor): Promise<void>;
  /** One-time migration: removes manual numeric prefixes from headings. */
  stripHeadingNumbers(author: SectionAuthor): Promise<void>;
}

/**
 * Loads the document from the live store, falling back to the copy bundled from
 * `/docs`.
 *
 * The fallback is what makes this safe to ship: if the document has never been
 * imported, if the reader is offline, or if the rules deny the read, the page
 * still renders the repository copy as a read-only manual.
 */
export function useDocumentSource(
  documentId: string,
  repository: DocumentSourceRepository,
  fallbackMarkdown: string | null,
): DocumentSourceState {
  const [remote, setRemote] = useState<DocumentSection[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    return repository.subscribe(
      documentId,
      (sections) => {
        setRemote(sections);
        setLoading(false);
      },
      (err) => {
        // Non-fatal: the repository copy is still rendered below.
        setError(describeCommentError(err));
        setRemote(null);
        setLoading(false);
      },
    );
  }, [documentId, repository]);

  const live = Boolean(remote && remote.length > 0);

  const sections = useMemo<DocumentSection[]>(() => {
    if (remote && remote.length > 0) return remote;
    if (!fallbackMarkdown) return [];

    return splitSections(fallbackMarkdown).map((section, index) => ({
      id: `repo-${index}`,
      order: index,
      heading: section.heading,
      content: section.content,
      updatedAt: null,
      updatedByName: null,
    }));
  }, [remote, fallbackMarkdown]);

  const latest = useMemo(
    () =>
      sections.reduce<DocumentSection | null>(
        (newest, section) =>
          (section.updatedAt ?? 0) > (newest?.updatedAt ?? 0) ? section : newest,
        null,
      ),
    [sections],
  );

  // A cheap fingerprint of the rendered content. Changing it tells the page to
  // rebuild its text index and outline.
  const revision = useMemo(
    () => sections.map((section) => `${section.id}:${section.content.length}`).join('|'),
    [sections],
  );

  const importFromRepository = useCallback(
    async (author: SectionAuthor) => {
      if (!fallbackMarkdown) throw new Error('No repository copy is available.');
      try {
        await repository.seed(documentId, splitSections(fallbackMarkdown), author);
      } catch (err) {
        throw new Error(describeCommentError(err));
      }
    },
    [documentId, fallbackMarkdown, repository],
  );

  const saveSection = useCallback(
    async (sectionId: string, content: string, author: SectionAuthor) => {
      try {
        await repository.updateSection(documentId, sectionId, content, author);
      } catch (err) {
        throw new Error(describeCommentError(err));
      }
    },
    [documentId, repository],
  );

  const needsHeadingMigration = useMemo(
    () => live && sections.some((section) => needsNumberingMigration(section.content)),
    [live, sections],
  );

  const stripHeadingNumbers = useCallback(
    async (author: SectionAuthor) => {
      const updates = sections
        .map((section) => ({
          id: section.id,
          content: migrateManualNumbering(section.content).markdown,
        }))
        .filter((update, index) => update.content !== sections[index].content);

      if (updates.length === 0) return;

      try {
        await repository.updateSections(documentId, updates, author);
      } catch (err) {
        throw new Error(describeCommentError(err));
      }
    },
    [documentId, repository, sections],
  );

  // Memoized: `DocumentBody` memoizes each section on its props, so returning a
  // fresh object every render would defeat it.
  return useMemo(
    () => ({
      sections,
      live,
      loading,
      error,
      lastUpdatedAt: latest?.updatedAt ?? null,
      lastEditor: latest?.updatedByName ?? null,
      revision,
      needsHeadingMigration,
      importFromRepository,
      saveSection,
      stripHeadingNumbers,
    }),
    [
      sections,
      live,
      loading,
      error,
      latest,
      revision,
      needsHeadingMigration,
      importFromRepository,
      saveSection,
      stripHeadingNumbers,
    ],
  );
}
