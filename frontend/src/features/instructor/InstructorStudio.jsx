import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { BookOpen, CircleDollarSign, Clock3, GraduationCap, Plus, RefreshCw, Send, Star, Users } from 'lucide-react';
import api from '../../api/client';
import { CourseSalesChart, RevenueChart } from './InstructorCharts';

const initialForm = {
  category_id: '',
  title: '',
  short_description: '',
  description: '',
  level: 'beginner',
  language: 'English',
  duration: 60,
  type: 'free',
  price: 0,
};

const apiMessage = (error, fallback) => error.response?.data?.message
  || Object.values(error.response?.data?.errors || {})[0]?.[0]
  || fallback;

function StudioSkeleton() {
  return <div className="space-y-8" aria-label="Loading instructor studio">
    <div className="h-28 animate-pulse rounded-3xl bg-slate-200/70 dark:bg-slate-800"/>
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{Array.from({ length: 6 }, (_, index) => <div key={index} className="h-32 animate-pulse rounded-2xl bg-slate-200/70 dark:bg-slate-800"/>)}</div>
    <div className="grid gap-5 xl:grid-cols-2">{Array.from({ length: 2 }, (_, index) => <div key={index} className="h-80 animate-pulse rounded-3xl bg-slate-200/70 dark:bg-slate-800"/>)}</div>
  </div>;
}

function MetricCard({ icon: Icon, label, value, hint, accent = 'amber' }) {
  const colors = accent === 'blue'
    ? 'bg-blue-50 text-blue-700 dark:bg-blue-400/10 dark:text-blue-300'
    : accent === 'emerald'
      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300'
      : 'bg-amber-50 text-amber-700 dark:bg-amber-400/10 dark:text-amber-300';
  return <article className="rounded-2xl border border-white/70 bg-white/82 p-5 shadow-[0_18px_50px_-38px_rgba(15,23,42,.55)] backdrop-blur-xl dark:border-slate-700/70 dark:bg-slate-900/78">
    <div className={`grid h-11 w-11 place-items-center rounded-xl ${colors}`}><Icon className="h-5 w-5"/></div>
    <p className="mt-5 text-sm font-semibold text-slate-500 dark:text-slate-400">{label}</p>
    <p className="mt-1 text-2xl font-black tracking-tight text-slate-950 dark:text-white">{value}</p>
    {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
  </article>;
}

function StatusBadge({ value, t }) {
  const style = {
    published: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-400/15 dark:text-emerald-300',
    pending_review: 'bg-blue-100 text-blue-800 dark:bg-blue-400/15 dark:text-blue-300',
    rejected: 'bg-red-100 text-red-800 dark:bg-red-400/15 dark:text-red-300',
    draft: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200',
    archived: 'bg-amber-100 text-amber-800 dark:bg-amber-400/15 dark:text-amber-300',
  }[value] || 'bg-slate-100 text-slate-700';
  return <span className={`rounded-full px-3 py-1 text-xs font-extrabold ${style}`}>{t(`studio.status.${value}`, { defaultValue: value })}</span>;
}

function EmptyPanel({ title, description }) {
  return <div className="grid min-h-52 place-items-center rounded-2xl border border-dashed border-slate-300 bg-slate-50/55 p-8 text-center dark:border-slate-700 dark:bg-slate-950/25">
    <div><BookOpen className="mx-auto h-8 w-8 text-slate-400"/><h3 className="mt-3 font-extrabold text-slate-800 dark:text-slate-100">{title}</h3><p className="mt-1 text-sm text-slate-500">{description}</p></div>
  </div>;
}

export default function InstructorStudio({ user }) {
  const { t, i18n } = useTranslation('dashboard');
  const [state, setState] = useState({ loading: true, error: '', earnings: null, courses: [], categories: [], analytics: {} });
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState('');

  const load = useCallback(async signal => {
    setState(current => ({ ...current, loading: true, error: '' }));
    try {
      const [earningsResponse, coursesResponse, categoriesResponse] = await Promise.all([
        api.get('/api/instructor/earnings', { signal }),
        api.get('/api/manage/courses', { signal }),
        api.get('/api/categories', { signal }),
      ]);
      const courses = coursesResponse.data.data || [];
      const details = await Promise.all(courses.map(async course => {
        const [statistics, reviews] = await Promise.all([
          api.get(`/api/manage/courses/${course.id}/enrollment-statistics`, { signal }),
          api.get(`/api/manage/courses/${course.id}/reviews`, { signal }),
        ]);
        const publishedReviews = (reviews.data.data || []).filter(review => review.status === 'published');
        const averageRating = publishedReviews.length
          ? publishedReviews.reduce((sum, review) => sum + Number(review.rating), 0) / publishedReviews.length
          : 0;
        return [course.id, { ...statistics.data, reviews: publishedReviews.length, average_rating: averageRating }];
      }));
      setState({
        loading: false,
        error: '',
        earnings: earningsResponse.data.data,
        courses,
        categories: categoriesResponse.data.data || [],
        analytics: Object.fromEntries(details),
      });
    } catch (error) {
      if (error.code === 'ERR_CANCELED') return;
      setState(current => ({ ...current, loading: false, error: apiMessage(error, t('studio.loadError')) }));
    }
  }, [t]);

  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal);
    return () => controller.abort();
  }, [load]);

  useEffect(() => {
    if (!form.category_id && state.categories[0]) {
      setForm(current => ({ ...current, category_id: state.categories[0].id }));
    }
  }, [form.category_id, state.categories]);

  const derived = useMemo(() => {
    const history = state.earnings?.revenue_history?.data || [];
    const revenueMap = new Map();
    const salesMap = new Map();
    history.forEach(item => {
      const date = new Date(item.created_at);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const label = date.toLocaleDateString(i18n.language, { month: 'short', year: '2-digit' });
      revenueMap.set(key, { label, value: (revenueMap.get(key)?.value || 0) + Number(item.instructor_amount) });
      salesMap.set(item.course.title, (salesMap.get(item.course.title) || 0) + 1);
    });
    const analytics = Object.values(state.analytics);
    const reviewCount = analytics.reduce((sum, item) => sum + item.reviews, 0);
    const weightedRating = reviewCount
      ? analytics.reduce((sum, item) => sum + item.average_rating * item.reviews, 0) / reviewCount
      : 0;
    return {
      revenue: [...revenueMap.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([, value]) => value),
      sales: [...salesMap.entries()].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value).slice(0, 6),
      students: analytics.reduce((sum, item) => sum + Number(item.total || 0), 0),
      averageRating: weightedRating,
    };
  }, [i18n.language, state.analytics, state.earnings]);

  const createCourse = async event => {
    event.preventDefault();
    setSaving(true);
    setNotice('');
    try {
      await api.post('/api/manage/courses', {
        ...form,
        category_id: Number(form.category_id),
        duration: Number(form.duration),
        price: form.type === 'paid' ? Number(form.price) : 0,
      });
      setForm(initialForm);
      setFormOpen(false);
      setNotice(t('studio.created'));
      await load();
    } catch (error) {
      setNotice(apiMessage(error, t('actionFailed')));
    } finally {
      setSaving(false);
    }
  };

  const editCourse = async course => {
    const title = window.prompt(t('studio.editTitle'), course.title);
    if (!title || title === course.title) return;
    try {
      await api.put(`/api/manage/courses/${course.id}`, { title });
      setNotice(t('studio.updated'));
      await load();
    } catch (error) {
      setNotice(apiMessage(error, t('actionFailed')));
    }
  };

  const submitCourse = async course => {
    if (!window.confirm(t('submitReview'))) return;
    try {
      await api.post(`/api/manage/courses/${course.id}/submit`);
      setNotice(t('studio.submitted'));
      await load();
    } catch (error) {
      setNotice(apiMessage(error, t('actionFailed')));
    }
  };

  if (state.loading) return <StudioSkeleton/>;
  if (state.error) return <div className="rounded-3xl border border-red-200 bg-red-50/90 p-8 text-center dark:border-red-900/60 dark:bg-red-950/50"><p className="font-semibold text-red-700 dark:text-red-300">{state.error}</p><button onClick={() => load()} className="action mt-5 gap-2"><RefreshCw className="h-4 w-4"/>{t('studio.retry')}</button></div>;

  const currency = state.earnings?.revenue_history?.data?.[0]?.currency || 'USD';
  const history = state.earnings?.revenue_history?.data || [];

  return <div className="space-y-9">
    <header className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
      <div><h1 className="text-xs font-black uppercase tracking-[.2em] text-amber-700 dark:text-amber-300">{t('instructor')}</h1><h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950 dark:text-white sm:text-4xl">{t('studio.welcome', { name: user.name })}</h2><p className="mt-2 max-w-2xl text-slate-600 dark:text-slate-300">{t('studio.description')}</p></div>
      <Link to="/instructor/courses/new" className="action gap-2"><Plus className="h-5 w-5"/>{t('createCourse')}</Link>
    </header>

    {notice && <p className="notice dark:border-sky-800 dark:bg-sky-950/60 dark:text-sky-200">{notice}</p>}

    {formOpen && <form onSubmit={createCourse} className="grid gap-4 rounded-3xl border border-amber-200/80 bg-white/90 p-6 shadow-xl backdrop-blur-xl dark:border-amber-500/20 dark:bg-slate-900/90 md:grid-cols-2">
      <h2 className="text-xl font-black text-slate-950 dark:text-white md:col-span-2">{t('studio.newCourse')}</h2>
      <input required className="field dark:border-slate-700 dark:bg-slate-800 dark:text-white" placeholder={t('title')} value={form.title} onChange={event => setForm({ ...form, title: event.target.value })}/>
      <select required className="field dark:border-slate-700 dark:bg-slate-800 dark:text-white" value={form.category_id} onChange={event => setForm({ ...form, category_id: event.target.value })}>{state.categories.map(category => <option key={category.id} value={category.id}>{category.name}</option>)}</select>
      <input required className="field dark:border-slate-700 dark:bg-slate-800 dark:text-white" placeholder={t('shortDescription')} value={form.short_description} onChange={event => setForm({ ...form, short_description: event.target.value })}/>
      <input required className="field dark:border-slate-700 dark:bg-slate-800 dark:text-white" placeholder={t('language')} value={form.language} onChange={event => setForm({ ...form, language: event.target.value })}/>
      <textarea required className="field min-h-28 dark:border-slate-700 dark:bg-slate-800 dark:text-white md:col-span-2" placeholder={t('description')} value={form.description} onChange={event => setForm({ ...form, description: event.target.value })}/>
      <select className="field dark:border-slate-700 dark:bg-slate-800 dark:text-white" value={form.level} onChange={event => setForm({ ...form, level: event.target.value })}><option value="beginner">{t('studio.level.beginner')}</option><option value="intermediate">{t('studio.level.intermediate')}</option><option value="advanced">{t('studio.level.advanced')}</option></select>
      <input type="number" min="0" required aria-label={t('duration')} className="field dark:border-slate-700 dark:bg-slate-800 dark:text-white" value={form.duration} onChange={event => setForm({ ...form, duration: event.target.value })}/>
      <select className="field dark:border-slate-700 dark:bg-slate-800 dark:text-white" value={form.type} onChange={event => setForm({ ...form, type: event.target.value })}><option value="free">{t('studio.free')}</option><option value="paid">{t('studio.paid')}</option></select>
      {form.type === 'paid' && <input type="number" min="0.01" step="0.01" required aria-label={t('studio.price')} className="field dark:border-slate-700 dark:bg-slate-800 dark:text-white" value={form.price} onChange={event => setForm({ ...form, price: event.target.value })}/>}
      <div className="flex gap-3 md:col-span-2"><button disabled={saving} className="action">{saving ? t('studio.saving') : t('create')}</button><button type="button" onClick={() => setFormOpen(false)} className="rounded-xl border border-slate-300 px-5 py-3 font-bold text-slate-700 dark:border-slate-600 dark:text-slate-200">{t('common:actions.cancel')}</button></div>
    </form>}

    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      <MetricCard icon={CircleDollarSign} label={t('studio.totalEarnings')} value={`${state.earnings.total_revenue} ${currency}`}/>
      <MetricCard icon={Clock3} label={t('studio.pendingEarnings')} value={`${state.earnings.pending_earnings} ${currency}`} accent="blue"/>
      <MetricCard icon={GraduationCap} label={t('studio.totalSales')} value={state.earnings.sales_count} accent="emerald"/>
      <MetricCard icon={BookOpen} label={t('studio.publishedCourses')} value={state.courses.filter(course => course.status === 'published').length}/>
      <MetricCard icon={Users} label={t('studio.students')} value={derived.students} accent="blue"/>
      <MetricCard icon={Star} label={t('studio.averageRating')} value={derived.averageRating ? derived.averageRating.toFixed(1) : '—'} hint={t('studio.publishedReviewsOnly')} accent="emerald"/>
    </section>

    <section className="grid gap-5 xl:grid-cols-2">
      <article className="rounded-3xl border border-white/70 bg-white/82 p-6 backdrop-blur-xl dark:border-slate-700/70 dark:bg-slate-900/80"><h2 className="text-xl font-black text-slate-950 dark:text-white">{t('studio.revenueOverTime')}</h2><p className="mt-1 text-sm text-slate-500">{t('studio.revenueSubtitle')}</p><div className="mt-6">{derived.revenue.length ? <RevenueChart data={derived.revenue} currency={currency}/> : <EmptyPanel title={t('studio.noRevenue')} description={t('studio.noRevenueDescription')}/>}</div></article>
      <article className="rounded-3xl border border-white/70 bg-white/82 p-6 backdrop-blur-xl dark:border-slate-700/70 dark:bg-slate-900/80"><h2 className="text-xl font-black text-slate-950 dark:text-white">{t('studio.salesByCourse')}</h2><p className="mt-1 text-sm text-slate-500">{t('studio.salesSubtitle')}</p><div className="mt-6">{derived.sales.length ? <CourseSalesChart data={derived.sales}/> : <EmptyPanel title={t('studio.noSales')} description={t('studio.noSalesDescription')}/>}</div></article>
    </section>

    <section><div className="flex items-end justify-between gap-4"><div><h2 className="text-2xl font-black text-slate-950 dark:text-white">{t('studio.courseWorkspace')}</h2><p className="mt-1 text-sm text-slate-500">{t('studio.courseWorkspaceDescription')}</p></div><span className="text-sm font-bold text-slate-500">{state.courses.length} {t('studio.coursesCount')}</span></div>
      <div className="mt-5 space-y-4">{state.courses.length ? state.courses.map(course => {
        const analytics = state.analytics[course.id] || {};
        return <article key={course.id} className="rounded-3xl border border-white/70 bg-white/86 p-5 shadow-[0_20px_55px_-42px_rgba(15,23,42,.45)] backdrop-blur-xl dark:border-slate-700/70 dark:bg-slate-900/82 sm:p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between"><div className="min-w-0"><div className="flex flex-wrap items-center gap-3"><h3 className="truncate text-lg font-black text-slate-950 dark:text-white">{course.title}</h3><StatusBadge value={course.status} t={t}/></div><p className="mt-2 line-clamp-2 text-sm text-slate-500 dark:text-slate-400">{course.short_description}</p></div><div className="flex flex-wrap gap-2"><Link to={`/instructor/courses/${course.id}/curriculum`} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 hover:border-amber-400 dark:border-slate-700 dark:text-slate-200">{t('curriculum')}</Link>{['draft', 'rejected'].includes(course.status) && <button onClick={() => editCourse(course)} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 hover:border-amber-400 dark:border-slate-700 dark:text-slate-200">{t('edit')}</button>}{['draft', 'rejected'].includes(course.status) && <button onClick={() => submitCourse(course)} className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2 text-sm font-bold text-white dark:bg-amber-400 dark:text-slate-950"><Send className="h-4 w-4"/>{t('submit')}</button>}</div></div>
          <dl className="mt-5 grid gap-3 border-t border-slate-200/70 pt-5 dark:border-slate-700 sm:grid-cols-4"><div><dt className="text-xs font-bold uppercase tracking-wide text-slate-400">{t('studio.enrollments')}</dt><dd className="mt-1 font-black text-slate-900 dark:text-white">{analytics.total || 0}</dd></div><div><dt className="text-xs font-bold uppercase tracking-wide text-slate-400">{t('studio.completion')}</dt><dd className="mt-1 font-black text-slate-900 dark:text-white">{Number(analytics.completion_rate || 0).toFixed(1)}%</dd></div><div><dt className="text-xs font-bold uppercase tracking-wide text-slate-400">{t('studio.reviewsSummary')}</dt><dd className="mt-1 font-black text-slate-900 dark:text-white">{analytics.reviews || 0}</dd></div><div><dt className="text-xs font-bold uppercase tracking-wide text-slate-400">{t('studio.rating')}</dt><dd className="mt-1 font-black text-slate-900 dark:text-white">{analytics.average_rating ? `${analytics.average_rating.toFixed(1)}/5` : '—'}</dd></div></dl>
        </article>;
      }) : <EmptyPanel title={t('studio.noCourses')} description={t('studio.noCoursesDescription')}/>}</div>
    </section>

    <section className="rounded-3xl border border-white/70 bg-white/82 p-6 backdrop-blur-xl dark:border-slate-700/70 dark:bg-slate-900/80"><h2 className="text-xl font-black text-slate-950 dark:text-white">{t('studio.earningsHistory')}</h2><div className="mt-5 overflow-x-auto">{history.length ? <table className="min-w-[680px] text-start text-sm"><thead><tr className="border-b border-slate-200 text-start text-xs uppercase tracking-wide text-slate-400 dark:border-slate-700"><th className="px-3 py-3 text-start">{t('studio.course')}</th><th className="px-3 py-3 text-start">{t('studio.date')}</th><th className="px-3 py-3 text-start">{t('studio.gross')}</th><th className="px-3 py-3 text-start">{t('studio.platformFee')}</th><th className="px-3 py-3 text-start">{t('studio.yourEarnings')}</th><th className="px-3 py-3 text-start">{t('studio.earningStatus')}</th></tr></thead><tbody>{history.map(item => <tr key={item.id} className="border-b border-slate-100 dark:border-slate-800"><td className="px-3 py-4 font-bold text-slate-900 dark:text-white">{item.course.title}</td><td className="px-3 py-4 text-slate-500">{new Date(item.created_at).toLocaleDateString(i18n.language)}</td><td className="px-3 py-4 text-slate-600 dark:text-slate-300">{item.gross_amount} {item.currency}</td><td className="px-3 py-4 text-slate-600 dark:text-slate-300">{item.platform_fee}</td><td className="px-3 py-4 font-black text-emerald-700 dark:text-emerald-300">{item.instructor_amount}</td><td className="px-3 py-4"><span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800 dark:bg-amber-400/15 dark:text-amber-300">{t(`studio.earning.${item.status}`, { defaultValue: item.status })}</span></td></tr>)}</tbody></table> : <EmptyPanel title={t('studio.noEarnings')} description={t('studio.noEarningsDescription')}/>}</div></section>
  </div>;
}
