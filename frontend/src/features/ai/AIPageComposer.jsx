import { LoaderCircle, Send } from 'lucide-react';
import { memo, useEffect, useRef, useState } from 'react';

function AIPageComposer({ onSubmit, busy }) {
  const ref = useRef(null);
  const [value, setValue] = useState('');
  useEffect(() => { ref.current?.focus(); }, []);
  const resize = element => { element.style.height = '48px'; element.style.height = `${Math.min(element.scrollHeight, 180)}px`; };
  const submit = () => {
    const question = value.trim();
    if (!question || busy) return;
    setValue('');
    if (ref.current) ref.current.style.height = '48px';
    onSubmit(question);
  };
  return <form onSubmit={event => { event.preventDefault(); submit(); }} className="mx-auto max-w-4xl"><div className="flex items-end gap-2 rounded-2xl border border-slate-300 bg-white p-2 shadow-[0_12px_40px_-20px_rgba(15,23,42,.45)] focus-within:border-amber-400 focus-within:ring-4 focus-within:ring-amber-100"><textarea ref={ref} rows="1" maxLength="5000" value={value} disabled={busy} onChange={event => { setValue(event.target.value); resize(event.target); }} onKeyDown={event => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); submit(); } }} placeholder="Ask Thinkers AI anything about your learning…" aria-label="Message Thinkers AI Tutor" className="min-h-12 max-h-44 flex-1 resize-none bg-transparent px-3 py-3 text-[15px] outline-none disabled:opacity-60"/><button type="submit" disabled={busy || !value.trim()} className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-[#F5C542] text-slate-950 transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-40" aria-label="Send message">{busy ? <LoaderCircle className="h-5 w-5 animate-spin"/> : <Send className="h-5 w-5"/>}</button></div><div className="mt-2 flex justify-between px-2 text-[11px] text-slate-400"><span>Enter to send · Shift+Enter for a new line</span><span>{value.length}/5000</span></div></form>;
}

export default memo(AIPageComposer);
