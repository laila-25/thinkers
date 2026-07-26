import { CircleDollarSign, HandCoins, ReceiptText, WalletCards } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { TrendChart } from './AdminCharts';
import { ErrorState, PageSkeleton } from './AdminUI';
import { getRevenue } from './adminApi';
import { PageHeading } from './AdminUsersPage';

export default function AdminRevenuePage() {
  const { t } = useTranslation('admin');
  const [state, setState] = useState({ loading: true, data: null, error: false });
  const load = useCallback(() => getRevenue().then(data => setState({ loading: false, data, error: false })).catch(() => setState({ loading: false, data: null, error: true })), []);
  useEffect(() => { load(); }, [load]);
  if (state.loading) return <PageSkeleton cards={4}/>;
  if (state.error) return <ErrorState retry={load}/>;
  const data = state.data;
  const currency = 'USD';
  const cards = [
    [t('revenue.totalSales'), data.total_sales, ReceiptText],
    [t('revenue.gross'), `${data.gross_revenue} ${currency}`, CircleDollarSign],
    [t('revenue.platform'), `${data.platform_revenue} ${currency}`, WalletCards],
    [t('revenue.instructors'), `${data.instructor_earnings} ${currency}`, HandCoins],
  ];
  const chart = data.monthly_revenue.map(item => ({ label: item.period, value: Number(item.gross_revenue) }));
  return <div className="space-y-7"><PageHeading title={t('revenue.title')} description={t('revenue.description')}/><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{cards.map(([label, value, Icon]) => <article key={label} className="rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900/85"><Icon className="h-6 w-6 text-amber-600"/><p className="mt-5 text-sm font-semibold text-slate-500">{label}</p><strong className="mt-1 block text-2xl text-slate-950 dark:text-white">{value}</strong></article>)}</div><section className="rounded-2xl border border-slate-200 bg-white/90 p-6 dark:border-slate-700 dark:bg-slate-900/85"><h2 className="text-xl font-black">{t('revenue.monthly')}</h2>{chart.length ? <div className="mt-6"><TrendChart data={chart}/></div> : <p className="mt-6 rounded-xl bg-slate-50 p-8 text-center text-slate-500 dark:bg-slate-800">{t('revenue.empty')}</p>}</section></div>;
}
