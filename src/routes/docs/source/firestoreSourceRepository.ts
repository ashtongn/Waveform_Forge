import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
  updateDoc,
  writeBatch,
  type DocumentData,
} from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { headingOf } from './sections';
import type { DocumentSection, DocumentSourceRepository } from './types';

/**
 * Firestore-backed document source.
 *
 * Layout: `docSources/{documentId}/sections/{sectionId}`.
 *
 * There is deliberately no parent metadata document — "last updated" and "last
 * editor" are derived from the sections themselves, which removes a write, a
 * read, and a class of drift between the two.
 */
const ROOT = 'docSources';
const SECTIONS = 'sections';

/** Ample for a long chapter, and far below Firestore's 1 MiB document limit. */
export const MAX_SECTION_BYTES = 200_000;

function sectionsRef(documentId: string) {
  return collection(db, ROOT, documentId, SECTIONS);
}

export const firestoreDocumentSourceRepository: DocumentSourceRepository = {
  subscribe(documentId, onData, onError) {
    const q = query(sectionsRef(documentId), orderBy('order'));

    return onSnapshot(
      q,
      (snapshot) => {
        if (snapshot.empty) {
          // Not imported yet — the page falls back to the repository copy.
          onData(null);
          return;
        }
        onData(snapshot.docs.map((snap) => fromFirestore(snap.id, snap.data())));
      },
      (error) => onError(error),
    );
  },

  async seed(documentId, sections, author) {
    const batch = writeBatch(db);

    sections.forEach((section, index) => {
      batch.set(doc(sectionsRef(documentId)), {
        order: index,
        heading: section.heading,
        content: section.content,
        updatedAt: serverTimestamp(),
        updatedByUid: author.uid,
        updatedByName: author.name,
      });
    });

    await batch.commit();
  },

  updateSection(documentId, sectionId, content, author) {
    return updateDoc(doc(db, ROOT, documentId, SECTIONS, sectionId), {
      content,
      heading: headingOf(content),
      updatedAt: serverTimestamp(),
      updatedByUid: author.uid,
      updatedByName: author.name,
    });
  },
};

function fromFirestore(id: string, data: DocumentData): DocumentSection {
  return {
    id,
    order: typeof data.order === 'number' ? data.order : 0,
    heading: data.heading ?? null,
    content: data.content ?? '',
    updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toMillis() : null,
    updatedByName: data.updatedByName ?? null,
  };
}
