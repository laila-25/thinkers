import { Navigate, Outlet } from 'react-router';
import useAuth from '../context/useAuth';
import { useTranslation } from 'react-i18next';

export default function GuestRoute() {
  const { t } = useTranslation();
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <div className="min-h-[50vh] flex items-center justify-center text-slate-500">{t('actions.loading')}</div>;
  }

  return isAuthenticated ? <Navigate to="/dashboard" replace /> : <Outlet />;
}
