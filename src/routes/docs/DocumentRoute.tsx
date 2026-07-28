import { Navigate, useParams } from 'react-router-dom';
import LivingDocumentPage from './LivingDocumentPage';
import CommentProvider from './comments/CommentProvider';
import PermissionProvider from './comments/PermissionProvider';
import { firestoreCommentRepository } from './comments/firestoreRepository';
import { getLivingDocumentBySlug } from './registry';

/**
 * Route entry point for `/docs/:docSlug`.
 *
 * Composition order matters: `PermissionProvider` must wrap `CommentProvider`,
 * because the comment layer authorizes every write through the permission
 * service before it reaches the repository.
 *
 * The repository is injected here — the single place that needs to change to
 * move comments off Firestore.
 */
export default function DocumentRoute() {
  const { docSlug } = useParams();
  const definition = getLivingDocumentBySlug(docSlug);

  if (!definition) return <Navigate to="/404" replace />;

  return (
    <PermissionProvider>
      <CommentProvider
        key={definition.commentNamespace}
        documentId={definition.commentNamespace}
        repository={firestoreCommentRepository}
      >
        <LivingDocumentPage definition={definition} />
      </CommentProvider>
    </PermissionProvider>
  );
}
