import { X } from 'lucide-react';
import { useEffect, useId, useRef } from 'react';

export default function Modal({ open, title, description, children, footer, onClose, size = 'md' }) {
  const titleId = useId();
  const panelRef = useRef(null);
  useEffect(() => {
    if (!open) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKeyDown = event => { if (event.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKeyDown);
    panelRef.current?.focus();
    return () => { document.body.style.overflow = previousOverflow; document.removeEventListener('keydown', onKeyDown); };
  }, [onClose, open]);
  if (!open) return null;
  const widths = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' };
  return <div className="fixed inset-0 z-[120] grid place-items-center overflow-y-auto bg-slate-950/60 p-4 backdrop-blur-sm" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}><section ref={panelRef} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby={titleId} className={`w-full ${widths[size] || widths.md} rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl outline-none dark:border-slate-700 dark:bg-slate-900 sm:p-7`}><div className="flex items-start justify-between gap-4"><div><h2 id={titleId} className="text-xl font-extrabold">{title}</h2>{description && <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{description}</p>}</div><button type="button" onClick={onClose} className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-950 dark:hover:bg-slate-800 dark:hover:text-white" aria-label="Close dialog"><X className="h-5 w-5"/></button></div>{children && <div className="mt-6">{children}</div>}{footer && <footer className="mt-7 flex flex-wrap justify-end gap-3 border-t border-slate-100 pt-5 dark:border-slate-800">{footer}</footer>}</section></div>;
}
