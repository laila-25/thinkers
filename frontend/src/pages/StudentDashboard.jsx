import DashboardShell from '../components/DashboardShell';
import { StudentDashboard as DashboardContent } from '../components/RoleDashboards';
import useAuth from '../context/useAuth';
import PageBackground from '../components/PageBackground';

export default function StudentDashboard() {
  const { user, refreshUser } = useAuth();
  return <PageBackground variant="student" className="min-h-screen">
    <div className="pointer-events-none absolute left-[8%] top-20 h-40 w-40 rounded-full border border-amber-300/20 bg-amber-200/10 blur-sm" aria-hidden="true"/>
    <div className="pointer-events-none absolute right-[7%] top-1/3 h-52 w-52 rounded-full border-[28px] border-sky-200/10" aria-hidden="true"/>
    {!user.email_verified_at ? <DashboardShell user={user}/> : <DashboardShell user={user}><DashboardContent user={user} refreshUser={refreshUser}/></DashboardShell>}
  </PageBackground>;
}
