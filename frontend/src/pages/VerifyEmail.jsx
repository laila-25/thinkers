import { useEffect, useRef, useState } from 'react';
import { CheckCircle2, LoaderCircle, MailWarning, XCircle } from 'lucide-react';
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import useAuth from '../context/useAuth';
import dashboardPath from '../utils/dashboardPath';
import PageBackground from '../components/PageBackground';

export default function VerifyEmail() {
  const { t } = useTranslation('verification');
  const { user, isLoading, verifyEmail } = useAuth();
  const [status, setStatus] = useState('checking');
  const started = useRef(false);

  useEffect(() => {
    if (isLoading || started.current) return;
    if (!user) { setStatus('login'); return; }

    const verification = new URLSearchParams(window.location.search).get('verification');
    if (!verification?.startsWith('/api/email/verify/')) { setStatus('invalid'); return; }

    started.current = true;
    verifyEmail(verification).then(() => setStatus('success')).catch(error => {
      setStatus(error.response?.status === 401 ? 'login' : 'invalid');
    });
  }, [isLoading, user, verifyEmail]);

  const icon = status === 'success' ? <CheckCircle2 className="h-14 w-14 text-emerald-500"/> : status === 'checking' ? <LoaderCircle className="h-14 w-14 animate-spin text-amber-500"/> : status === 'login' ? <MailWarning className="h-14 w-14 text-amber-500"/> : <XCircle className="h-14 w-14 text-red-500"/>;

  return <PageBackground variant="auth" className="min-h-[70vh]"><div className="flex min-h-[70vh] items-center justify-center px-4 py-16">
    <div className="panel w-full max-w-lg p-8 text-center">
      <div className="mb-5 flex justify-center">{icon}</div>
      <h1 className="text-2xl font-extrabold text-slate-950">{t(`${status}Title`)}</h1>
      <p className="mt-3 text-slate-600">{t(`${status}Description`)}</p>
      {status === 'success' && <Link to={dashboardPath(user)} className="action mt-6 inline-flex">{t('dashboard')}</Link>}
      {status === 'login' && <Link to="/login" className="action mt-6 inline-flex">{t('signIn')}</Link>}
    </div>
  </div></PageBackground>;
}
