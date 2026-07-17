import { useEffect, useState } from 'react';
import { Bell, Menu, Moon, Sun, UserRound, X } from 'lucide-react';
import { Link, NavLink, useLocation } from 'react-router';
import Button from './Button';
import useAuth from '../context/useAuth';
import useTheme from '../context/useTheme';

const links = [['Home','/'],['Courses','/courses'],['Categories','/categories'],['Contact','/contact']];

const desktopLinkClass = ({ isActive }) => `relative py-2 text-sm font-medium transition duration-200 hover:-translate-y-0.5 hover:text-slate-950 after:absolute after:inset-x-0 after:-bottom-0.5 after:h-0.5 after:origin-left after:rounded-full after:bg-amber-400 after:transition-transform ${isActive ? 'text-slate-950 after:scale-x-100' : 'text-slate-600 after:scale-x-0'}`;
const mobileLinkClass = ({ isActive }) => `block rounded-xl px-4 py-3 font-medium transition ${isActive ? 'bg-amber-50 text-slate-950' : 'text-slate-700 hover:bg-slate-50 hover:text-slate-950'}`;

export default function Navbar() {
  const [open,setOpen]=useState(false),[scrolled,setScrolled]=useState(false);
  const {isAuthenticated,user,logout}=useAuth(); const location=useLocation();
  const { isDark, toggleTheme } = useTheme();
  useEffect(()=>{const onScroll=()=>setScrolled(window.scrollY>24);onScroll();window.addEventListener('scroll',onScroll,{passive:true});return()=>window.removeEventListener('scroll',onScroll);},[]);
  useEffect(()=>setOpen(false),[location.pathname,location.hash]);
  const transparent=location.pathname==='/'&&!scrolled&&!open;
  const initials=user?.name?.split(' ').map(part=>part[0]).slice(0,2).join('').toUpperCase()||'T';
  return (
    <nav className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${transparent?'bg-transparent':'bg-white/85 shadow-[0_16px_50px_-30px_rgba(15,23,42,0.4)] backdrop-blur-2xl'}`} aria-label="Primary navigation">
      <div className="section-shell">
        <div className="flex h-24 items-center justify-between gap-6">
          <Link to="/" className="flex shrink-0 items-center gap-2.5" aria-label="Thinkers home"><img src="/logo.png" alt="" className="h-[58px] w-auto object-contain sm:h-16"/><span className="hidden text-xl font-bold tracking-[-0.03em] text-slate-950 sm:block">Thinkers</span></Link>
          <div className="hidden items-center gap-6 lg:flex">{links.map(([label,to])=><NavLink key={label} to={to} end={to === '/'} className={desktopLinkClass}>{label}</NavLink>)}</div>
          <div className="hidden items-center gap-2 lg:flex">
            <ThemeToggle isDark={isDark} toggleTheme={toggleTheme} />
            {isAuthenticated ? <>
              <Link to="/dashboard" className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:bg-slate-50">Dashboard</Link>
              <Link to="/dashboard#profile" className="rounded-full p-2 text-slate-600 transition hover:bg-slate-100 hover:text-slate-950" aria-label="Profile"><UserRound className="h-5 w-5"/></Link>
              <Link to="/dashboard#notifications" className="rounded-full p-2 text-slate-600 transition hover:bg-slate-100 hover:text-slate-950" aria-label="Notifications"><Bell className="h-5 w-5"/></Link>
              <span className="grid h-10 w-10 place-items-center rounded-full bg-[#0B132B] text-sm font-bold text-white shadow-sm" title={user.name}>{initials}</span>
              <Button size="sm" variant="secondary" onClick={logout}>Logout</Button>
            </> : <><Link to="/login"><Button size="sm" variant="secondary">Login</Button></Link><Link to="/register"><Button size="sm">Register</Button></Link></>}
          </div>
          <div className="flex items-center gap-1 lg:hidden"><ThemeToggle isDark={isDark} toggleTheme={toggleTheme} /><button className="rounded-xl p-2 text-slate-800 transition hover:bg-white/70" onClick={()=>setOpen(!open)} aria-expanded={open} aria-label="Toggle navigation">{open?<X/>:<Menu/>}</button></div>
        </div>
      </div>
      {open && <div className="border-t border-slate-100 bg-white/95 px-4 pb-6 pt-3 backdrop-blur-2xl lg:hidden"><div className="mx-auto max-w-7xl space-y-1">{links.map(([label,to])=><NavLink key={label} to={to} end={to === '/'} className={mobileLinkClass}>{label}</NavLink>)}<div className="grid grid-cols-2 gap-3 border-t border-slate-200 pt-4">{isAuthenticated?<><Link to="/dashboard"><Button className="w-full" variant="secondary">Dashboard</Button></Link><Button className="w-full" onClick={logout}>Logout</Button></>:<><Link to="/login"><Button className="w-full" variant="secondary">Login</Button></Link><Link to="/register"><Button className="w-full">Register</Button></Link></>}</div></div></div>}
    </nav>
  );
}

function ThemeToggle({ isDark, toggleTheme }) {
  return <button type="button" onClick={toggleTheme} className="grid h-10 w-10 place-items-center rounded-full border border-slate-200 bg-white/80 text-slate-700 shadow-sm transition duration-300 hover:-translate-y-0.5 hover:border-amber-300 hover:bg-amber-50 hover:text-slate-950 focus:outline-none focus:ring-4 focus:ring-amber-100" aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'} title={isDark ? 'Light mode' : 'Dark mode'}>{isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}</button>;
}
