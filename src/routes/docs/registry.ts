/**
 * Living-document registry.
 *
 * Mirrors the existing training registry pattern: one declarative array drives
 * routing, navigation and the catalog card. To publish another living document,
 * drop the Markdown file in `/docs` and add an entry here — no other change is
 * required anywhere in the application.
 */
export interface LivingDocumentDefinition {
  /** URL segment, e.g. /docs/training-plan */
  slug: string;
  /** Absolute path of the Markdown source, relative to the repository root. */
  path: string;
  /** Fallback title if the file has no front matter and no H1. */
  title: string;
  /** Short description for the catalog entry. */
  summary: string;
  /** Conceptual tags, rendered as chips. */
  tags: string[];
  /**
   * Firestore partition key for comments. Kept separate from `slug` so a
   * document can be renamed in the URL without detaching its comment history.
   */
  commentNamespace: string;
}

export const LIVING_DOCUMENTS: LivingDocumentDefinition[] = [
  {
    slug: 'training-plan',
    path: '/docs/training_plan.md',
    title: 'Waveform Development Flight Training Plan',
    summary:
      'Qualification path, phase progression, curriculum, and completion evidence for Flight members. Maintained as a living document.',
    tags: ['Living Document', 'Qualification', 'Flight Training'],
    commentNamespace: 'training-plan',
  },
];

export function getAllLivingDocuments(): LivingDocumentDefinition[] {
  return LIVING_DOCUMENTS;
}

export function getLivingDocumentBySlug(
  slug: string | undefined,
): LivingDocumentDefinition | undefined {
  return LIVING_DOCUMENTS.find((document) => document.slug === slug);
}
