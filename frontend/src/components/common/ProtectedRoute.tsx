import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

/**
 * ProtectedRoute — wraps any route that requires authentication.
 * Renders child routes only when the user is logged in;
 * otherwise redirects to /login, preserving the intended destination.
 */
export default function ProtectedRoute() {
  const { user, isLoading } = useAuth();

  // AuthContext is still rehydrating from localStorage — render nothing yet.
  if (isLoading) return null;

  return user ? <Outlet /> : <Navigate to="/login" replace />;
}
