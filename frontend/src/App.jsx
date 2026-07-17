import { BrowserRouter, Routes, Route, useLocation } from 'react-router';
import { Helmet } from 'react-helmet-async';
import MainLayout from './layouts/MainLayout';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Courses from './pages/Courses';
import CourseDetails from './pages/CourseDetails';
import GuestRoute from './components/GuestRoute';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';
import InstructorCurriculum from './pages/InstructorCurriculum';
import CoursePlayer from './pages/CoursePlayer';
import LessonPreview from './pages/LessonPreview';
import Categories from './pages/Categories';
import Contact from './pages/Contact';
import PageLoadingTransition from './components/PageLoadingTransition';

const pageTitles = {
  '/': 'Home',
  '/courses': 'Courses',
  '/categories': 'Categories',
  '/contact': 'Contact',
  '/dashboard': 'Dashboard',
  '/login': 'Login',
  '/register': 'Register',
  '/profile': 'Profile',
};

function RouteTitle() {
  const { pathname } = useLocation();
  const pageTitle = pageTitles[pathname];

  return pageTitle ? (
    <Helmet>
      <title>{`Thinkers | ${pageTitle}`}</title>
    </Helmet>
  ) : null;
}

function App() {
  return (
    <BrowserRouter>
      <RouteTitle />
      <PageLoadingTransition />
      <AuthProvider>
        <Routes>
          <Route path="/" element={<MainLayout />}>
            <Route index element={<Home />} />
            <Route path="courses" element={<Courses />} />
            <Route path="courses/:slug" element={<CourseDetails />} />
            <Route path="categories" element={<Categories />} />
            <Route path="contact" element={<Contact />} />
            <Route path="preview/lessons/:lessonId" element={<LessonPreview />} />
            <Route element={<GuestRoute />}>
              <Route path="login" element={<Login />} />
              <Route path="register" element={<Register />} />
            </Route>
            <Route element={<ProtectedRoute />}>
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="instructor/courses/:courseId/curriculum" element={<InstructorCurriculum />} />
              <Route path="learn/:enrollmentId" element={<CoursePlayer />} />
              <Route path="learn/:enrollmentId/lessons/:lessonId" element={<CoursePlayer />} />
            </Route>
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
