import { useCallback, useEffect, useState } from 'react';
import { getDashboard } from './adminApi';

const emptyCharts = { user_growth: [], course_creation: [], enrollment_trends: [], ai_usage: [], category_distribution: [] };

export default function AdminReportsPage() {
  const [charts, setCharts] = useState(emptyCharts);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await getDashboard();
      setCharts(normalizeCharts(response?.charts));
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to load report data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return <LoadingState/>;
  if (error) return <ErrorState message={error} retry={load}/>;

  return <div className="space-y-6">
    <header><h2 className="text-3xl font-black tracking-tight">Reports</h2><p className="mt-1 text-slate-500">Operational reporting across users, courses, enrollment, categories, and AI.</p></header>
    <div className="grid gap-6 xl:grid-cols-2">
      <ReportPanel title="User growth" rows={charts.user_growth} color="bg-amber-400"/>
      <ReportPanel title="Course creation" rows={charts.course_creation} color="bg-emerald-500"/>
      <ReportPanel title="Enrollment trends" rows={charts.enrollment_trends} color="bg-blue-500"/>
      <ReportPanel title="AI requests" rows={charts.ai_usage} color="bg-violet-500"/>
      <CategoryPanel rows={charts.category_distribution}/>
    </div>
  </div>;
}

function normalizeCharts(value) {
  const source = value && typeof value === 'object' ? value : {};
  return {
    user_growth: normalizeRows(source.user_growth),
    course_creation: normalizeRows(source.course_creation),
    enrollment_trends: normalizeRows(source.enrollment_trends),
    ai_usage: normalizeRows(source.ai_usage),
    category_distribution: normalizeRows(source.category_distribution),
  };
}

function normalizeRows(rows) {
  if (!Array.isArray(rows)) return [];
  return rows.map((row, index) => ({ id: `${String(row?.label || 'item')}-${index}`, label: String(row?.label || ''), value: toNumber(row?.value) }));
}

function ReportPanel({ title, rows, color }) {
  const maximum = Math.max(1, ...rows.map(row => row.value));
  return <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h3 className="font-extrabold">{title}</h3>{rows.length ? <div className="mt-6 flex h-56 items-end gap-3" aria-label={`${title} chart`}>{rows.map(row => <div key={row.id} className="flex min-w-0 flex-1 flex-col items-center justify-end gap-2"><span className="text-xs font-bold text-slate-500">{row.value}</span><div className={`w-full rounded-t-lg ${color}`} style={{ height: `${Math.max(4, (row.value / maximum) * 150)}px` }}/><span className="max-w-full truncate text-[11px] text-slate-400">{row.label}</span></div>)}</div> : <EmptyState/>}</section>;
}

function CategoryPanel({ rows }) {
  const maximum = Math.max(1, ...rows.map(row => row.value));
  return <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm xl:col-span-2"><h3 className="font-extrabold">Category distribution</h3>{rows.length ? <div className="mt-5 space-y-4">{rows.map(row => <div key={row.id} className="grid items-center gap-3 sm:grid-cols-[180px_1fr_60px]"><span className="truncate text-sm font-semibold">{row.label}</span><div className="h-3 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-amber-400" style={{ width: `${(row.value / maximum) * 100}%` }}/></div><strong className="text-right text-sm">{row.value}</strong></div>)}</div> : <EmptyState/>}</section>;
}

function LoadingState() { return <div className="animate-pulse space-y-6" aria-label="Loading reports"><div className="h-10 w-48 rounded bg-slate-200"/><div className="grid gap-6 xl:grid-cols-2">{[1, 2, 3, 4].map(item => <div key={item} className="h-72 rounded-2xl bg-slate-200"/>)}</div></div>; }
function ErrorState({ message, retry }) { return <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-800"><h2 className="font-extrabold">Reports could not be loaded</h2><p className="mt-2 text-sm">{message}</p><button type="button" onClick={retry} className="mt-4 rounded-xl bg-red-700 px-4 py-2 font-bold text-white">Try again</button></div>; }
function EmptyState() { return <div className="mt-5 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm font-semibold text-slate-500">No report data is available yet.</div>; }
function toNumber(value) { const parsed = Number(value); return Number.isFinite(parsed) ? parsed : 0; }
