import { BookOpenCheck, X } from 'lucide-react';
import { motion as m } from 'framer-motion';
import { useTranslation } from 'react-i18next';

export default function AISummaryCard({ summary, onClose }) {
  const { t } = useTranslation('ai');
  if (!summary) return null;
  return <m.article initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-amber-200 bg-amber-50/70 p-5 dark:border-amber-400/30 dark:bg-amber-400/10"><div className="flex items-start justify-between gap-3"><div><p className="ai-label">{t('lessonActions.summaryTitle')}</p><h3 className="mt-1 text-xl font-bold">{summary.title}</h3></div><button type="button" onClick={onClose} aria-label={t('lessonActions.close')}><X className="h-5 w-5"/></button></div><p className="mt-3 leading-7 text-slate-700 dark:text-slate-200">{summary.body}</p><ul className="mt-4 space-y-2">{summary.takeaways.map(item => <li key={item} className="flex gap-2 text-sm"><BookOpenCheck className="mt-0.5 h-4 w-4 shrink-0 text-amber-600"/>{item}</li>)}</ul></m.article>;
}
