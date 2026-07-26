import { Bot, BookOpen, CheckCircle2, GraduationCap, School, UserRoundCheck, Users, UsersRound } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router';
import { DistributionChart, TrendChart } from './AdminCharts';
import { ErrorState, PageSkeleton } from './AdminUI';
import { getDashboard } from './adminApi';

const cards = [
  ['Total users', 'total_users', Users, 'bg-blue-50 text-blue-700'],
  ['Students', 'total_students', School, 'bg-emerald-50 text-emerald-700'],
  ['Instructors', 'total_instructors', GraduationCap, 'bg-violet-50 text-violet-700'],
  ['Pending requests', 'pending_instructors', UserRoundCheck, 'bg-amber-50 text-amber-700'],
  ['Total courses', 'total_courses', BookOpen, 'bg-sky-50 text-sky-700'],
  ['Published', 'published_courses', CheckCircle2, 'bg-teal-50 text-teal-700'],
  ['Enrollments', 'total_enrollments', UsersRound, 'bg-orange-50 text-orange-700'],
  ['AI requests', 'ai_requests', Bot, 'bg-fuchsia-50 text-fuchsia-700', '/admin/ai-usage'],
];

export default function AdminDashboardPage() {
  const [state, setState] = useState({ loading: true, data: null, error: false });
  const load = useCallback(() => {
    setState(current => ({ ...current, loading: true, error: false }));
    getDashboard()
      .then(data => setState({ loading: false, data, error: false }))
      .catch(() => setState({ loading: false, data: null, error: true }));
  }, []);

  useEffect(load, [load]);
  if (state.loading) return <PageSkeleton cards={8}/>;
  if (state.error) return <ErrorState retry={load}/>;

  const { overview, charts, attention } = state.data;
  return <div className="space-y-7">
    <div><h2 className="text-3xl font-black tracking-tight">Platform overview</h2><p className="mt-1 text-slate-500">Monitor growth, publishing, learning activity, and AI adoption.</p></div>
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{cards.map(([label, key, Icon, style, path]) => <OverviewCard key={key} label={label} value={overview[key]} icon={Icon} style={style} path={path}/>)}</div>
    <div className="grid gap-6 xl:grid-cols-2">
      <ChartCard title="User growth" subtitle="New accounts in the last six months"><TrendChart data={charts.user_growth}/></ChartCard>
      <ChartCard title="Enrollment trends" subtitle="Learning adoption over time"><TrendChart data={charts.enrollment_trends} color="#3B82F6"/></ChartCard>
      <ChartCard title="Course creation" subtitle="Courses created each month"><TrendChart data={charts.course_creation} color="#10B981" type="bar"/></ChartCard>
      <ChartCard title="Course categories" subtitle="Distribution of the course catalog"><div className="grid items-center sm:grid-cols-[1fr_.8fr]"><DistributionChart data={charts.category_distribution}/><div className="space-y-2">{charts.category_distribution.map(item => <div key={item.label} className="flex justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm"><span>{item.label}</span><strong>{item.value}</strong></div>)}</div></div></ChartCard>
    </div>
    <div className="grid gap-4 md:grid-cols-2"><Attention title="Courses awaiting moderation" value={attention.pending_courses}/><Attention title="Instructor applications awaiting review" value={attention.pending_instructors}/></div>
  </div>;
}

function OverviewCard({ label, value, icon: Icon, style, path }) {
  const content = <><div><p className="text-sm font-semibold text-slate-500">{label}</p><strong className="mt-2 block text-3xl font-black">{Number(value).toLocaleString()}</strong></div><span className={`rounded-xl p-3 ${style}`}><Icon className="h-5 w-5"/></span></>;
  const classes = `flex items-start justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_14px_40px_-32px_rgba(15,23,42,.4)] ${path ? 'transition hover:-translate-y-0.5 hover:border-violet-300 hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-violet-100' : ''}`;
  return path ? <Link to={path} className={classes} aria-label={`View ${label}`}>{content}</Link> : <article className={classes}>{content}</article>;
}

function ChartCard({ title, subtitle, children }) { return <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h3 className="font-extrabold">{title}</h3><p className="mb-5 text-sm text-slate-500">{subtitle}</p>{children}</section>; }
function Attention({ title, value }) { return <div className="flex items-center justify-between rounded-2xl border border-amber-200 bg-amber-50 p-5"><div><p className="font-bold text-amber-950">{title}</p><p className="text-sm text-amber-700">Requires administrator attention</p></div><strong className="text-3xl text-amber-800">{value}</strong></div>; }
