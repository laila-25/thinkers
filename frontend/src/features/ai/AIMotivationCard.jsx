import { useEffect, useState } from 'react';
import { motion as m } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function AIMotivationCard({ compact = false }) {
  const { t } = useTranslation('ai');
  const tips = t('motivation.tips', { returnObjects: true });
  const [tip, setTip] = useState(0);
  useEffect(() => { const timer = window.setInterval(() => setTip(current => (current + 1) % tips.length), 7000); return () => window.clearInterval(timer); }, [tips.length]);
  return <m.aside initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className={`relative overflow-hidden rounded-3xl border border-amber-200 bg-gradient-to-br from-amber-50 to-white shadow-[0_18px_45px_-35px_rgba(183,121,31,0.5)] dark:border-amber-300/20 dark:from-[#17243b] dark:via-[#111d31] dark:to-[#0c1729] dark:shadow-[0_22px_55px_-38px_rgba(245,197,66,.3)] ${compact ? 'p-5' : 'p-6'}`}><div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-[#F5C542]/20 blur-2xl dark:bg-[#F5C542]/10"/><div className="relative flex items-start gap-3"><span className="ai-icon shrink-0"><Sparkles className="h-5 w-5"/></span><div><p className="ai-label">{t('motivation.title')}</p><m.p key={`${t('motivation.title')}-${tip}`} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="mt-1 font-bold text-slate-900 dark:text-slate-100">“{tips[tip]}”</m.p><p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{t('motivation.footer')}</p></div></div></m.aside>;
}
