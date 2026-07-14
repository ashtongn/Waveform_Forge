import { Suspense } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import LoadingScreen from '../../../components/LoadingScreen';
import TrainingLayout from './TrainingLayout';
import { getTrainingBySlug } from './registry';

/**
 * Detail router for `/training/:slug`. Resolves the slug against the registry,
 * renders the matching training component inside the shared `TrainingLayout`,
 * and redirects unknown slugs back to the catalog.
 */
export default function TrainingDetail() {
  const { slug } = useParams<{ slug: string }>();
  const training = slug ? getTrainingBySlug(slug) : undefined;

  if (!training || !training.component) {
    return <Navigate to="/training" replace />;
  }

  const TrainingComponent = training.component;

  return (
    <TrainingLayout title={training.title}>
      <Suspense fallback={<LoadingScreen />}>
        <TrainingComponent />
      </Suspense>
    </TrainingLayout>
  );
}
