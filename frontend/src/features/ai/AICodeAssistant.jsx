import { useState } from 'react';
import { Bug, Code2, Gauge, LoaderCircle, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { askTutor } from './aiTutorService';

export default function AICodeAssistant({ context = {} }) {
  const { t } = useTranslation('ai');
  const [code, setCode] = useState(() => `${t('code.starter')}\nfunction learn(topic) {\n  return topic;\n}`);
  const [result, setResult] = useState('');
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const analyze = async mode => {
    const instructions = { explain: t('code.explainPrompt'), fix: t('code.fixPrompt'), optimize: t('code.optimizePrompt') };
    setBusy(mode); setError(''); setResult('');
    try { setResult(await askTutor(`${instructions[mode]}\n\nCode:\n${code}`, { ...context, lessonContent: code })); }
    catch (requestError) { setError(requestError.message); } finally { setBusy(''); }
  };
  const control = 'rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold hover:border-amber-300 hover:bg-amber-50';
  return <section className="ai-card p-6 sm:p-7"><div className="flex items-center gap-3"><span className="ai-icon"><Code2 className="h-5 w-5"/></span><div><p className="ai-label">{t('code.title')}</p><h3 className="text-xl font-bold">{t('code.ask')}</h3></div></div><div className="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50"><div className="flex items-center gap-2 border-b border-slate-200 bg-white px-4 py-2 text-xs text-slate-500"><span className="h-2.5 w-2.5 rounded-full bg-red-300"/><span className="h-2.5 w-2.5 rounded-full bg-amber-300"/><span className="h-2.5 w-2.5 rounded-full bg-emerald-300"/><span className="ms-2">{t('code.workspace')}</span></div><textarea value={code} onChange={event => setCode(event.target.value)} spellCheck="false" aria-label={t('code.workspace')} className="min-h-48 w-full resize-y bg-transparent p-5 font-mono text-sm leading-6 text-slate-800 outline-none"/></div><div className="mt-4 flex flex-wrap gap-2"><button disabled={Boolean(busy)} onClick={() => analyze('explain')} className="action">{busy === 'explain' ? <LoaderCircle className="h-4 w-4 animate-spin"/> : <Sparkles className="h-4 w-4"/>}{t('code.explain')}</button><button disabled={Boolean(busy)} onClick={() => analyze('fix')} className={control}>{busy === 'fix' ? <LoaderCircle className="me-2 inline h-4 w-4 animate-spin"/> : <Bug className="me-2 inline h-4 w-4"/>}{t('code.fix')}</button><button disabled={Boolean(busy)} onClick={() => analyze('optimize')} className={control}>{busy === 'optimize' ? <LoaderCircle className="me-2 inline h-4 w-4 animate-spin"/> : <Gauge className="me-2 inline h-4 w-4"/>}{t('code.optimize')}</button></div>{error && <p className="mt-4 rounded-xl border border-red-100 bg-red-50 p-3 text-sm text-red-700">{error}</p>}{result && <div className="mt-4 whitespace-pre-wrap rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-slate-700">{result}</div>}</section>;
}
