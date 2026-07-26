import DashboardShell from '../components/DashboardShell';
import InstructorStudio from '../features/instructor/InstructorStudio';
import useAuth from '../context/useAuth';
import { Navigate } from 'react-router';
import dashboardPath from '../utils/dashboardPath';
import PageBackground from '../components/PageBackground';

export default function InstructorDashboard() {
  const { user } = useAuth();
  const isApprovedInstructor = user.roles?.some(role => role.name === 'instructor')
    && user.instructor_status === 'approved';
  if (!isApprovedInstructor) return <Navigate to={dashboardPath({ ...user, roles: user.roles?.filter(role => role.name !== 'instructor') })} replace />;
  return <PageBackground variant="instructor" className="min-h-screen">
    <div className="pointer-events-none absolute right-[9%] top-28 h-48 w-72 rotate-6 rounded-[3rem] border border-blue-300/15 bg-blue-200/10" aria-hidden="true"/>
    <div className="pointer-events-none absolute bottom-32 left-[6%] h-48 w-48 rounded-full border-[24px] border-amber-300/10" aria-hidden="true"/>
    {!user.email_verified_at ? <DashboardShell user={user}/> : <DashboardShell user={user}><InstructorStudio user={user}/></DashboardShell>}
  </PageBackground>;
}
