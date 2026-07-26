import { Search } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { EmptyState, ErrorState, PageSkeleton, StatusBadge } from './AdminUI';
import { getOrders } from './adminApi';
import { PageHeading } from './AdminUsersPage';

export default function AdminOrdersPage() {
  const { t, i18n } = useTranslation('admin');
  const [filters, setFilters] = useState({ status: '', page: 1 });
  const [state, setState] = useState({ loading: true, rows: [], meta: null, error: false });
  const load = useCallback(signal => {
    setState(current => ({ ...current, loading: true }));
    getOrders(filters, signal).then(result => setState({ loading: false, rows: result.data || [], meta: result.meta, error: false })).catch(error => { if (error.code !== 'ERR_CANCELED') setState({ loading: false, rows: [], meta: null, error: true }); });
  }, [filters]);
  useEffect(() => { const controller = new AbortController(); load(controller.signal); return () => controller.abort(); }, [load]);
  if (state.loading && !state.rows.length) return <PageSkeleton/>;
  if (state.error) return <ErrorState retry={() => load()}/>;
  return <div className="space-y-6"><PageHeading title={t('orders.title')} description={t('orders.description')}/><div className="flex justify-end rounded-2xl border border-slate-200 bg-white/90 p-4 dark:border-slate-700 dark:bg-slate-900/85"><label className="relative w-full max-w-xs"><Search className="absolute left-3 top-3 h-4 w-4 text-slate-400"/><select aria-label={t('orders.filter')} className="field pl-10 dark:border-slate-700 dark:bg-slate-800 dark:text-white" value={filters.status} onChange={event => setFilters({ status: event.target.value, page: 1 })}><option value="">{t('orders.all')}</option>{['pending','paid','failed','refunded'].map(status => <option key={status} value={status}>{t(`status.${status}`)}</option>)}</select></label></div>{state.rows.length ? <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white/90 dark:border-slate-700 dark:bg-slate-900/85"><div className="overflow-x-auto"><table className="min-w-[850px] text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-500 dark:bg-slate-800"><tr><th className="px-5 py-4 text-start">{t('orders.order')}</th><th className="text-start">{t('orders.customer')}</th><th className="text-start">{t('orders.course')}</th><th className="text-start">{t('orders.amount')}</th><th className="text-start">{t('orders.status')}</th><th className="text-start">{t('orders.date')}</th></tr></thead><tbody>{state.rows.map(order => <tr key={order.id} className="border-t border-slate-100 dark:border-slate-800"><td className="px-5 py-4 font-black">#{order.id}</td><td><strong>{order.user?.name}</strong><p className="text-xs text-slate-500">{order.user?.email}</p></td><td>{order.course.title}</td><td className="font-bold">{order.amount} {order.currency}</td><td><StatusBadge value={order.status}/></td><td>{new Date(order.created_at).toLocaleDateString(i18n.language)}</td></tr>)}</tbody></table></div><Pagination meta={state.meta} setPage={page => setFilters(current => ({ ...current, page }))} t={t}/></div> : <EmptyState title={t('orders.empty')}/>}</div>;
}

function Pagination({ meta, setPage, t }) {
  if (!meta || meta.last_page <= 1) return null;
  return <div className="flex items-center justify-between border-t border-slate-200 px-5 py-4 dark:border-slate-700"><span className="text-sm text-slate-500">{t('pagination', { current: meta.current_page, last: meta.last_page })}</span><div className="flex gap-2"><button disabled={meta.current_page <= 1} onClick={() => setPage(meta.current_page - 1)} className="rounded-lg border px-3 py-2 disabled:opacity-40">{t('previous')}</button><button disabled={meta.current_page >= meta.last_page} onClick={() => setPage(meta.current_page + 1)} className="rounded-lg border px-3 py-2 disabled:opacity-40">{t('next')}</button></div></div>;
}
