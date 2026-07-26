export default function LoadingState({ cards = 3, label = 'Loading content' }) {
  return <div className="animate-pulse space-y-6 motion-reduce:animate-none" role="status" aria-live="polite" aria-label={label}><span className="sr-only">{label}</span><div className="h-8 w-52 rounded-lg bg-slate-200 dark:bg-slate-700"/><div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">{Array.from({ length: cards }, (_, index) => <div key={index} className="h-40 rounded-3xl bg-slate-100 dark:bg-slate-800"/>)}</div></div>;
}
