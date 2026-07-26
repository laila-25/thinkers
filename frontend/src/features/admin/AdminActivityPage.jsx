import { Activity, RefreshCw } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { EmptyState, ErrorState, PageSkeleton } from './AdminUI';
import { getActivity } from './adminApi';
import { PageHeading } from './AdminUsersPage';

export default function AdminActivityPage() {
  const { t, i18n } = useTranslation('admin');
  const [page, setPage] = useState(1);
  const [state, setState] = useState({ loading: true, rows: [], meta: null, error: false });
  const load = useCallback(signal => getActivity({ page }, signal).then(result => setState({ loading: false, rows: result.data || [], meta: result.meta, error: false })).catch(error => { if (error.code !== 'ERR_CANCELED') setState({ loading: false, rows: [], meta: null, error: true }); }), [page]);
  useEffect(() => { const controller = new AbortController(); load(controller.signal); return () => controller.abort(); }, [load]);
  if (state.loading && !state.rows.length) return <PageSkeleton/>;
  if (state.error) return <ErrorState retry={() => load()}/>;
  return <div className="space-y-6"><PageHeading title={t('activity.title')} description={t('activity.description')} action={<button onClick={() => load()} className="rounded-xl border border-slate-300 p-3 dark:border-slate-700" aria-label={t('activity.refresh')}><RefreshCw className="h-4 w-4"/></button>}/>{state.rows.length ? <ol className="relative space-y-4 before:absolute before:bottom-6 before:left-5 before:top-6 before:w-px before:bg-slate-200 dark:before:bg-slate-700">{state.rows.map(log => <li key={log.id} className="relative flex gap-4 rounded-2xl border border-slate-200 bg-white/90 p-5 dark:border-slate-700 dark:bg-slate-900/85"><span className="relative z-10 grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-400/15 dark:text-amber-300"><Activity className="h-5 w-5"/></span><div><p className="font-bold text-slate-900 dark:text-white">{t(`actions.${log.action}`, { defaultValue: log.action })}</p><p className="mt-1 text-sm text-slate-500">{log.actor?.name || t('activity.system')} · {log.subject_type} #{log.subject_id}</p><time className="mt-2 block text-xs text-slate-400">{new Date(log.created_at).toLocaleString(i18n.language)}</time></div></li>)}</ol> : <EmptyState title={t('activity.empty')}/>} {state.meta?.last_page > 1 && <div className="flex justify-end gap-2"><button disabled={page <= 1} onClick={() => setPage(value => value - 1)} className="rounded-lg border px-4 py-2 disabled:opacity-40">{t('previous')}</button><button disabled={page >= state.meta.last_page} onClick={() => setPage(value => value + 1)} className="rounded-lg border px-4 py-2 disabled:opacity-40">{t('next')}</button></div>}</div>;
}
