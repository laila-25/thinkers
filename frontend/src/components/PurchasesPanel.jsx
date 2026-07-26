import { BookOpen, CheckCircle2, Clock3, CreditCard, RotateCcw, XCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { getOrders } from '../api/orders';

const statusStyles = {
  pending: 'bg-amber-50 text-amber-800 dark:bg-amber-400/10 dark:text-amber-300',
  paid: 'bg-emerald-50 text-emerald-800 dark:bg-emerald-400/10 dark:text-emerald-300',
  failed: 'bg-red-50 text-red-700 dark:bg-red-400/10 dark:text-red-300',
  refunded: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200',
};

const statusIcons = { pending: Clock3, paid: CheckCircle2, failed: XCircle, refunded: RotateCcw };

export default function PurchasesPanel({ enrollments = [] }) {
  const { t, i18n } = useTranslation('checkout');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    getOrders(controller.signal)
      .then(response => setOrders(response.data.data || []))
      .catch(requestError => { if (!controller.signal.aborted) setError(requestError.response?.data?.message || t('errors.orders')); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [t]);

  if (loading) return <section className="mt-10 animate-pulse"><div className="h-7 w-40 rounded bg-slate-200 dark:bg-slate-700"/><div className="mt-5 grid gap-5 md:grid-cols-2"><div className="h-44 rounded-3xl bg-slate-200 dark:bg-slate-800"/><div className="h-44 rounded-3xl bg-slate-200 dark:bg-slate-800"/></div></section>;

  return <section className="mt-10" aria-labelledby="purchases-title">
    <p className="section-kicker">{t('purchases.eyebrow')}</p><h2 id="purchases-title" className="mt-1 text-2xl font-bold dark:text-white">{t('purchases.title')}</h2>
    {error && <p className="mt-4 rounded-2xl bg-red-50 p-4 text-red-700" role="alert">{error}</p>}
    {!error && !orders.length ? <div className="mt-5 rounded-3xl border border-dashed border-slate-300 bg-white/80 p-9 text-center backdrop-blur dark:border-slate-700 dark:bg-slate-900/75"><CreditCard className="mx-auto h-9 w-9 text-slate-300"/><h3 className="mt-3 font-bold dark:text-white">{t('purchases.empty')}</h3><Link to="/courses?type=paid" className="mt-3 inline-block text-sm font-bold text-amber-700">{t('purchases.explore')}</Link></div> : <div className="mt-5 grid gap-5 md:grid-cols-2">{orders.map(order => {
      const Icon = statusIcons[order.status] || Clock3;
      const enrollment = enrollments.find(item => Number(item.course.id) === Number(order.course.id) && item.status !== 'cancelled');
      const enrollmentId = order.enrollment_id || enrollment?.id;
      const price = new Intl.NumberFormat(i18n.language === 'ar' ? 'ar-JO' : 'en-US', { style: 'currency', currency: order.currency || 'USD' }).format(Number(order.amount));
      return <article key={order.id} className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm backdrop-blur dark:border-slate-700 dark:bg-slate-900/85"><div className="flex items-start justify-between gap-3"><span className="grid h-11 w-11 place-items-center rounded-2xl bg-amber-100 text-amber-800"><BookOpen className="h-5 w-5"/></span><span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${statusStyles[order.status] || statusStyles.pending}`}><Icon className="h-3.5 w-3.5"/>{t(`statuses.${order.status}`)}</span></div><h3 className="mt-5 text-lg font-bold dark:text-white">{order.course.title}</h3><p className="mt-2 text-sm font-semibold text-slate-600 dark:text-slate-300">{price}</p><div className="mt-5">{order.status === 'paid' ? enrollmentId ? <Link to={`/learn/${enrollmentId}`} className="action inline-flex">{t('startLearning')}</Link> : <Link to={`/checkout/${order.course.id}`} className="action inline-flex">{t('startLearning')}</Link> : order.status === 'pending' ? <span className="text-sm font-bold text-amber-700">{t('paymentPending')}</span> : <Link to={`/checkout/${order.course.id}`} className="text-sm font-bold text-amber-700">{t('purchases.tryAgain')}</Link>}</div></article>;
    })}</div>}
  </section>;
}
