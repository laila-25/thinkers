import { useState } from 'react';
import { motion as m, AnimatePresence } from 'framer-motion';
import { ArrowRight, BookOpenCheck, BrainCircuit, Clock3, Gauge, LoaderCircle, Route, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import AICodeAssistant from './AICodeAssistant';
import AIQuizGenerator from './AIQuizGenerator';
import AIMotivationCard from './AIMotivationCard';
import { generateSummary, isProgrammingCourse, learningPath } from './aiTutorService';

export default function AIStudyTools({ context, includeCode = true, compact = false }) {
  const { t } = useTranslation('ai');
  const [summary, setSummary] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const path = learningPath(context);
  const summarize = async () => { setBusy(true); setError(''); try { setSummary(await generateSummary(context)); } catch (requestError) { setError(requestError.message); } finally { setBusy(false); } };
  return <section className={compact ? 'space-y-5' : 'section-shell space-y-6 py-16'}>
    {error && <p className="rounded-xl border border-red-100 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
    {!compact && <div><p className="section-kicker">{t('tools.eyebrow')}</p><h2 className="section-title">{t('tools.title')}</h2><p className="mt-4 max-w-2xl text-slate-600">{t('tools.description')}</p></div>}
    <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
      <section className="ai-card p-6 sm:p-7"><div className="flex flex-wrap items-center justify-between gap-4"><div className="flex items-center gap-3"><span className="ai-icon"><BrainCircuit className="h-5 w-5"/></span><div><p className="ai-label">{t('tools.summary')}</p><h3 className="text-xl font-bold">{t('tools.summaryTitle')}</h3></div></div><button onClick={summarize} disabled={busy} className="action">{busy ? <><LoaderCircle className="h-4 w-4 animate-spin"/>{t('tools.generating')}</> : <><Sparkles className="h-4 w-4"/>{t('tools.generate')}</>}</button></div><AnimatePresence>{summary && <m.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mt-6 rounded-2xl border border-amber-200 bg-amber-50/70 p-5"><h4 className="font-bold text-slate-900">{summary.title}</h4><p className="mt-2 text-sm leading-7 text-slate-700">{summary.body}</p><ul className="mt-4 grid gap-2 sm:grid-cols-3">{summary.takeaways.map(item => <li key={item} className="flex gap-2 text-xs font-semibold text-slate-600"><BookOpenCheck className="h-4 w-4 shrink-0 text-amber-600"/>{item}</li>)}</ul></m.div>}</AnimatePresence>{!summary && <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 p-6 text-center text-sm text-slate-500">{t('tools.summaryEmpty')}</div>}</section>
      <LearningPath path={path}/>
    </div>
    <AIQuizGenerator topic={context.lessonTitle || context.courseTitle} content={context.lessonContent || context.description}/>
    {includeCode && isProgrammingCourse(context.category) && <AICodeAssistant context={context}/>}<AIMotivationCard compact/>
  </section>;
}

function LearningPath({ path }) {
  const { t } = useTranslation('ai');
  const items = [[ArrowRight, t('tools.next'), path.next], [BookOpenCheck, t('tools.related'), path.related], [Gauge, t('tools.difficulty'), path.difficulty], [Clock3, t('tools.completion'), path.completion]];
  return <section className="ai-card p-6 sm:p-7"><div className="flex items-center gap-3"><span className="ai-icon"><Route className="h-5 w-5"/></span><div><p className="ai-label">{t('tools.path')}</p><h3 className="text-xl font-bold">{t('tools.pathTitle')}</h3></div></div><div className="mt-5 space-y-3">{items.map(([Icon, label, value]) => <div key={label} className="flex gap-3 rounded-2xl border border-slate-100 bg-slate-50/70 p-3.5"><Icon className="mt-0.5 h-4 w-4 shrink-0 text-amber-600"/><div><p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{label}</p><p className="mt-0.5 text-sm font-semibold text-slate-800">{value}</p></div></div>)}</div></section>;
}
