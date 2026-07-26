import { Inbox } from 'lucide-react';

export default function EmptyState({ icon: Icon = Inbox, title = 'Nothing to show', description = 'There is no content here yet.', action, className = '' }) {
  return <div className={`grid min-h-56 place-items-center rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center dark:border-slate-700 dark:bg-slate-900 ${className}`}><div><span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-300"><Icon className="h-6 w-6"/></span><h3 className="mt-4 font-extrabold">{title}</h3>{description && <p className="mx-auto mt-2 max-w-md text-sm text-slate-500 dark:text-slate-400">{description}</p>}{action && <div className="mt-5">{action}</div>}</div></div>;
}
