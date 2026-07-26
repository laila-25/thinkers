import { lazy, Suspense } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router';
import { AuthProvider } from './context/AuthContext';
import ErrorBoundary from './components/ErrorBoundary';
import GuestRoute from './components/GuestRoute';
import LoadingFallback from './components/LoadingFallback';
import OfflineBanner from './components/OfflineBanner';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import RouteMetadata from './components/RouteMetadata';
import MainLayout from './layouts/MainLayout';
import Home from './pages/Home';

const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Courses = lazy(() => import('./pages/Courses'));
const CourseDetails = lazy(() => import('./pages/CourseDetails'));
const InstructorCurriculum = lazy(() => import('./pages/InstructorCurriculum'));
const CourseBuilder = lazy(() => import('./pages/CourseBuilder'));
const CoursePlayer = lazy(() => import('./pages/CoursePlayer'));
const Checkout = lazy(() => import('./pages/Checkout'));
const LessonPreview = lazy(() => import('./pages/LessonPreview'));
const Categories = lazy(() => import('./pages/Categories'));
const Contact = lazy(() => import('./pages/Contact'));
const About = lazy(() => import('./pages/About'));
const StudentDashboard = lazy(() => import('./pages/StudentDashboard'));
const InstructorDashboard = lazy(() => import('./pages/InstructorDashboard'));
const NotFound = lazy(() => import('./pages/NotFound'));
const VerifyEmail = lazy(() => import('./pages/VerifyEmail'));
const VerifyCertificate = lazy(() => import('./pages/VerifyCertificate'));
const Certificates = lazy(() => import('./pages/Certificates'));
const Notifications = lazy(() => import('./pages/Notifications'));
const AIPage = lazy(() => import('./features/ai/AIPage'));
const AdminLayout = lazy(() => import('./features/admin/AdminLayout'));
const AdminDashboardPage = lazy(() => import('./features/admin/AdminDashboardPage'));
const AdminUsersPage = lazy(() => import('./features/admin/AdminUsersPage'));
const AdminCoursesPage = lazy(() => import('./features/admin/AdminCoursesPage'));
const AdminInstructorsPage = lazy(() => import('./features/admin/AdminInstructorsPage'));
const AdminCategoriesPage = lazy(() => import('./features/admin/AdminCategoriesPage'));
const AdminAiUsagePage = lazy(() => import('./features/admin/AdminAiUsagePage'));
const AdminReportsPage = lazy(() => import('./features/admin/AdminReportsPage'));
const AdminSettingsPage = lazy(() => import('./features/admin/AdminSettingsPage'));
const AdminRevenuePage = lazy(() => import('./features/admin/AdminRevenuePage'));
const AdminOrdersPage = lazy(() => import('./features/admin/AdminOrdersPage'));
const AdminActivityPage = lazy(() => import('./features/admin/AdminActivityPage'));

export default function App() {
  return <ErrorBoundary><BrowserRouter><RouteMetadata/><OfflineBanner/><AuthProvider><Suspense fallback={<LoadingFallback/>}><Routes>
    <Route path="/" element={<MainLayout/>}>
      <Route index element={<Home/>}/><Route path="courses" element={<Courses/>}/><Route path="courses/:slug" element={<CourseDetails/>}/>
      <Route path="categories" element={<Categories/>}/><Route path="about" element={<About/>}/><Route path="contact" element={<Contact/>}/>
      <Route path="verify-email" element={<VerifyEmail/>}/>
      <Route path="verify/:code" element={<VerifyCertificate/>}/>
      <Route path="preview/lessons/:lessonId" element={<LessonPreview/>}/>
      <Route element={<GuestRoute/>}><Route path="login" element={<Login/>}/><Route path="register" element={<Register/>}/></Route>
      <Route element={<ProtectedRoute/>}><Route path="dashboard" element={<Dashboard/>}/><Route path="student/dashboard" element={<StudentDashboard/>}/><Route path="certificates" element={<Certificates/>}/><Route path="notifications" element={<Notifications/>}/><Route path="checkout/:courseId" element={<Checkout/>}/><Route path="instructor/dashboard" element={<InstructorDashboard/>}/><Route path="instructor/courses/new" element={<CourseBuilder/>}/><Route path="instructor/courses/:courseId/builder" element={<CourseBuilder/>}/><Route path="instructor/courses/:courseId/curriculum" element={<InstructorCurriculum/>}/><Route path="learn/:enrollmentId" element={<CoursePlayer/>}/><Route path="learn/:enrollmentId/lessons/:lessonId" element={<CoursePlayer/>}/><Route path="ai" element={<AIPage/>}/></Route>
      <Route path="*" element={<NotFound/>}/>
    </Route>
    <Route element={<ProtectedRoute/>}>
      <Route element={<AdminRoute/>}>
        <Route path="/admin" element={<AdminLayout/>}>
          <Route index element={<AdminDashboardPage/>}/>
          <Route path="users" element={<AdminUsersPage/>}/>
          <Route path="courses" element={<AdminCoursesPage/>}/>
          <Route path="instructors" element={<AdminInstructorsPage/>}/>
          <Route path="categories" element={<AdminCategoriesPage/>}/>
          <Route path="ai-usage" element={<AdminAiUsagePage/>}/>
          <Route path="reports" element={<AdminReportsPage/>}/>
          <Route path="revenue" element={<AdminRevenuePage/>}/>
          <Route path="orders" element={<AdminOrdersPage/>}/>
          <Route path="activity" element={<AdminActivityPage/>}/>
          <Route path="settings" element={<AdminSettingsPage/>}/>
        </Route>
      </Route>
    </Route>
  </Routes></Suspense></AuthProvider></BrowserRouter></ErrorBoundary>;
}
