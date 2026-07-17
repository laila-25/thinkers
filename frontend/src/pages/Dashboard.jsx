import useAuth from '../context/useAuth';
import { AdminDashboard, InstructorDashboard, StudentDashboard } from '../components/RoleDashboards';

export default function Dashboard() {
  const { user, refreshUser } = useAuth();
  const roles = user.roles?.map(role => role.name) || [];
  const content = roles.includes('admin')
    ? <AdminDashboard />
    : roles.includes('instructor')
      ? <InstructorDashboard user={user} />
      : <StudentDashboard user={user} refreshUser={refreshUser} />;

  return <section className="page-section min-h-screen bg-transparent"><div className="section-shell"><div className="panel p-6 sm:p-8">{content}</div><div className="mt-8 grid gap-6 md:grid-cols-2"><section id="profile" className="soft-card p-6"><h2 className="text-xl font-bold tracking-[-0.03em] text-slate-950">Profile</h2><dl className="mt-5 space-y-3 text-sm"><div><dt className="text-slate-500">Name</dt><dd className="font-semibold text-slate-900">{user.name}</dd></div><div><dt className="text-slate-500">Email</dt><dd className="font-semibold text-slate-900">{user.email}</dd></div></dl></section><section id="notifications" className="soft-card p-6"><h2 className="text-xl font-bold tracking-[-0.03em] text-slate-950">Notifications</h2><p className="mt-5 rounded-2xl bg-slate-50 p-5 text-sm text-slate-500">You have no new notifications.</p></section></div></div></section>;
}
