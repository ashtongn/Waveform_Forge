import { lazy, type ComponentType, type LazyExoticComponent } from 'react';

/**
 * Training registry — the single source of truth for the public Training Lab.
 *
 * Every interactive training is described by one entry below. The catalog page
 * (`/training`) renders a card per entry, and the detail router
 * (`/training/:slug`) looks up the matching entry and renders its component.
 *
 * To add a new training:
 *   1. Build a self-contained module under `modules/<name>/`.
 *   2. Add a `TrainingDefinition` entry here pointing at its `*Module` export.
 * No routing changes are required.
 *
 * All trainings are public, education-only, and intentionally non-operational.
 */

export type TrainingStatus = 'available' | 'coming_soon';

export type TrainingDifficulty = 'Beginner' | 'Intermediate' | 'Advanced';

export interface TrainingDefinition {
  /** Unique, URL-safe identifier used in `/training/:slug`. */
  slug: string;
  /** Display title shown on the card and detail breadcrumb. */
  title: string;
  /** Short tagline for the catalog card. */
  summary: string;
  /** Conceptual tags used for quick scanning on the card. */
  tags: string[];
  /** Difficulty hint for learners. */
  difficulty: TrainingDifficulty;
  /** Availability — `coming_soon` renders a non-clickable teaser card. */
  status: TrainingStatus;
  /** Lazily-loaded training component (only for `available` trainings). */
  component?: LazyExoticComponent<ComponentType>;
}

export const TRAININGS: TrainingDefinition[] = [
  {
    slug: 'jamming',
    title: 'Jamming Visualization',
    summary:
      'Compare conceptual jamming categories from an abstract frequency-domain view.',
    tags: ['Spectrum', 'Jamming', 'Frequency Domain'],
    difficulty: 'Beginner',
    status: 'available',
    component: lazy(() => import('./modules/jamming/JammingModule')),
  },
  {
    slug: 'bits',
    title: 'Signal Bits Lab',
    summary:
      'Follow a digital frame from raw bits to useful information, field by field.',
    tags: ['Protocol', 'Digital', 'Receiver'],
    difficulty: 'Beginner',
    status: 'available',
    component: lazy(() => import('./modules/bits/BitsModule')),
  },
];

/** All trainings that should be shown on the catalog (available first). */
export function getAllTrainings(): TrainingDefinition[] {
  return TRAININGS;
}

/** Look up a routable training by slug (must be `available`). */
export function getTrainingBySlug(slug: string): TrainingDefinition | undefined {
  return TRAININGS.find(
    (training) => training.slug === slug && training.status === 'available',
  );
}
