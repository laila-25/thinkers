import { useCallback, useEffect, useState } from 'react';
import { getAiUsage } from './adminApi';

const emptyUsage = { total_requests: 0, total_tokens: 0, active_users: 0, trend: [], top_users: [] };

export default function AdminAiUsagePage() {
  const [usage, setUsage] = useState(emptyUsage);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const payload = await getAiUsage();
      setUsage(normalizeUsage(payload));
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to load AI usage data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return <LoadingState/>;
  if (error) return <ErrorState message={error} retry={load}/>;

  return <div className="space-y-6">
    <header><h2 className="text-3xl font-black tracking-tight">AI usage</h2><p className="mt-1 text-slate-500">Monitor requests, token consumption, trends, and the most active learners.</p></header>
    <div className="grid gap-4 sm:grid-cols-3">
      <Metric label="Total AI requests" value={usage.total_requests}/>
      <Metric label="Tokens consumed" value={usage.total_tokens}/>
      <Metric label="Active users" value={usage.active_users}/>
    </div>
    <TrendPanel rows={usage.trend}/>
    <UsersTable users={usage.top_users}/>
  </div>;
}

function normalizeUsage(payload) {
  const source = payload && typeof payload === 'object' ? payload : {};
  return {
    total_requests: toNumber(source.total_requests),
    total_tokens: toNumber(source.total_tokens),
    active_users: toNumber(source.active_users),
    trend: Array.isArray(source.trend) ? source.trend.map(row => ({ label: String(row?.label || ''), value: toNumber(row?.value) })) : [],
    top_users: Array.isArray(source.top_users) ? source.top_users.map((user, index) => ({
      id: user?.id ?? index,
      name: String(user?.name || 'Unknown user'),
      email: String(user?.email || 'No email available'),
      requests: toNumber(user?.requests),
      tokens: toNumber(user?.tokens),
    })) : [],
  };
}

function Metric({ label, value }) {
  return <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-sm font-semibold text-slate-500">{label}</p><strong className="mt-2 block text-3xl font-black text-slate-950">{value.toLocaleString()}</strong></article>;
}

function TrendPanel({ rows }) {
  const maximum = Math.max(1, ...rows.map(row => row.value));
  return <section className="rounded-2xl border border-slate-200 bg-white p-5"><h3 className="font-extrabold">Usage trend</h3><p className="mb-6 text-sm text-slate-500">Assistant responses over the last 14 days</p>{rows.length ? <div className="flex h-64 items-end gap-2" aria-label="AI usage trend">{rows.map((row, index) => <div key={`${row.label}-${index}`} className="flex min-w-0 flex-1 flex-col items-center justify-end gap-2"><span className="text-xs font-bold text-slate-500">{row.value}</span><div className="w-full rounded-t-lg bg-violet-500 transition-all" style={{ height: `${Math.max(4, (row.value / maximum) * 180)}px` }}/><span className="max-w-full truncate text-[10px] text-slate-400">{row.label}</span></div>)}</div> : <EmptyState title="No AI activity recorded yet."/>}</section>;
}

function UsersTable({ users }) {
  return <section className="rounded-2xl border border-slate-200 bg-white p-5"><h3 className="font-extrabold">Most active users</h3>{users.length ? <div className="mt-4 overflow-x-auto"><table className="w-full min-w-[600px] text-left text-sm"><thead className="text-xs uppercase text-slate-400"><tr><th className="py-3">User</th><th>Requests</th><th>Tokens</th><th>Average/request</th></tr></thead><tbody className="divide-y">{users.map(user => <tr key={user.id}><td className="py-4"><strong>{user.name}</strong><p className="text-slate-500">{user.email}</p></td><td>{user.requests.toLocaleString()}</td><td>{user.tokens.toLocaleString()}</td><td>{user.requests ? Math.round(user.tokens / user.requests).toLocaleString() : '0'}</td></tr>)}</tbody></table></div> : <EmptyState title="No AI activity recorded yet."/>}</section>;
}

function LoadingState() { return <div className="animate-pulse space-y-6" aria-label="Loading AI usage"><div className="h-10 w-52 rounded bg-slate-200"/><div className="grid gap-4 sm:grid-cols-3">{[1, 2, 3].map(item => <div key={item} className="h-28 rounded-2xl bg-slate-200"/>)}</div><div className="h-72 rounded-2xl bg-slate-200"/></div>; }
function ErrorState({ message, retry }) { return <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-800"><h2 className="font-extrabold">AI usage could not be loaded</h2><p className="mt-2 text-sm">{message}</p><button type="button" onClick={retry} className="mt-4 rounded-xl bg-red-700 px-4 py-2 font-bold text-white">Try again</button></div>; }
function EmptyState({ title }) { return <div className="mt-5 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm font-semibold text-slate-500">{title}</div>; }
function toNumber(value) { const parsed = Number(value); return Number.isFinite(parsed) ? parsed : 0; }
