import { Navigate, Outlet, useLocation } from 'react-router';
import useAuth from '../context/useAuth';

export default function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <div className="min-h-[50vh] flex items-center justify-center text-slate-500">Loading...</div>;
  }

  return isAuthenticated
    ? <Outlet />
    : <Navigate to="/login" replace state={{ from: location }} />;
}
