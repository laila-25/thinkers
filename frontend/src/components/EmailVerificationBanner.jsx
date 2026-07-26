import { useState } from 'react';
import { MailCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import useAuth from '../context/useAuth';

export default function EmailVerificationBanner() {
  const { t } = useTranslation('verification');
  const { user, resendVerification } = useAuth();
  const [status, setStatus] = useState('idle');

  if (!user || user.email_verified_at) return null;

  const resend = async () => {
    setStatus('sending');
    try {
      await resendVerification();
      setStatus('sent');
    } catch {
      setStatus('error');
    }
  };

  return <div className="mx-auto max-w-7xl px-4 pt-4 sm:px-6 lg:px-8" role="status">
    <div className="flex flex-col items-start justify-between gap-3 rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-amber-950 shadow-sm sm:flex-row sm:items-center">
      <div className="flex items-start gap-3">
        <MailCheck className="mt-0.5 h-5 w-5 shrink-0"/>
        <div><p className="font-bold">{t('title')}</p><p className="text-sm text-amber-800">{t('description', { email: user.email })}</p></div>
      </div>
      <button type="button" onClick={resend} disabled={status === 'sending' || status === 'sent'} className="shrink-0 rounded-xl border border-amber-400 bg-white px-4 py-2 text-sm font-bold transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-70">
        {t(status === 'sending' ? 'sending' : status === 'sent' ? 'sent' : status === 'error' ? 'retry' : 'resend')}
      </button>
    </div>
  </div>;
}
