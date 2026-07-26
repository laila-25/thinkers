import { Eye, Search, ShieldCheck, ShieldMinus, UserRound } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import useAuth from '../../context/useAuth';
import { ConfirmDialog, EmptyState, ErrorState, PageSkeleton, StatusBadge } from './AdminUI';
import { useToast as useAdminToast } from '../../components/ui';
import { getUser, getUsers, updateAdminAccess } from './adminApi';

export default function AdminUsersPage() {
  const [filters, setFilters] = useState({ search: '', role: '', verification: '', page: 1 });
  const [state, setState] = useState({ loading: true, rows: [], meta: null, error: false });
  const [selected, setSelected] = useState(null);
  const [roleChange, setRoleChange] = useState(null);
  const { user: currentUser } = useAuth();
  const toast = useAdminToast();
  const load = useCallback(signal => {
    setState(current => ({ ...current, loading: true }));
    return getUsers(filters, signal)
      .then(result => setState({ loading: false, rows: result.data || [], meta: result.meta, error: false }))
      .catch(() => { if (!signal?.aborted) setState({ loading: false, rows: [], meta: null, error: true }); });
  }, [filters]);

  useEffect(() => { const controller = new AbortController(); const timer = setTimeout(() => load(controller.signal), 250); return () => { clearTimeout(timer); controller.abort(); }; }, [load]);

  const changeAdminAccess = async () => {
    try {
      await updateAdminAccess(roleChange.id, roleChange.grant);
      toast({ message: roleChange.grant ? 'Administrator access granted.' : 'Administrator access revoked.' });
      setRoleChange(null);
      await load();
    } catch (requestError) {
      toast({ type: 'error', message: requestError.response?.data?.message || 'Unable to update administrator access.' });
      setRoleChange(null);
    }
  };

  if (state.loading && !state.rows.length) return <PageSkeleton/>;
  if (state.error) return <ErrorState retry={load}/>;

  return <div className="space-y-6">
    <PageHeading title="User management" description="Search accounts, review activity, and safely manage administrator access."/>
    <div className="grid gap-3 rounded-2xl border bg-white p-4 md:grid-cols-[1fr_180px_180px]">
      <label className="relative"><Search className="absolute left-3 top-3 h-4 w-4 text-slate-400"/><input value={filters.search} onChange={event => setFilters({ ...filters, search: event.target.value, page: 1 })} placeholder="Search name or email" className="field w-full pl-10"/></label>
      <select className="field" value={filters.role} onChange={event => setFilters({ ...filters, role: event.target.value, page: 1 })}><option value="">All roles</option><option value="student">Students</option><option value="instructor">Instructors</option><option value="admin">Admins</option></select>
      <select className="field" value={filters.verification} onChange={event => setFilters({ ...filters, verification: event.target.value, page: 1 })}><option value="">Any verification</option><option value="verified">Verified</option><option value="unverified">Unverified</option></select>
    </div>
    {state.rows.length ? <><UsersTable rows={state.rows} currentUserId={currentUser?.id} view={user => getUser(user.id).then(setSelected)} changeRole={setRoleChange}/><TablePagination meta={state.meta} setPage={page => setFilters(current => ({ ...current, page }))}/></> : <EmptyState title="No users found"/>}
    {selected && <UserDrawer user={selected} close={() => setSelected(null)}/>}
    <ConfirmDialog open={Boolean(roleChange)} title={roleChange?.grant ? `Make ${roleChange?.name} an administrator?` : `Revoke administrator access from ${roleChange?.name}?`} description={roleChange?.grant ? 'This grants full access to users, moderation, settings, reports, and instructor approvals.' : 'Their existing student or approved-instructor access will remain unchanged.'} confirmLabel={roleChange?.grant ? 'Grant admin access' : 'Revoke admin access'} danger={!roleChange?.grant} onConfirm={changeAdminAccess} onClose={() => setRoleChange(null)}/>
  </div>;
}

function TablePagination({ meta, setPage }) {
  if (!meta || meta.last_page <= 1) return null;
  return <div className="flex items-center justify-between rounded-2xl border bg-white px-5 py-4 dark:border-slate-700 dark:bg-slate-900"><span className="text-sm text-slate-500">Page {meta.current_page} of {meta.last_page} · {meta.total} users</span><div className="flex gap-2"><button disabled={meta.current_page <= 1} onClick={() => setPage(meta.current_page - 1)} className="rounded-lg border px-3 py-2 disabled:opacity-40">Previous</button><button disabled={meta.current_page >= meta.last_page} onClick={() => setPage(meta.current_page + 1)} className="rounded-lg border px-3 py-2 disabled:opacity-40">Next</button></div></div>;
}

function UsersTable({ rows, currentUserId, view, changeRole }) {
  return <div className="overflow-hidden rounded-2xl border border-slate-700/80 bg-[#101b2e] shadow-[0_22px_60px_-42px_rgba(2,6,23,.95)]"><div className="overflow-x-auto"><table className="w-full min-w-[850px] text-left text-sm text-slate-200"><thead className="bg-[#0b1526] text-xs uppercase tracking-wider text-slate-400"><tr><th className="px-5 py-4">User</th><th>Role</th><th>Verification</th><th>Joined</th><th>Activity</th><th className="pr-5 text-right">Actions</th></tr></thead><tbody className="divide-y divide-slate-700/70">{rows.map(user => {
    const isAdmin = user.roles.includes('admin');
    const isCurrentUser = Number(user.id) === Number(currentUserId);
    return <tr key={user.id} className="transition-colors hover:bg-[#172741]"><td className="px-5 py-4"><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-amber-400/15 font-black text-amber-300 ring-1 ring-amber-300/15">{user.name?.[0] || '?'}</span><div><strong className="text-white">{user.name}</strong><p className="text-slate-400">{user.email}</p></div></div></td><td><div className="flex flex-wrap gap-1">{user.roles.map(role => <StatusBadge key={role} value={role}/>)}</div></td><td><StatusBadge value={user.email_verified_at ? 'verified' : 'unverified'}/></td><td className="text-slate-300">{new Date(user.created_at).toLocaleDateString()}</td><td className="text-slate-300">{user.enrollments_count} enrollments</td><td className="pr-5 text-right"><div className="inline-flex gap-1"><button onClick={() => view(user)} className="rounded-lg p-2 text-slate-300 transition-colors hover:bg-white/10 hover:text-white" aria-label={`View ${user.name}`}><Eye className="h-4 w-4"/></button><button disabled={isCurrentUser} onClick={() => changeRole({ id: user.id, name: user.name, grant: !isAdmin })} className={`rounded-lg p-2 transition-colors disabled:cursor-not-allowed disabled:opacity-30 ${isAdmin ? 'text-rose-300 hover:bg-rose-400/10' : 'text-emerald-300 hover:bg-emerald-400/10'}`} aria-label={isAdmin ? `Revoke administrator access from ${user.name}` : `Grant administrator access to ${user.name}`}>{isAdmin ? <ShieldMinus className="h-4 w-4"/> : <ShieldCheck className="h-4 w-4"/>}</button></div></td></tr>;
  })}</tbody></table></div></div>;
}

function UserDrawer({ user, close }) { return <div className="fixed inset-0 z-[100] bg-slate-950/40" onMouseDown={event => { if (event.target === event.currentTarget) close(); }}><aside className="absolute inset-y-0 right-0 w-full max-w-md overflow-y-auto bg-white p-7 shadow-2xl"><button onClick={close} className="float-right rounded-lg border px-3 py-1">Close</button><UserRound className="h-12 w-12 text-amber-500"/><h2 className="mt-4 text-2xl font-black">{user.name}</h2><p className="text-slate-500">{user.email}</p><dl className="mt-8 grid grid-cols-2 gap-4">{[['Roles', user.roles.join(', ')], ['Instructor status', user.instructor_status || 'Not applied'], ['Courses', user.courses_count], ['Enrollments', user.enrollments_count], ['AI conversations', user.ai_conversations_count], ['Joined', new Date(user.created_at).toLocaleDateString()]].map(([label, value]) => <div key={label} className="rounded-xl bg-slate-50 p-4"><dt className="text-xs font-bold uppercase text-slate-400">{label}</dt><dd className="mt-1 font-bold">{value}</dd></div>)}</dl><p className="mt-8 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">Instructor privileges remain controlled exclusively through the instructor approval workflow.</p></aside></div>; }
export function PageHeading({ title, description, action }) { return <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><h2 className="text-3xl font-black tracking-tight">{title}</h2><p className="mt-1 text-slate-500">{description}</p></div>{action}</div>; }
