import { Navigate, Outlet } from 'react-router';
import useAuth from '../context/useAuth';

export default function GuestRoute() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <div className="min-h-[50vh] flex items-center justify-center text-slate-500">Loading...</div>;
  }

  return isAuthenticated ? <Navigate to="/dashboard" replace /> : <Outlet />;
}
