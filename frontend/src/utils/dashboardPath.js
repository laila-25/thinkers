export default function dashboardPath(user) {
  const roles = user?.roles?.map(role => role.name) || [];
  if (roles.includes('admin')) return '/admin';
  if (roles.includes('instructor')) return '/instructor/dashboard';
  return '/student/dashboard';
}
