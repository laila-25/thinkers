import { useCallback, useEffect, useRef, useState } from 'react';
import { CheckCheck, SlidersHorizontal } from 'lucide-react';
import { useSearchParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import PageBackground from '../components/PageBackground';
import NotificationItem from '../features/notifications/NotificationItem';
import { notificationService } from '../features/notifications/notificationService';

export default function Notifications() {
  const { t } = useTranslation('notifications');
  const [params] = useSearchParams();
  const [state, setState] = useState({ items: [], cursor: null, more: false, unread: 0, loading: true, loadingMore: false, error: '' });
  const [showSettings, setShowSettings] = useState(params.get('settings') === '1');
  const controller = useRef();

  const load = useCallback(async (cursor = null) => {
    controller.current?.abort(); controller.current = new AbortController();
    setState(current => ({ ...current, [cursor ? 'loadingMore' : 'loading']: true, error: '' }));
    try {
      const response = await notificationService.list({ cursor, perPage: 15, signal: controller.current.signal });
      setState(current => ({ items: cursor ? [...current.items, ...response.data] : response.data, cursor: response.meta.next_cursor, more: response.meta.has_more, unread: response.meta.unread_count, loading: false, loadingMore: false, error: '' }));
    } catch (error) { if (error.code !== 'ERR_CANCELED') setState(current => ({ ...current, loading: false, loadingMore: false, error: t('error') })); }
  }, [t]);
  useEffect(() => { load(); return () => controller.current?.abort(); }, [load]);
  const read = useCallback(async id => {
    setState(current => ({ ...current, unread: Math.max(0, current.unread - 1), items: current.items.map(item => item.id === id ? { ...item, read_at: new Date().toISOString() } : item) }));
    try { await notificationService.markRead(id); } catch { await load(); }
  }, [load]);
  const readAll = async () => { setState(current => ({ ...current, unread: 0, items: current.items.map(item => ({ ...item, read_at: item.read_at || new Date().toISOString() })) })); try { await notificationService.markAllRead(); } catch { await load(); } };

  return <PageBackground variant="dashboard" className="min-h-screen"><div className="mx-auto max-w-5xl px-4 py-10 sm:px-6"><header className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-[.2em] text-amber-700">{t('eyebrow')}</p><h1 className="mt-2 text-4xl font-black text-slate-950 dark:text-white">{t('title')}</h1><p className="mt-2 text-slate-500">{t('unread', { count: state.unread })}</p></div><div className="flex gap-2"><button onClick={() => setShowSettings(value => !value)} className="inline-flex items-center gap-2 rounded-xl border bg-white/80 px-4 py-2 font-bold dark:border-slate-700 dark:bg-slate-900/80"><SlidersHorizontal className="h-4 w-4"/>{t('settings')}</button><button onClick={readAll} disabled={!state.unread} className="action gap-2 disabled:opacity-40"><CheckCheck className="h-4 w-4"/>{t('markAll')}</button></div></header>
    {showSettings && <NotificationSettings close={() => setShowSettings(false)} t={t}/>}
    <main className="mt-7 rounded-3xl border border-white/70 bg-white/85 p-4 shadow-xl backdrop-blur-xl dark:border-slate-700 dark:bg-slate-900/85 sm:p-6">{state.loading ? <div className="space-y-3">{[1,2,3,4].map(row => <div key={row} className="h-24 animate-pulse rounded-2xl bg-slate-100 motion-reduce:animate-none dark:bg-slate-800"/>)}</div> : state.error ? <div className="py-16 text-center"><p className="text-rose-600">{state.error}</p><button onClick={() => load()} className="action mt-4">{t('retry')}</button></div> : !state.items.length ? <div className="py-20 text-center text-slate-500">{t('empty')}</div> : <div className="space-y-2">{state.items.map(item => <NotificationItem key={item.id} item={item} onRead={read}/>)}{state.more && <button disabled={state.loadingMore} onClick={() => load(state.cursor)} className="mt-4 w-full rounded-xl border py-3 font-bold dark:border-slate-700">{state.loadingMore ? t('loading') : t('loadMore')}</button>}</div>}</main>
  </div></PageBackground>;
}

function NotificationSettings({ close, t }) {
  const [preferences, setPreferences] = useState(null);
  const [status, setStatus] = useState('');
  useEffect(() => { const controller = new AbortController(); notificationService.settings(controller.signal).then(response => setPreferences(response.data)); return () => controller.abort(); }, []);
  const save = async event => { event.preventDefault(); setStatus(t('saving')); try { const response = await notificationService.updateSettings(preferences); setPreferences(response.data); setStatus(t('saved')); } catch { setStatus(t('error')); } };
  return <form onSubmit={save} className="mt-6 rounded-3xl border border-amber-200 bg-amber-50/80 p-6 dark:border-amber-500/20 dark:bg-amber-400/10"><div className="flex justify-between"><h2 className="text-xl font-black dark:text-white">{t('settings')}</h2><button type="button" onClick={close} className="text-sm font-bold text-slate-500">{t('close')}</button></div>{preferences ? <div className="mt-5 grid gap-3 sm:grid-cols-2">{Object.entries(preferences).map(([key, value]) => <label key={key} className="flex items-center justify-between rounded-xl bg-white/80 p-4 font-bold dark:bg-slate-900/70"><span>{t(`preferences.${key}`)}</span><input type="checkbox" checked={value} onChange={event => setPreferences(current => ({ ...current, [key]: event.target.checked }))} className="h-5 w-5 accent-amber-500"/></label>)}</div> : <div className="mt-5 h-24 animate-pulse rounded-xl bg-white/70 dark:bg-slate-800"/>}<div className="mt-4 flex items-center gap-3"><button disabled={!preferences} className="action">{t('saveSettings')}</button><span aria-live="polite" className="text-sm text-slate-500">{status}</span></div></form>;
}
