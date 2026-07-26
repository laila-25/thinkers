import { lazy, Suspense, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router';
import Footer from '../components/Footer';
import Navbar from '../components/Navbar';
import EmailVerificationBanner from '../components/EmailVerificationBanner';

const AIChat = lazy(() => import('../features/ai/AIChat'));

export default function MainLayout() {
  const location = useLocation();
  useEffect(() => {
    const behavior = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
    const frame = window.requestAnimationFrame(() => {
      if (location.hash) document.getElementById(location.hash.slice(1))?.scrollIntoView({ behavior, block: 'start' });
      else window.scrollTo({ top: 0, behavior });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [location.pathname, location.hash]);

  useEffect(() => {
    const previous = window.history.scrollRestoration;
    window.history.scrollRestoration = 'manual';
    return () => { window.history.scrollRestoration = previous; };
  }, []);

  return (
    <div className="min-h-screen bg-[#FAFAF7]">
      <Navbar />
      <main className={location.pathname === '/' ? '' : 'pt-24'}><EmailVerificationBanner/><Outlet/></main>
      {location.pathname !== '/ai' && <Footer />}
      <Suspense fallback={null}><AIChat /></Suspense>
    </div>
  );
}
