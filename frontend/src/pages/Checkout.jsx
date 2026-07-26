import { ArrowLeft, BookOpen, CheckCircle2, Clock3, CreditCard, ShieldCheck } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation, useNavigate, useParams } from 'react-router';
import api from '../api/client';
import { createOrder, getCheckoutCourse, getOrders } from '../api/orders';
import Button from '../components/Button';
import PageBackground from '../components/PageBackground';

export default function Checkout() {
  const { courseId } = useParams();
  const { t, i18n } = useTranslation('checkout');
  const navigate = useNavigate();
  const location = useLocation();
  const [course, setCourse] = useState(null);
  const [orders, setOrders] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [state, setState] = useState('loading');
  const [error, setError] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    Promise.all([
      getCheckoutCourse(courseId),
      getOrders(controller.signal, courseId),
      api.get('/api/enrollments', { signal: controller.signal }),
    ]).then(([courseResponse, orderResponse, enrollmentResponse]) => {
      const loadedCourse = courseResponse.data.data;
      if (loadedCourse.type === 'free') {
        navigate(`/courses/${loadedCourse.slug}`, { replace: true });
        return;
      }
      setCourse(loadedCourse);
      setOrders(orderResponse.data.data || []);
      setEnrollments(enrollmentResponse.data.data || []);
      setState('ready');
    }).catch(requestError => {
      if (controller.signal.aborted) return;
      if (requestError.response?.status === 401) {
        navigate('/login', { replace: true, state: { from: location } });
        return;
      }
      setError(requestError.response?.data?.message || t('errors.load'));
      setState('error');
    });
    return () => controller.abort();
  }, [courseId, location, navigate, t]);

  const currentOrder = useMemo(() => orders.find(order => Number(order.course.id) === Number(courseId) && ['paid', 'pending'].includes(order.status)), [courseId, orders]);
  const previousOrder = useMemo(() => orders.find(order => Number(order.course.id) === Number(courseId)), [courseId, orders]);
  const enrollment = useMemo(() => enrollments.find(item => Number(item.course.id) === Number(courseId) && item.status !== 'cancelled'), [courseId, enrollments]);

  const create = async () => {
    setState('submitting');
    setError('');
    try {
      const response = await createOrder(courseId);
      setOrders(items => [response.data.data, ...items]);
      setState('ready');
    } catch (requestError) {
      setError(requestError.response?.data?.errors?.course_id?.[0] || requestError.response?.data?.message || t('errors.create'));
      setState('ready');
    }
  };

  const startLearning = async () => {
    const enrollmentId = currentOrder?.enrollment_id || enrollment?.id;
    if (enrollmentId) {
      navigate(`/learn/${enrollmentId}`);
      return;
    }
    setState('submitting');
    setError('');
    try {
      const response = await api.post(`/api/courses/${courseId}/enroll`);
      navigate(`/learn/${response.data.data.id}`);
    } catch (requestError) {
      setError(requestError.response?.data?.errors?.course?.[0] || requestError.response?.data?.message || t('errors.enroll'));
      setState('ready');
    }
  };

  if (state === 'loading') return <CheckoutSkeleton/>;
  if (state === 'error' || !course) return <PageBackground variant="course" className="min-h-[70vh]"><main className="section-shell py-24 text-center"><p className="text-red-700" role="alert">{error}</p><Link to="/courses" className="action mt-6 inline-flex">{t('backToCourses')}</Link></main></PageBackground>;

  const price = new Intl.NumberFormat(i18n.language === 'ar' ? 'ar-JO' : 'en-US', { style: 'currency', currency: course.currency || 'USD' }).format(Number(course.price));
  const paid = currentOrder?.status === 'paid';
  const pending = currentOrder?.status === 'pending';

  return <PageBackground variant="course" className="min-h-screen">
    <main className="section-shell py-10 sm:py-16">
      <Link to={`/courses/${course.slug}`} className="inline-flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-amber-700 dark:text-slate-300"><ArrowLeft className="h-4 w-4 rtl:rotate-180"/>{t('back')}</Link>
      <div className="mt-6 grid gap-7 lg:grid-cols-[1fr_420px]">
        <section className="overflow-hidden rounded-3xl border border-white/70 bg-white/90 shadow-[0_30px_90px_-55px_rgba(15,23,42,.7)] backdrop-blur-xl dark:border-slate-700 dark:bg-slate-900/90">
          <div className="aspect-[16/8] bg-slate-100 dark:bg-slate-800">{course.thumbnail ? <img src={course.thumbnail} alt="" width="960" height="480" decoding="async" className="h-full w-full object-cover"/> : <div className="grid h-full place-items-center bg-gradient-to-br from-amber-100 to-amber-300"><BookOpen className="h-16 w-16 text-slate-900"/></div>}</div>
          <div className="p-7 sm:p-9"><p className="section-kicker">{t('course')}</p><h1 className="mt-3 text-3xl font-bold tracking-[-0.04em] text-slate-950 dark:text-white sm:text-4xl">{course.title}</h1><p className="mt-3 text-slate-600 dark:text-slate-300">{t('instructor', { name: course.instructor?.name || 'Thinkers' })}</p><div className="mt-7 flex items-center gap-3 rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-800 dark:bg-emerald-400/10 dark:text-emerald-300"><ShieldCheck className="h-5 w-5 shrink-0"/>{t('secure')}</div></div>
        </section>

        <aside className="h-fit rounded-3xl border border-amber-200/80 bg-white/92 p-7 shadow-[0_30px_90px_-50px_rgba(120,83,20,.6)] backdrop-blur-xl dark:border-amber-400/20 dark:bg-slate-900/92 sm:p-8">
          <div className="flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-2xl bg-amber-100 text-amber-800"><CreditCard className="h-5 w-5"/></span><div><p className="text-xs font-bold uppercase tracking-[.18em] text-amber-700">{t('summary')}</p><h2 className="text-xl font-bold dark:text-white">{t('total')}</h2></div></div>
          <div className="mt-7 flex items-start justify-between gap-5 border-y border-slate-200 py-6 dark:border-slate-700"><div><p className="font-bold text-slate-950 dark:text-white">{course.title}</p><p className="mt-1 text-sm text-slate-500">{course.currency}</p></div><strong className="shrink-0 text-xl text-slate-950 dark:text-white">{price}</strong></div>
          {paid ? <div className="mt-6 rounded-2xl bg-emerald-50 p-4 text-emerald-800 dark:bg-emerald-400/10 dark:text-emerald-300"><p className="flex items-center gap-2 font-bold"><CheckCircle2 className="h-5 w-5"/>{t('purchased')}</p><p className="mt-1 text-sm">{t('purchasedHelp')}</p></div> : pending ? <div className="mt-6 rounded-2xl bg-amber-50 p-4 text-amber-800 dark:bg-amber-400/10 dark:text-amber-300"><p className="flex items-center gap-2 font-bold"><Clock3 className="h-5 w-5"/>{t('pending')}</p><p className="mt-1 text-sm">{t('pendingHelp')}</p></div> : previousOrder && <p className="mt-5 rounded-2xl bg-slate-100 p-4 text-sm text-slate-600 dark:bg-slate-800 dark:text-slate-300">{t('retry', { status: t(`statuses.${previousOrder.status}`) })}</p>}
          {error && <p className="mt-5 rounded-2xl bg-red-50 p-4 text-sm text-red-700" role="alert">{error}</p>}
          {paid ? <Button className="mt-6 w-full" onClick={startLearning} disabled={state === 'submitting'}>{t('startLearning')}</Button> : pending ? <Button className="mt-6 w-full" disabled>{t('paymentPending')}</Button> : <Button className="mt-6 w-full" onClick={create} disabled={state === 'submitting'}>{state === 'submitting' ? t('creating') : t('continue')}</Button>}
          <p className="mt-4 text-center text-xs leading-5 text-slate-500">{t('gatewayNotice')}</p>
        </aside>
      </div>
    </main>
  </PageBackground>;
}

function CheckoutSkeleton() {
  return <PageBackground variant="course" className="min-h-screen"><main className="section-shell animate-pulse py-16"><div className="h-5 w-36 rounded bg-slate-200 dark:bg-slate-700"/><div className="mt-6 grid gap-7 lg:grid-cols-[1fr_420px]"><div className="h-[560px] rounded-3xl bg-white/75 dark:bg-slate-800/80"/><div className="h-96 rounded-3xl bg-white/75 dark:bg-slate-800/80"/></div></main></PageBackground>;
}
