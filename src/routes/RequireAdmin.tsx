import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';
import LoadingScreen from '../components/LoadingScreen';

// Gate for admin-only routes. Admin authority in the UI is the profile `role`
// (which only the hard-coded admin UID can set, per the Firestore rules).
// Signed-out users go to /login; signed-in non-admins are sent to /404 so the
// existence of admin routes is not advertised.
export default function RequireAdmin() {
  const { user, profile, loading } = useAuth();
  const location = useLocation();

  if (loading) return <LoadingScreen />;

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (profile?.role !== 'admin') {
    return <Navigate to="/404" replace />;
  }

  return <Outlet />;
}
