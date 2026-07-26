import { useCallback, useEffect, useRef, useState } from 'react';
import { Bell, CheckCheck, Settings } from 'lucide-react';
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import NotificationItem from './NotificationItem';
import { notificationService } from './notificationService';

const buttonClass = 'relative grid h-10 w-10 place-items-center rounded-xl border border-slate-200/80 bg-white/80 text-slate-600 shadow-sm backdrop-blur-xl transition hover:border-amber-300 hover:text-slate-950 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-300/30 motion-reduce:transition-none dark:border-slate-700 dark:bg-slate-900/75 dark:text-slate-300';

export default function NotificationCenter() {
  const { t } = useTranslation('notifications');
  const [open, setOpen] = useState(false);
  const [state, setState] = useState({ items: [], unread: 0, loading: true, error: false });
  const root = useRef(null);
  const heading = useRef(null);

  useEffect(() => notificationService.subscribe((payload, error) => {
    if (error) setState(current => ({ ...current, loading: false, error: true }));
    else if (payload) setState({ items: payload.data, unread: payload.meta.unread_count, loading: false, error: false });
  }), []);
  useEffect(() => {
    if (open) requestAnimationFrame(() => heading.current?.focus());
    const close = event => {
      if (event.key === 'Escape' || (event.type === 'pointerdown' && !root.current?.contains(event.target))) setOpen(false);
    };
    document.addEventListener('keydown', close); document.addEventListener('pointerdown', close);
    return () => { document.removeEventListener('keydown', close); document.removeEventListener('pointerdown', close); };
  }, [open]);

  const read = useCallback(async id => {
    const previous = state;
    setState(current => ({ ...current, unread: Math.max(0, current.unread - 1), items: current.items.map(item => item.id === id ? { ...item, read_at: new Date().toISOString() } : item) }));
    try { await notificationService.markRead(id); } catch { setState(previous); }
  }, [state]);
  const readAll = async () => {
    const previous = state;
    setState(current => ({ ...current, unread: 0, items: current.items.map(item => ({ ...item, read_at: item.read_at || new Date().toISOString() })) }));
    try { await notificationService.markAllRead(); } catch { setState(previous); }
  };

  return <div ref={root} className="relative">
    <button type="button" className={buttonClass} aria-label={t('bell', { count: state.unread })} aria-haspopup="dialog" aria-expanded={open} onClick={() => setOpen(value => !value)}><Bell className="h-[18px] w-[18px]"/>{state.unread > 0 && <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-rose-600 px-1 text-center text-[10px] font-black leading-5 text-white" aria-live="polite">{state.unread > 99 ? '99+' : state.unread}</span>}</button>
    {open && <section role="dialog" aria-modal="false" aria-labelledby="notification-panel-title" className="absolute end-0 top-full z-[80] mt-3 w-[min(92vw,25rem)] rounded-3xl border border-white/80 bg-white/95 p-3 shadow-[0_28px_80px_-25px_rgba(15,23,42,.65)] backdrop-blur-2xl dark:border-slate-700 dark:bg-slate-900/95">
      <header className="flex items-center justify-between gap-3 px-2 py-2"><div><h2 ref={heading} tabIndex="-1" id="notification-panel-title" className="font-black text-slate-950 outline-none dark:text-white">{t('title')}</h2><p className="text-xs text-slate-500">{t('unread', { count: state.unread })}</p></div><div className="flex gap-1"><button type="button" onClick={readAll} disabled={!state.unread} className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 disabled:opacity-40 dark:hover:bg-slate-800" aria-label={t('markAll')}><CheckCheck className="h-5 w-5"/></button><Link to="/notifications?settings=1" onClick={() => setOpen(false)} className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800" aria-label={t('settings')}><Settings className="h-5 w-5"/></Link></div></header>
      <div className="max-h-[26rem] space-y-1 overflow-y-auto overscroll-contain">{state.loading ? <Skeleton/> : state.error ? <div className="rounded-2xl bg-rose-50 p-5 text-center text-sm text-rose-700">{t('error')}</div> : state.items.length ? state.items.map(item => <NotificationItem key={item.id} item={item} onRead={read} compact/>) : <div className="rounded-2xl border border-dashed p-8 text-center text-sm text-slate-500">{t('empty')}</div>}</div>
      <Link to="/notifications" onClick={() => setOpen(false)} className="mt-2 block rounded-xl py-2 text-center text-sm font-black text-amber-700 hover:bg-amber-50 dark:text-amber-300 dark:hover:bg-amber-400/10">{t('viewAll')}</Link>
    </section>}
  </div>;
}
const Skeleton = () => <div className="space-y-2 p-1">{[1,2,3].map(item => <div key={item} className="h-20 animate-pulse rounded-2xl bg-slate-100 motion-reduce:animate-none dark:bg-slate-800"/>)}</div>;
