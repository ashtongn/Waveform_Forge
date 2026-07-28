import type { ParsedSection } from './sections';

/** A section of the live document. */
export interface DocumentSection {
  id: string;
  /** Sort key. Gaps are allowed so sections can be inserted later. */
  order: number;
  heading: string | null;
  content: string;
  /** Epoch milliseconds, or null for sections served from the repository copy. */
  updatedAt: number | null;
  updatedByName: string | null;
}

export interface SectionAuthor {
  uid: string;
  name: string;
}

export type Unsubscribe = () => void;

/**
 * DocumentSourceRepository — the seam between the document body and storage.
 *
 * Mirrors `CommentRepository`: the UI never imports Firestore, so the backing
 * store can be replaced without touching a component.
 *
 * `subscribe` reports `null` when the document has not been imported into the
 * live store yet, which is what puts the page into read-only repository mode.
 */
export interface DocumentSourceRepository {
  subscribe(
    documentId: string,
    onData: (sections: DocumentSection[] | null) => void,
    onError: (error: Error) => void,
  ): Unsubscribe;

  /** One-time import of the repository copy into the live store. */
  seed(
    documentId: string,
    sections: ParsedSection[],
    author: SectionAuthor,
  ): Promise<void>;

  updateSection(
    documentId: string,
    sectionId: string,
    content: string,
    author: SectionAuthor,
  ): Promise<void>;

  /** Atomic multi-section rewrite, used by one-time migrations. */
  updateSections(
    documentId: string,
    updates: Array<{ id: string; content: string }>,
    author: SectionAuthor,
  ): Promise<void>;
}
