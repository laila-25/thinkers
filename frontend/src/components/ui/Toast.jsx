import { AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import ToastContext from './toast-context';
const icons = { success: CheckCircle2, error: AlertTriangle, info: Info };

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const dismiss = useCallback(id => setToasts(current => current.filter(item => item.id !== id)), []);
  const toast = useCallback(value => {
    const item = typeof value === 'string' ? { message: value } : value;
    const id = crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`;
    setToasts(current => [...current.slice(-2), { type: 'success', ...item, id }]);
    return id;
  }, []);
  const context = useMemo(() => ({ toast, dismiss }), [dismiss, toast]);
  return <ToastContext.Provider value={context}>{children}<div className="pointer-events-none fixed bottom-5 right-5 z-[200] flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-3" aria-live="polite">{toasts.map(item => <ToastItem key={item.id} item={item} dismiss={dismiss}/>)}</div></ToastContext.Provider>;
}

function ToastItem({ item, dismiss }) {
  const Icon = icons[item.type] || Info;
  useEffect(() => { const timer = window.setTimeout(() => dismiss(item.id), item.duration || 4000); return () => window.clearTimeout(timer); }, [dismiss, item.duration, item.id]);
  const tone = item.type === 'error' ? 'border-rose-200 text-rose-800 dark:border-rose-900 dark:text-rose-200' : item.type === 'info' ? 'border-sky-200 text-sky-800 dark:border-sky-900 dark:text-sky-200' : 'border-emerald-200 text-emerald-800 dark:border-emerald-900 dark:text-emerald-200';
  return <div role={item.type === 'error' ? 'alert' : 'status'} className={`pointer-events-auto flex items-start gap-3 rounded-2xl border bg-white p-4 shadow-2xl dark:bg-slate-900 ${tone}`}><Icon className="mt-0.5 h-5 w-5 shrink-0"/><span className="min-w-0 flex-1 text-sm font-semibold">{item.message}</span><button type="button" onClick={() => dismiss(item.id)} aria-label="Dismiss notification"><X className="h-4 w-4"/></button></div>;
}
