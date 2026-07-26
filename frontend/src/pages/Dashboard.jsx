import useAuth from '../context/useAuth';
import { Navigate } from 'react-router';
import dashboardPath from '../utils/dashboardPath';

export default function Dashboard() {
  const { user } = useAuth();
  const roles = user.roles?.map(role => role.name) || [];
  if (!roles.includes('admin')) return <Navigate to={dashboardPath(user)} replace />;
  return <Navigate to="/admin" replace />;
}
