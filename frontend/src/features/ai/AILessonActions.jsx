import { useState } from 'react';
import { BrainCircuit, HelpCircle, Layers3, ListChecks, LoaderCircle, MessageCircle, Sparkles } from 'lucide-react';
import { motion as m } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { askTutor, explainLesson, generateLessonQuiz, summarizeLesson } from './aiTutorService';
import AISummaryCard from './AISummaryCard';
import AIQuizCard from './AIQuizCard';

export default function AILessonActions({ context }) {
  const { t } = useTranslation('ai'); const [busy, setBusy] = useState(''); const [error, setError] = useState(''); const [explanation, setExplanation] = useState(''); const [flashcards, setFlashcards] = useState(''); const [summary, setSummary] = useState(null); const [quiz, setQuiz] = useState([]);
  if (!context?.lessonId) return null;
  const run = async (type, action) => { setBusy(type); setError(''); try { await action(); } catch (requestError) { setError(requestError.message); } finally { setBusy(''); } };
  const actions = [
    ['explain', HelpCircle, t('lessonActions.explain'), () => run('explain', async () => setExplanation(await explainLesson(context.lessonId)))],
    ['summary', Sparkles, t('lessonActions.summarize'), () => run('summary', async () => setSummary(await summarizeLesson(context.lessonId)))],
    ['flashcards', Layers3, 'Create flashcards', () => run('flashcards', async () => setFlashcards(await askTutor('Create concise study flashcards for this lesson. Format each as “Front:” and “Back:”.', context)))],
    ['quiz', ListChecks, t('lessonActions.quiz'), () => run('quiz', async () => setQuiz(await generateLessonQuiz(context.lessonId)))],
    ['ask', MessageCircle, t('lessonActions.ask'), () => window.dispatchEvent(new CustomEvent('thinkers-ai:open', { detail: context }))],
  ];
  return <section className="ai-card p-6 sm:p-7"><div className="flex items-start gap-3"><span className="ai-icon"><BrainCircuit className="h-5 w-5"/></span><div><p className="ai-label">{t('lessonActions.eyebrow')}</p><h2 className="text-2xl font-bold">{t('lessonActions.title')}</h2><p className="mt-2 text-sm leading-6 text-slate-500">{t('lessonActions.description')}</p></div></div><div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">{actions.map(([key, Icon, label, action]) => <m.button whileHover={{ y: -2 }} type="button" key={key} onClick={action} disabled={Boolean(busy)} className="flex items-center justify-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-slate-900 hover:bg-[#F5C542] disabled:opacity-50 dark:bg-amber-400/10 dark:text-amber-100">{busy === key ? <LoaderCircle className="h-4 w-4 animate-spin"/> : <Icon className="h-4 w-4"/>}{label}</m.button>)}</div>{error && <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}{explanation && <m.article initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mt-5 rounded-2xl border border-amber-200 bg-amber-50/70 p-5 whitespace-pre-wrap dark:bg-amber-400/10"><p className="ai-label">{t('lessonActions.explanationTitle')}</p><p className="mt-2 leading-7">{explanation}</p></m.article>}{flashcards && <m.article initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mt-5 whitespace-pre-wrap rounded-2xl border border-amber-200 bg-white p-5 leading-7"><p className="ai-label">Flashcards</p><p className="mt-2">{flashcards}</p></m.article>}<div className="mt-5 space-y-5"><AISummaryCard summary={summary} onClose={() => setSummary(null)}/><AIQuizCard questions={quiz} onClose={() => setQuiz([])}/></div></section>;
}
