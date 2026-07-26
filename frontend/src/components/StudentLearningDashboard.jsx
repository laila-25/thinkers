import { CheckCircle2, Clock3, PlayCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import api from '../api/client';
import GamificationPanel from './GamificationPanel';
import CertificatesPanel from './CertificatesPanel';
import PurchasesPanel from './PurchasesPanel';

export default function StudentLearningDashboard({ user, refreshUser }) {
  const { t } = useTranslation('dashboard');
  const { t: tAi } = useTranslation('ai');
  const [items, setItems] = useState([]);
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(true);
  const message = error => error.response?.data?.message || Object.values(error.response?.data?.errors || {})[0]?.[0] || t('actionFailed');

  useEffect(() => {
    const controller = new AbortController();
    api.get('/api/enrollments', { signal: controller.signal })
      .then(response => setItems(response.data.data || []))
      .catch(error => { if (!controller.signal.aborted) setNotice(message(error)); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const apply = async () => {
    try { const { data } = await api.post('/api/instructor/apply'); setNotice(data.message); await refreshUser(); }
    catch (error) { setNotice(message(error)); }
  };
  const learningUrl = item => item.last_accessed_lesson_id ? `/learn/${item.id}/lessons/${item.last_accessed_lesson_id}` : `/learn/${item.id}`;
  const current = items.find(item => item.last_accessed_lesson) || items.find(item => item.status === 'active') || items[0];

  return <>
    <div className="flex flex-wrap justify-between gap-3"><h1 className="text-3xl font-bold">{t('welcome', { name: user.name })}</h1><div className="flex flex-wrap gap-2"><button type="button" onClick={() => window.dispatchEvent(new CustomEvent('thinkers-ai:open'))} className="action">{tAi('lessonActions.ask')}</button>{user.instructor_status !== 'pending' && <button onClick={apply} className="action">{t('becomeInstructor')}</button>}</div></div>
    {notice && <p className="notice">{notice}</p>}
    <GamificationPanel/>
    {loading ? <DashboardSkeleton/> : !items.length ? <EmptyLearning/> : <>
      <section className="mt-8"><p className="section-kicker">Continue learning</p><h2 className="mt-1 text-2xl font-bold">Pick up where you left off</h2>{current && <Link to={learningUrl(current)} className="group mt-5 grid overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg md:grid-cols-[220px_1fr]"><div className="min-h-40 bg-slate-100">{current.course.thumbnail ? <img src={current.course.thumbnail} alt="" width="440" height="280" loading="lazy" decoding="async" className="h-full w-full object-cover"/> : <div className="grid h-full place-items-center"><PlayCircle className="h-12 w-12 text-amber-500"/></div>}</div><div className="p-6"><p className="text-xs font-bold uppercase tracking-wider text-amber-700">Last watched lesson</p><h3 className="mt-2 text-2xl font-bold">{current.course.title}</h3><p className="mt-2 text-slate-500">{current.last_accessed_lesson?.title || 'Start the first lesson'}</p><div className="mt-6 flex items-center justify-between text-sm"><span>{current.remaining_lessons} lessons remaining</span><strong className="tabular-nums">{current.completion_percentage}%</strong></div><ProgressBar value={current.completion_percentage}/><span className="mt-5 inline-flex items-center gap-2 font-bold text-amber-700">{t('continue')} <PlayCircle className="h-4 w-4 transition group-hover:translate-x-1"/></span></div></Link>}</section>
      <section className="mt-10"><h2 className="text-2xl font-bold">{t('courses')}</h2><div className="mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-3">{items.map(item => <Link key={item.id} to={learningUrl(item)} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"><div className="flex items-start justify-between gap-3"><div><h3 className="font-bold">{item.course.title}</h3><p className="mt-1 text-sm text-slate-500">{item.course.instructor?.name}</p></div>{item.completion_percentage === 100 ? <CheckCircle2 className="h-6 w-6 text-emerald-600"/> : <Clock3 className="h-5 w-5 text-slate-400"/>}</div><div className="mt-5 flex justify-between text-xs font-semibold text-slate-500"><span>{item.completed_lessons}/{item.total_lessons} lessons</span><span>{item.completion_percentage}%</span></div><ProgressBar value={item.completion_percentage}/></Link>)}</div></section>
      <CertificatesPanel/>
    </>}
    <PurchasesPanel enrollments={items}/>
  </>;
}

function ProgressBar({ value }) { return <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-[#F5C542] transition-[width] duration-700 ease-out" style={{ width: `${value}%` }}/></div>; }
function DashboardSkeleton() { return <div className="mt-8 animate-pulse space-y-6"><div className="h-56 rounded-3xl bg-slate-200"/><div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{[1, 2, 3].map(item => <div key={item} className="h-40 rounded-3xl bg-slate-200"/>)}</div></div>; }
function EmptyLearning() { return <div className="mt-8 rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center"><PlayCircle className="mx-auto h-10 w-10 text-slate-300"/><h2 className="mt-4 text-xl font-bold">Your learning journey starts here</h2><p className="mt-2 text-slate-500">Enroll in a course to track progress and continue where you left off.</p><Link to="/courses" className="action mt-5 inline-flex">Explore courses</Link></div>; }
