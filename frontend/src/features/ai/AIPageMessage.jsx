import { Check, Clock3, Copy, UserRound } from 'lucide-react';
import { memo, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

function AIPageMessage({ message, formatTime, retry }) {
  const [copied, setCopied] = useState(false);
  const assistant = message.role === 'assistant';
  const copy = async () => { await navigator.clipboard.writeText(message.text); setCopied(true); window.setTimeout(() => setCopied(false), 1600); };
  return <article className={`group flex gap-3 [content-visibility:auto] [contain-intrinsic-size:auto_140px] ${assistant ? '' : 'flex-row-reverse'}`} aria-label={assistant ? 'AI Tutor response' : 'Your message'}>
    <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${assistant ? 'bg-slate-950 text-amber-300' : 'bg-amber-400 text-slate-950'}`}>{assistant ? <img src="/favicon.png" alt="" width="28" height="28" decoding="async" className="h-7 w-7 object-contain"/> : <UserRound className="h-5 w-5"/>}</span>
    <div className={`min-w-0 max-w-[min(100%,52rem)] ${assistant ? '' : 'text-right'}`}>
      <div className={`rounded-2xl px-4 py-3 text-left text-[15px] leading-7 ${assistant ? message.error ? 'border border-red-200 bg-red-50 text-red-800' : 'border border-slate-200 bg-white text-slate-800 shadow-sm' : 'bg-[#F5C542] text-slate-950'}`}>
        {assistant ? <MarkdownContent text={message.text}/> : <p className="whitespace-pre-wrap">{message.text}</p>}
        {message.error && <button type="button" onClick={retry} className="mt-3 rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-bold">Retry</button>}
      </div>
      <div className={`mt-1 flex items-center gap-2 px-1 text-[11px] text-slate-400 ${assistant ? '' : 'justify-end'}`}><Clock3 className="h-3 w-3"/><time>{formatTime(message.createdAt)}</time>{assistant && !message.error && <button type="button" onClick={copy} className="inline-flex items-center gap-1 rounded-md px-1.5 py-1 hover:bg-slate-200 hover:text-slate-700" aria-label="Copy response">{copied ? <Check className="h-3 w-3"/> : <Copy className="h-3 w-3"/>}{copied ? 'Copied' : 'Copy'}</button>}</div>
    </div>
  </article>;
}

function MarkdownContent({ text }) {
  return <ReactMarkdown remarkPlugins={[remarkGfm]} components={{
    p: props => <p className="mb-3 last:mb-0" {...props}/>,
    ul: props => <ul className="mb-3 list-disc space-y-1 pl-6" {...props}/>,
    ol: props => <ol className="mb-3 list-decimal space-y-1 pl-6" {...props}/>,
    h1: props => <h1 className="mb-3 text-2xl font-black" {...props}/>, h2: props => <h2 className="mb-2 text-xl font-extrabold" {...props}/>, h3: props => <h3 className="mb-2 text-lg font-bold" {...props}/>,
    blockquote: props => <blockquote className="my-3 border-l-4 border-amber-400 pl-4 text-slate-600" {...props}/>,
    table: props => <div className="my-3 overflow-x-auto"><table className="w-full border-collapse text-sm" {...props}/></div>, th: props => <th className="border bg-slate-100 px-3 py-2 text-left" {...props}/>, td: props => <td className="border px-3 py-2 align-top" {...props}/>,
    code: ({ className, children, ...props }) => className ? <code className="my-3 block overflow-x-auto rounded-xl bg-slate-950 p-4 font-mono text-sm text-slate-100" {...props}>{children}</code> : <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[.9em]" {...props}>{children}</code>,
    a: props => <a className="font-semibold text-blue-700 underline" target="_blank" rel="noreferrer" {...props}/>,
  }}>{String(text || '')}</ReactMarkdown>;
}

export default memo(AIPageMessage);
