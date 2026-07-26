import { useEffect, useRef, useState } from 'react';
import { Bell, Check, ChevronDown, Languages, LogOut, Menu, Moon, Sun, UserRound, X } from 'lucide-react';
import { Link, NavLink, useLocation } from 'react-router';
import { useTranslation } from 'react-i18next';
import Button from './Button';
import useAuth from '../context/useAuth';
import dashboardPath from '../utils/dashboardPath';
import useTheme from '../context/useTheme';
import useLanguage from '../context/useLanguage';
import NotificationCenter from '../features/notifications/NotificationCenter';

const links = [['home', '/'], ['courses', '/courses'], ['categories', '/categories'], ['about', '/about'], ['contact', '/contact']];
const focusRing = 'focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-300/30';
const iconButton = `grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-slate-200/80 bg-white/80 text-slate-600 shadow-[0_8px_24px_-18px_rgba(15,23,42,.65)] backdrop-blur-xl transition-[transform,border-color,background-color,color,box-shadow] duration-200 hover:-translate-y-0.5 hover:border-amber-300 hover:bg-amber-50 hover:text-slate-950 motion-reduce:transform-none motion-reduce:transition-none dark:border-slate-700/80 dark:bg-slate-900/75 dark:text-slate-300 dark:hover:border-amber-400/70 dark:hover:bg-slate-800 dark:hover:text-white ${focusRing}`;

function useDismiss(open, close, rootRef) {
  useEffect(() => {
    if (!open) return undefined;
    const dismiss = event => {
      if (event.type === 'keydown' && event.key !== 'Escape') return;
      if (event.type === 'pointerdown' && rootRef.current?.contains(event.target)) return;
      close();
    };
    document.addEventListener('pointerdown', dismiss);
    document.addEventListener('keydown', dismiss);
    return () => {
      document.removeEventListener('pointerdown', dismiss);
      document.removeEventListener('keydown', dismiss);
    };
  }, [close, open, rootRef]);
}

function ThemeToggle({ compact = false }) {
  const { isDark, toggleTheme } = useTheme();
  const { t } = useTranslation();
  const label = t(isDark ? 'theme.light' : 'theme.dark');

  return <button type="button" onClick={toggleTheme} aria-label={label} aria-pressed={isDark} title={label} className={compact ? iconButton : `group flex h-10 items-center gap-2 rounded-xl border border-slate-200/80 bg-white/80 px-3 text-sm font-bold text-slate-700 shadow-sm backdrop-blur-xl transition duration-200 hover:-translate-y-0.5 hover:border-amber-300 hover:bg-amber-50 motion-reduce:transform-none dark:border-slate-700/80 dark:bg-slate-900/75 dark:text-slate-200 dark:hover:bg-slate-800 ${focusRing}`}>
    <span className="relative grid h-5 w-5 place-items-center" aria-hidden="true">
      <Sun className={`absolute h-[18px] w-[18px] text-amber-500 transition-[opacity,transform] duration-200 motion-reduce:transition-none ${isDark ? 'rotate-90 scale-75 opacity-0' : 'rotate-0 scale-100 opacity-100'}`}/>
      <Moon className={`absolute h-[17px] w-[17px] text-amber-300 transition-[opacity,transform] duration-200 motion-reduce:transition-none ${isDark ? 'rotate-0 scale-100 opacity-100' : '-rotate-90 scale-75 opacity-0'}`}/>
    </span>
    {!compact && <span>{label}</span>}
  </button>;
}

function LanguageSwitcher({ align = 'right' }) {
  const { language, setLanguage } = useLanguage();
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  useDismiss(open, () => setOpen(false), rootRef);
  const languages = [
    { code: 'en', short: t('language.enShort'), label: t('language.english') },
    { code: 'ar', short: t('language.arShort'), label: t('language.arabic') },
  ];
  const active = languages.find(item => item.code === language) || languages[0];

  return <div ref={rootRef} className="relative" dir="ltr">
    <button type="button" onClick={() => setOpen(value => !value)} aria-haspopup="listbox" aria-expanded={open} aria-label={t('language.current', { language: active.label })} className={`flex h-10 items-center gap-2 rounded-xl border border-slate-200/80 bg-white/80 px-3 text-sm font-extrabold text-slate-700 shadow-sm backdrop-blur-xl transition duration-200 hover:-translate-y-0.5 hover:border-amber-300 hover:bg-amber-50 motion-reduce:transform-none dark:border-slate-700/80 dark:bg-slate-900/75 dark:text-slate-200 dark:hover:bg-slate-800 ${focusRing}`}>
      <Languages className="h-4 w-4 text-amber-600"/><span>{active.short}</span><ChevronDown className={`h-3.5 w-3.5 text-slate-400 transition-transform duration-200 motion-reduce:transition-none ${open ? 'rotate-180' : ''}`}/>
    </button>
    {open && <div className={`absolute ${align === 'left' ? 'left-0' : 'right-0'} top-full z-[70] mt-3 w-52 overflow-hidden rounded-2xl border border-white/80 bg-white/95 p-2 shadow-[0_24px_65px_-22px_rgba(15,23,42,.55)] backdrop-blur-2xl dark:border-slate-700/80 dark:bg-slate-900/95`} role="listbox" aria-label={t('language.label')}>
      <p className="px-3 pb-2 pt-1 text-[10px] font-extrabold uppercase tracking-[.18em] text-slate-400">{t('language.label')}</p>
      {languages.map(item => <button key={item.code} type="button" role="option" aria-selected={language === item.code} onClick={() => { setLanguage(item.code); setOpen(false); }} className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-bold transition-colors ${language === item.code ? 'bg-amber-50 text-slate-950 dark:bg-amber-400/15 dark:text-amber-100' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white'} ${focusRing}`}>
        <span className="grid h-7 w-8 place-items-center rounded-lg bg-slate-100 text-[11px] font-black dark:bg-slate-800">{item.short}</span><span className="flex-1">{item.label}</span>{language === item.code && <Check className="h-4 w-4 text-amber-600"/>}
      </button>)}
    </div>}
  </div>;
}

function Avatar({ user, size = 'md' }) {
  const image = user?.avatar_url || user?.profile_photo_url || user?.avatar;
  const initials = user?.name?.split(' ').filter(Boolean).map(part => part[0]).slice(0, 2).join('').toUpperCase() || 'T';
  const sizeClass = size === 'lg' ? 'h-11 w-11 rounded-xl text-sm' : 'h-9 w-9 rounded-lg text-xs';
  return image
    ? <img src={image} alt="" width={44} height={44} loading="lazy" decoding="async" className={`${sizeClass} object-cover ring-1 ring-slate-200 dark:ring-slate-700`}/>
    : <span className={`grid ${sizeClass} place-items-center bg-[#F5C542] font-black text-[#0B132B] shadow-[0_8px_22px_-12px_rgba(183,121,31,.8)]`} aria-hidden="true">{initials}</span>;
}

function ProfileMenu({ user, dashboard, logout }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  useDismiss(open, () => setOpen(false), rootRef);

  return <div ref={rootRef} className="relative">
    <button type="button" onClick={() => setOpen(value => !value)} aria-label={t('nav.profile')} aria-haspopup="menu" aria-expanded={open} className={`flex h-11 items-center gap-2 rounded-xl border border-slate-200/80 bg-white/80 p-1 pr-2 shadow-sm backdrop-blur-xl transition duration-200 hover:-translate-y-0.5 hover:border-amber-300 motion-reduce:transform-none dark:border-slate-700/80 dark:bg-slate-900/75 ${focusRing}`}>
      <Avatar user={user}/><span className="hidden max-w-24 truncate text-sm font-bold text-slate-800 2xl:block dark:text-slate-100">{user?.name}</span><ChevronDown className={`h-3.5 w-3.5 text-slate-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}/>
    </button>
    {open && <div role="menu" className="absolute right-0 top-full z-[70] mt-3 w-72 overflow-hidden rounded-2xl border border-white/80 bg-white/95 p-2 shadow-[0_26px_70px_-24px_rgba(15,23,42,.6)] backdrop-blur-2xl dark:border-slate-700/80 dark:bg-slate-900/95">
      <div className="flex items-center gap-3 border-b border-slate-100 px-3 py-3 dark:border-slate-800"><Avatar user={user} size="lg"/><div className="min-w-0"><strong className="block truncate text-sm text-slate-950 dark:text-white">{user?.name}</strong><span className="block truncate text-xs text-slate-500 dark:text-slate-400">{user?.email}</span></div></div>
      <Link role="menuitem" to={dashboard} onClick={() => setOpen(false)} className={`mt-2 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-50 hover:text-slate-950 dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-white ${focusRing}`}><UserRound className="h-4 w-4 text-slate-400"/>{t('nav.dashboard')}</Link>
      <Link role="menuitem" to={`${dashboard}#profile`} onClick={() => setOpen(false)} className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-50 hover:text-slate-950 dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-white ${focusRing}`}><UserRound className="h-4 w-4 text-slate-400"/>{t('nav.profile')}</Link>
      <button role="menuitem" type="button" onClick={logout} className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-bold text-rose-600 transition-colors hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/40 ${focusRing}`}><LogOut className="h-4 w-4"/>{t('nav.logout')}</button>
    </div>}
  </div>;
}

const desktopLinkClass = ({ isActive }) => `group relative rounded-lg px-1.5 py-2 text-sm font-semibold transition-colors duration-200 ${focusRing} ${isActive ? 'text-slate-950 dark:text-white' : 'text-slate-600 hover:text-slate-950 dark:text-slate-300 dark:hover:text-white'} after:absolute after:inset-x-1.5 after:-bottom-0.5 after:h-0.5 after:origin-center after:rounded-full after:bg-[#F5C542] after:transition-transform after:duration-200 after:content-[''] motion-reduce:after:transition-none ${isActive ? 'after:scale-x-100' : 'after:scale-x-0 hover:after:scale-x-100'}`;

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const menuButtonRef = useRef(null);
  const drawerRef = useRef(null);
  const { isAuthenticated, user, logout } = useAuth();
  const { t } = useTranslation();
  const { isRtl } = useLanguage();
  const location = useLocation();

  useEffect(() => {
    let frame = 0;
    const update = () => { frame = 0; setScrolled(value => { const next = window.scrollY > 20; return value === next ? value : next; }); };
    const onScroll = () => { if (!frame) frame = window.requestAnimationFrame(update); };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => { window.removeEventListener('scroll', onScroll); if (frame) window.cancelAnimationFrame(frame); };
  }, []);

  useEffect(() => setMobileOpen(false), [location.pathname, location.hash]);
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    if (mobileOpen) window.requestAnimationFrame(() => drawerRef.current?.querySelector('[data-mobile-first]')?.focus());
    const close = event => { if (event.key === 'Escape') { setMobileOpen(false); menuButtonRef.current?.focus(); } };
    document.addEventListener('keydown', close);
    return () => { document.body.style.overflow = ''; document.removeEventListener('keydown', close); };
  }, [mobileOpen]);

  const dashboard = dashboardPath(user);

  return <>
    <nav className={`fixed inset-x-0 top-0 z-50 border-b transition-[background-color,border-color,box-shadow] duration-300 motion-reduce:transition-none ${scrolled ? 'border-slate-200/80 bg-white/85 shadow-[0_16px_45px_-28px_rgba(15,23,42,.38)] backdrop-blur-2xl dark:border-slate-700/70 dark:bg-[#080f1d]/88' : 'border-transparent bg-white/70 backdrop-blur-xl dark:bg-[#080f1d]/72'}`} aria-label={t('nav.primary')}>
      <div className={`section-shell flex items-center justify-between gap-4 transition-[height] duration-300 motion-reduce:transition-none ${scrolled ? 'h-[4.5rem]' : 'h-24'}`}>
        <Link to="/" className={`group flex shrink-0 items-center gap-2.5 rounded-xl ${focusRing}`} aria-label={t('nav.homeLabel')}>
          <span className={`navbar-logo group-hover:scale-[1.03] motion-reduce:transform-none motion-reduce:transition-none ${scrolled ? 'h-9 w-9 sm:h-11 sm:w-11' : 'h-10 w-10 sm:h-12 sm:w-12'}`} aria-hidden="true">
            <span className="navbar-logo-crop">
              <img src="/logo.png" alt="" decoding="async" fetchPriority="high" width="112" height="112" className="navbar-logo-image"/>
            </span>
          </span>
          <span className="hidden text-lg font-black tracking-[-0.04em] text-[#0B132B] sm:block dark:text-white">{t('brand')}</span>
        </Link>

        <div className="hidden items-center gap-6 xl:flex">{links.map(([key, to]) => <NavLink key={key} to={to} end={to === '/'} className={desktopLinkClass}>{t(`nav.${key}`)}</NavLink>)}</div>

        <div className="hidden items-center gap-2 xl:flex">
          <LanguageSwitcher/><ThemeToggle compact/>
          {isAuthenticated ? <>
            <NotificationCenter/>
            <ProfileMenu user={user} dashboard={dashboard} logout={logout}/>
          </> : <>
            <Link to="/login" className={`rounded-xl px-3 py-2 text-sm font-bold text-slate-700 transition-colors hover:text-slate-950 dark:text-slate-200 dark:hover:text-white ${focusRing}`}>{t('nav.login')}</Link>
            <Link to="/register"><Button size="sm" variant="accent" className="rounded-xl px-5 shadow-[0_12px_28px_-14px_rgba(183,121,31,.75)] transition-transform hover:-translate-y-0.5 motion-reduce:transform-none">{t('nav.register')}</Button></Link>
          </>}
        </div>

        <div className="flex items-center gap-2 xl:hidden"><LanguageSwitcher/><ThemeToggle compact/>{isAuthenticated && <NotificationCenter/>}<button ref={menuButtonRef} type="button" onClick={() => setMobileOpen(value => !value)} className={iconButton} aria-expanded={mobileOpen} aria-controls="mobile-navigation" aria-label={t('nav.menu')}>{mobileOpen ? <X className="h-5 w-5"/> : <Menu className="h-5 w-5"/>}</button></div>
      </div>
    </nav>

    <div className={`fixed inset-0 z-40 bg-slate-950/45 backdrop-blur-[2px] transition-opacity duration-300 motion-reduce:transition-none xl:hidden ${mobileOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'}`} onClick={() => setMobileOpen(false)} aria-hidden="true"/>
    <aside ref={drawerRef} id="mobile-navigation" role="dialog" aria-modal="true" aria-label={t('nav.primary')} aria-hidden={!mobileOpen} inert={!mobileOpen} className={`fixed bottom-0 top-0 z-[45] flex w-[min(88vw,24rem)] flex-col border-white/70 bg-white/95 px-5 pb-6 pt-28 backdrop-blur-2xl transition-transform duration-300 ease-out motion-reduce:transition-none dark:border-slate-700 dark:bg-[#0a1323]/96 xl:hidden ${isRtl ? `left-0 border-r shadow-[24px_0_70px_-35px_rgba(15,23,42,.65)] ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}` : `right-0 border-l shadow-[-24px_0_70px_-35px_rgba(15,23,42,.65)] ${mobileOpen ? 'translate-x-0' : 'translate-x-full'}`}`}>
      <div className="flex-1 overflow-y-auto overscroll-contain">
        {isAuthenticated && <div className="mb-5 flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50/80 p-3 dark:border-slate-700 dark:bg-slate-800/70"><Avatar user={user} size="lg"/><div className="min-w-0"><strong className="block truncate text-sm text-slate-950 dark:text-white">{user?.name}</strong><span className="block truncate text-xs text-slate-500 dark:text-slate-400">{user?.email}</span></div></div>}
        <div className="space-y-1">{links.map(([key, to], index) => <NavLink data-mobile-first={index === 0 ? '' : undefined} key={key} to={to} end={to === '/'} className={({ isActive }) => `flex items-center justify-between rounded-xl px-4 py-3.5 font-bold transition-colors ${focusRing} ${isActive ? 'bg-amber-50 text-slate-950 dark:bg-amber-400/15 dark:text-amber-100' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white'}`}>{t(`nav.${key}`)}<span className={`h-1.5 w-1.5 rounded-full bg-amber-500 ${location.pathname === to ? 'opacity-100' : 'opacity-0'}`}/></NavLink>)}</div>
        {isAuthenticated && <div className="mt-5 space-y-1 border-t border-slate-200 pt-5 dark:border-slate-700"><Link to={dashboard} className={`flex items-center gap-3 rounded-xl px-4 py-3 font-bold text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800 ${focusRing}`}><UserRound className="h-5 w-5 text-amber-600"/>{t('nav.dashboard')}</Link><Link to="/notifications" className={`flex items-center gap-3 rounded-xl px-4 py-3 font-bold text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800 ${focusRing}`}><Bell className="h-5 w-5 text-amber-600"/>{t('nav.notifications')}</Link></div>}
      </div>
      <div className="mt-5 border-t border-slate-200 pt-5 dark:border-slate-700">{isAuthenticated ? <button type="button" onClick={logout} className={`flex w-full items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 font-bold text-rose-600 transition-colors hover:bg-rose-100 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-400 ${focusRing}`}><LogOut className="h-4 w-4"/>{t('nav.logout')}</button> : <div className="grid grid-cols-2 gap-3"><Link to="/login"><Button className="w-full rounded-xl" variant="secondary">{t('nav.login')}</Button></Link><Link to="/register"><Button className="w-full rounded-xl" variant="accent">{t('nav.register')}</Button></Link></div>}</div>
    </aside>
  </>;
}
