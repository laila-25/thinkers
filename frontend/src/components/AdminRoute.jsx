import { Navigate, Outlet } from 'react-router';
import useAuth from '../context/useAuth';
import dashboardPath from '../utils/dashboardPath';

export default function AdminRoute() {
  const { user } = useAuth();
  const isAdmin = user?.roles?.some(role => role.name === 'admin');
  return isAdmin ? <Outlet/> : <Navigate to={dashboardPath(user)} replace/>;
}
