import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';
import LoadingScreen from '../components/LoadingScreen';
import AccountStatus from '../routes/auth/AccountStatus';

// Gate for member-only routes. Signed-out users are sent to /login (remembering
// where they were headed). Signed-in but unapproved users see the account
// status screen instead of the protected content.
export default function RequireApproved() {
  const { user, profile, loading } = useAuth();
  const location = useLocation();

  if (loading) return <LoadingScreen />;

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (profile?.status !== 'approved') {
    return <AccountStatus />;
  }

  return <Outlet />;
}
