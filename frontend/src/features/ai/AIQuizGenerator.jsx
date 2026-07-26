import { useState } from 'react';
import { motion as m, AnimatePresence } from 'framer-motion';
import { CheckCircle2, CircleHelp, LoaderCircle, RotateCcw, Sparkles } from 'lucide-react';
import { generateQuiz } from './aiTutorService';
import { useTranslation } from 'react-i18next';

export default function AIQuizGenerator({ topic, content = '' }) {
  const { t } = useTranslation('ai');
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const score = questions.reduce((total, question) => total + (answers[question.id] === question.answer ? 1 : 0), 0);

  const create = async () => {
    setBusy(true); setError('');
    try { setQuestions(await generateQuiz(topic, content)); setAnswers({}); setSubmitted(false); }
    catch (requestError) { setError(requestError.message); }
    finally { setBusy(false); }
  };

  return <section className="ai-card p-6 sm:p-7">
    <div className="flex flex-wrap items-center justify-between gap-4"><div className="flex items-center gap-3"><span className="ai-icon"><CircleHelp className="h-5 w-5"/></span><div><p className="ai-label">{t('quizTool.title')}</p><h3 className="text-xl font-bold">{t('quizTool.heading', { topic: topic || t('quizTool.topic') })}</h3></div></div><button onClick={create} disabled={busy} className="action">{busy ? <><LoaderCircle className="h-4 w-4 animate-spin"/>{t('quizTool.generating')}</> : <><Sparkles className="h-4 w-4"/>{t(questions.length ? 'quizTool.new' : 'quizTool.generate')}</>}</button></div>
    {error && <p className="mt-4 rounded-xl border border-red-100 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
    <AnimatePresence>{questions.length > 0 && <m.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-6 overflow-hidden">
      <div className="mb-6 flex items-center gap-3 rounded-2xl bg-amber-50 p-4"><div className="h-2 flex-1 overflow-hidden rounded-full bg-amber-100"><div className="h-full bg-[#F5C542] transition-all" style={{ width: `${submitted ? score / questions.length * 100 : Object.keys(answers).length / questions.length * 100}%` }}/></div><strong className="text-sm text-slate-700">{submitted ? `${score}/${questions.length}` : `${Object.keys(answers).length}/${questions.length}`}</strong></div>
      <div className="space-y-5">{questions.map((question, questionIndex) => <fieldset key={question.id} className="rounded-2xl border border-slate-200 bg-white p-5"><legend className="px-2 font-bold text-slate-900">{questionIndex + 1}. {question.question}</legend><div className="mt-3 grid gap-2 sm:grid-cols-2">{question.options.map((option, optionIndex) => { const selected = answers[question.id] === optionIndex; const correct = submitted && optionIndex === question.answer; const wrong = submitted && selected && !correct; return <label key={option} className={`cursor-pointer rounded-xl border px-4 py-3 text-sm transition ${correct ? 'border-emerald-300 bg-emerald-50 text-emerald-800' : wrong ? 'border-red-200 bg-red-50 text-red-700' : selected ? 'border-amber-300 bg-amber-50 text-slate-900' : 'border-slate-200 hover:border-amber-200 hover:bg-amber-50/40'}`}><input type="radio" className="mr-2 accent-amber-500" name={`ai-question-${question.id}`} checked={selected} disabled={submitted} onChange={() => setAnswers(current => ({ ...current, [question.id]: optionIndex }))}/>{option}</label>; })}</div>{submitted && <p className="mt-3 text-sm leading-6 text-slate-600"><CheckCircle2 className="mr-1 inline h-4 w-4 text-emerald-600"/>{question.explanation}</p>}</fieldset>)}</div>
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">{submitted ? <><p className="font-bold text-slate-900">{t('quizTool.score', { score: Math.round(score / questions.length * 100) })} — {t(score >= 4 ? 'quizTool.excellent' : 'quizTool.review')}</p><button onClick={create} className="inline-flex items-center gap-2 font-semibold text-amber-700"><RotateCcw className="h-4 w-4"/>{t('quizTool.another')}</button></> : <button onClick={() => setSubmitted(true)} disabled={Object.keys(answers).length !== questions.length} className="action ms-auto">{t('quizTool.check')}</button>}</div>
    </m.div>}</AnimatePresence>
  </section>;
}
