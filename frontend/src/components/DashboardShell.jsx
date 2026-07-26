import AIMotivationCard from '../features/ai/AIMotivationCard';
import { useTranslation } from 'react-i18next';

export default function DashboardShell({ user, children }) {
  const { t } = useTranslation('dashboard');
  return (
    <section className="page-section min-h-screen bg-transparent">
      <div className="section-shell">
        <div className="panel bg-white/88 p-6 shadow-[0_32px_90px_-48px_rgba(15,23,42,.48)] backdrop-blur-xl dark:bg-slate-900/85 sm:p-8 lg:p-10">{children}</div>
        <div className="mt-6"><AIMotivationCard compact /></div>
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <section id="profile" className="soft-card bg-white/82 p-6 backdrop-blur-xl dark:bg-slate-900/80">
            <h2 className="text-xl font-bold text-slate-950">{t('profile')}</h2>
            <dl className="mt-5 space-y-3 text-sm">
              <div><dt className="text-slate-500">{t('name')}</dt><dd className="font-semibold text-slate-900">{user.name}</dd></div>
              <div><dt className="text-slate-500">{t('email')}</dt><dd className="font-semibold text-slate-900">{user.email}</dd></div>
            </dl>
          </section>
          <section id="notifications" className="soft-card bg-white/82 p-6 backdrop-blur-xl dark:bg-slate-900/80">
            <h2 className="text-xl font-bold text-slate-950">{t('notifications')}</h2>
            <p className="mt-5 rounded-2xl bg-slate-50 p-5 text-sm text-slate-500">{t('noNotifications')}</p>
          </section>
        </div>
      </div>
    </section>
  );
}
