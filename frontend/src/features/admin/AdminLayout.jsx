import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion as m } from 'framer-motion';
import { Activity, BarChart3, BookOpen, Bot, ChevronDown, FileBarChart, FolderTree, GraduationCap, LayoutDashboard, Menu, ReceiptText, Search, Settings, Users, WalletCards, X } from 'lucide-react';
import { Link, NavLink, Outlet, useLocation } from 'react-router';
import { useTranslation } from 'react-i18next';
import useAuth from '../../context/useAuth';
import { ToastProvider } from './AdminUI';
import PageBackground from '../../components/PageBackground';
import NotificationCenter from '../notifications/NotificationCenter';
import EmailVerificationBanner from '../../components/EmailVerificationBanner';

const navigation = [
  ['dashboard', '/admin', LayoutDashboard], ['users', '/admin/users', Users], ['courses', '/admin/courses', BookOpen],
  ['instructors', '/admin/instructors', GraduationCap], ['categories', '/admin/categories', FolderTree],
  ['revenue', '/admin/revenue', WalletCards], ['orders', '/admin/orders', ReceiptText], ['activity', '/admin/activity', Activity],
  ['ai', '/admin/ai-usage', Bot], ['reports', '/admin/reports', FileBarChart], ['settings', '/admin/settings', Settings],
];

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const { user, logout } = useAuth();
  const { t } = useTranslation('admin');
  const location = useLocation();
  const profileRef = useRef(null);
  const current = navigation.find(([, path]) => path === location.pathname)
    || navigation.find(([, path]) => path !== '/admin' && location.pathname.startsWith(path))
    || navigation[0];

  useEffect(() => {
    setSidebarOpen(false);
    setProfileOpen(false);
  }, [location.pathname]);
  useEffect(() => {
    const close = event => { if (!profileRef.current?.contains(event.target)) setProfileOpen(false); };
    document.addEventListener('pointerdown', close);
    return () => document.removeEventListener('pointerdown', close);
  }, []);

  return <ToastProvider><PageBackground variant="admin" className="min-h-screen text-slate-900 dark:text-slate-100"><div className="min-h-screen bg-transparent">
    <Sidebar open={sidebarOpen} close={() => setSidebarOpen(false)} t={t}/>
    <div className="lg:pl-72">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur-xl dark:border-slate-700 dark:bg-slate-950/88"><div className="flex h-20 items-center gap-4 px-4 sm:px-6 lg:px-8">
        <button onClick={() => setSidebarOpen(true)} className="rounded-xl border p-2 lg:hidden" aria-label="Open navigation"><Menu className="h-5 w-5"/></button>
        <div className="hidden min-w-0 flex-1 sm:block"><p className="text-xs font-bold uppercase tracking-[.18em] text-amber-600">Admin / {t(`nav.${current[0]}`)}</p><h1 className="truncate text-xl font-extrabold">{t(`nav.${current[0]}`)}</h1></div>
        <div className="relative ml-auto hidden max-w-sm flex-1 md:block"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"/><input aria-label="Search admin" placeholder={t('search')} className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-amber-400 focus:ring-4 focus:ring-amber-100 dark:border-slate-700 dark:bg-slate-900"/></div>
        <NotificationCenter/>
        <div ref={profileRef} className="relative"><button onClick={() => setProfileOpen(value => !value)} className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-1.5 pr-3 dark:border-slate-700 dark:bg-slate-900"><span className="grid h-9 w-9 place-items-center rounded-lg bg-[#F5C542] text-xs font-black text-slate-950">{initials(user?.name)}</span><span className="hidden text-left sm:block"><strong className="block max-w-28 truncate text-sm">{user?.name}</strong><small className="text-slate-500">{t('administrator')}</small></span><ChevronDown className="h-4 w-4 text-slate-400"/></button>{profileOpen && <div className="absolute right-0 mt-3 w-56 rounded-2xl border bg-white p-2 shadow-2xl dark:border-slate-700 dark:bg-slate-900"><Link to="/" className="block rounded-xl px-3 py-2 text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800">{t('viewPlatform')}</Link><button onClick={logout} className="block w-full rounded-xl px-3 py-2 text-left text-sm font-semibold text-red-600 hover:bg-red-50">{t('signOut')}</button></div>}</div>
      </div></header>
      <main className="px-4 py-7 sm:px-6 lg:px-8"><div className="mx-auto max-w-[100rem]">{user?.email_verified_at ? <Outlet/> : <AdminVerificationGate/>}</div></main>
    </div>
  </div></PageBackground></ToastProvider>;
}

function AdminVerificationGate() {
  return <div className="mx-auto max-w-4xl pt-6">
    <EmailVerificationBanner/>
  </div>;
}

function Sidebar({ open, close, t }) {
  return <><AnimatePresence>{open && <m.button aria-label="Close navigation" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={close} className="fixed inset-0 z-50 bg-slate-950/55 lg:hidden"/>}</AnimatePresence><aside className={`fixed inset-y-0 left-0 z-[60] flex w-72 flex-col bg-[#0B132B] text-white shadow-2xl transition-transform duration-300 lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}><div className="flex h-20 items-center justify-between border-b border-white/10 px-6"><Link to="/admin" className="flex items-center gap-3"><img src="/logo.png" className="h-11 w-11 object-contain" alt=""/><div><strong className="block tracking-tight">Thinkers</strong><small className="text-slate-400">{t('workspace')}</small></div></Link><button onClick={close} className="lg:hidden" aria-label="Close navigation"><X/></button></div><nav className="flex-1 space-y-1 overflow-y-auto p-4">{navigation.map(([label, path, Icon]) => <NavLink key={path} to={path} end={path === '/admin'} className={({ isActive }) => `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold transition ${isActive ? 'bg-[#F5C542] text-[#0B132B] shadow-lg' : 'text-slate-300 hover:bg-white/10 hover:text-white'}`}><Icon className="h-5 w-5"/>{t(`nav.${label}`)}</NavLink>)}</nav><div className="border-t border-white/10 p-4"><div className="rounded-2xl bg-white/5 p-4"><BarChart3 className="h-5 w-5 text-amber-300"/><p className="mt-2 text-sm font-bold">Thinkers intelligence</p></div></div></aside></>;
}

const initials = name => name?.split(' ').map(part => part[0]).slice(0, 2).join('').toUpperCase() || 'A';
