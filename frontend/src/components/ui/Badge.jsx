const tones = {
  neutral: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200',
  success: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300',
  warning: 'bg-amber-50 text-amber-800 dark:bg-amber-400/10 dark:text-amber-200',
  danger: 'bg-rose-50 text-rose-700 dark:bg-rose-400/10 dark:text-rose-300',
  info: 'bg-sky-50 text-sky-700 dark:bg-sky-400/10 dark:text-sky-300',
};

export default function Badge({ tone = 'neutral', className = '', children }) {
  return <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-extrabold capitalize ${tones[tone] || tones.neutral} ${className}`}>{children}</span>;
}
