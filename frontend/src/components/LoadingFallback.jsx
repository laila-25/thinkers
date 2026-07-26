import { useTranslation } from 'react-i18next';

export default function LoadingFallback() {
  const { t } = useTranslation();
  return <div className="section-shell min-h-[55vh] animate-pulse py-28" role="status" aria-live="polite"><span className="sr-only">{t('actions.loading')}</span><div className="h-8 w-48 rounded-lg bg-slate-200 dark:bg-slate-700"/><div className="mt-5 h-4 max-w-2xl rounded bg-slate-100 dark:bg-slate-800"/><div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{[1,2,3].map(item => <div key={item} className="h-64 rounded-3xl bg-slate-100 dark:bg-slate-800"/>)}</div></div>;
}
