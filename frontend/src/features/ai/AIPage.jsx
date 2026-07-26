import { Bot, Menu, Plus, Sparkles, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router';
import { chatTutor, createConversation, deleteConversation, listConversations, loadConversation } from './aiTutorService';
import AIPageComposer from './AIPageComposer';
import AIPageMessage from './AIPageMessage';
import AIPageSidebar from './AIPageSidebar';
import PageBackground from '../../components/PageBackground';

const now = () => new Date().toISOString();
const prompts = ['Explain this concept simply', 'Create a study plan', 'Quiz me on my lesson', 'Help me understand my course'];

export default function AIPage() {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [conversationId, setConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [olderCursor, setOlderCursor] = useState(null);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [status, setStatus] = useState('idle');
  const [lastFailed, setLastFailed] = useState('');
  const [confirmClear, setConfirmClear] = useState(false);
  const [context, setContext] = useState(() => location.state?.aiContext || {});
  const endRef = useRef(null);
  const preserveScrollRef = useRef(false);
  const busy = status !== 'idle';

  const refreshConversations = useCallback(async () => setConversations(await listConversations()), []);
  useEffect(() => { refreshConversations().catch(() => {}); }, [refreshConversations]);
  useEffect(() => { if (location.state?.aiContext) setContext(location.state.aiContext); }, [location.state]);
  useEffect(() => {
    if (preserveScrollRef.current) {
      preserveScrollRef.current = false;
      return;
    }
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, status]);

  const submit = async suppliedValue => {
    const question = String(suppliedValue || '').trim();
    if (!question || busy) return;
    const history = messages.filter(message => !message.error);
    setMessages(current => [...current.filter(message => !message.error), { role: 'user', text: question, createdAt: now() }]);
    setLastFailed(''); setStatus('thinking');
    try {
      const result = await chatTutor(question, { courseTitle: document.title.replace('Thinkers | ', ''), ...context }, history, conversationId);
      setConversationId(result.conversation_id);
      setMessages(current => [...current, { role: 'assistant', text: result.response, createdAt: result.message?.created_at || now() }]);
      await refreshConversations();
    } catch (error) {
      setLastFailed(question);
      setMessages(current => [...current, { role: 'assistant', text: error.message, error: true, createdAt: now() }]);
    } finally { setStatus('idle'); }
  };

  const startNew = async () => {
    if (busy) return;
    try {
      const conversation = await createConversation(context);
      setConversationId(conversation.id); setMessages([]); setOlderCursor(null); setLastFailed(''); setSidebarOpen(false);
      await refreshConversations();
    } catch { setConversationId(null); setMessages([]); }
  };
  const selectConversation = async id => {
    if (busy) return;
    try {
      const conversation = await loadConversation(id);
      setConversationId(id); setLastFailed(''); setSidebarOpen(false);
      setContext(current => ({ ...current, courseId: conversation.course_id, lessonId: conversation.lesson_id }));
      setMessages((conversation.messages || []).map(message => ({ id: message.id, role: message.role, text: message.content, createdAt: message.created_at })));
      setOlderCursor(conversation.messages_pagination?.next_cursor || null);
    } catch { setMessages([{ role: 'assistant', text: 'This conversation could not be loaded. Please try again.', error: true, createdAt: now() }]); }
  };
  const loadOlder = async () => {
    if (!conversationId || !olderCursor || loadingOlder) return;
    setLoadingOlder(true);
    try {
      const conversation = await loadConversation(conversationId, olderCursor);
      const older = (conversation.messages || []).map(message => ({ id: message.id, role: message.role, text: message.content, createdAt: message.created_at }));
      preserveScrollRef.current = true;
      setMessages(current => [...older, ...current]);
      setOlderCursor(conversation.messages_pagination?.next_cursor || null);
    } finally { setLoadingOlder(false); }
  };
  const removeConversation = async id => {
    await deleteConversation(id);
    if (conversationId === id) { setConversationId(null); setMessages([]); setOlderCursor(null); }
    await refreshConversations();
  };
  const clearCurrent = async () => {
    if (!conversationId) return;
    await deleteConversation(conversationId); setConversationId(null); setMessages([]); setOlderCursor(null); setLastFailed(''); await refreshConversations();
    setConfirmClear(false);
  };
  const formatTime = value => new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' }).format(new Date(value || Date.now()));

  return <PageBackground variant="ai" className="min-h-[calc(100dvh-6rem)] p-2 sm:p-4"><div className="flex h-[calc(100dvh-7rem)] min-h-[36rem] overflow-hidden rounded-[1.75rem] border border-white/20 bg-white/78 shadow-[0_32px_110px_-38px_rgba(0,0,0,.92)] backdrop-blur-2xl dark:border-slate-700/70 dark:bg-slate-950/58">
    <AIPageSidebar open={sidebarOpen} conversations={conversations} activeId={conversationId} busy={busy} onClose={() => setSidebarOpen(false)} onCreate={startNew} onSelect={selectConversation} onDelete={removeConversation}/>
    <section className="flex min-w-0 flex-1 flex-col" aria-label="Thinkers AI Tutor chat">
      <header className="flex h-20 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6"><div className="flex items-center gap-3"><button type="button" onClick={() => setSidebarOpen(true)} className="rounded-xl border p-2 lg:hidden" aria-label="Open conversation history"><Menu className="h-5 w-5"/></button><div><h1 className="text-lg font-extrabold sm:text-xl">AI Tutor</h1><p className="text-xs text-slate-500">Your personal Thinkers learning assistant</p></div></div><div className="flex items-center gap-2"><button type="button" onClick={startNew} className="rounded-xl border border-slate-200 p-2.5 hover:bg-slate-50" aria-label="New conversation"><Plus className="h-5 w-5"/></button>{conversationId && (confirmClear ? <div className="flex items-center gap-1" role="group" aria-label="Confirm clearing conversation"><button type="button" onClick={clearCurrent} className="rounded-lg bg-red-600 px-3 py-2 text-xs font-bold text-white hover:bg-red-700">Clear</button><button type="button" onClick={() => setConfirmClear(false)} className="rounded-lg px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100">Cancel</button></div> : <button type="button" onClick={() => setConfirmClear(true)} className="rounded-xl border border-slate-200 p-2.5 text-red-600 hover:bg-red-50" aria-label="Clear conversation"><Trash2 className="h-5 w-5"/></button>)}</div></header>
      <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-8" role="log" aria-live="polite"><div className="mx-auto max-w-4xl">{messages.length ? <div className="space-y-7">{olderCursor && <div className="text-center"><button type="button" onClick={loadOlder} disabled={loadingOlder} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-600 shadow-sm hover:bg-slate-50 disabled:cursor-wait disabled:opacity-60">{loadingOlder ? 'Loading…' : 'Load earlier messages'}</button></div>}{messages.map((message, index) => <AIPageMessage key={message.id || `${message.createdAt}-${index}`} message={message} formatTime={formatTime} retry={() => submit(lastFailed)}/>)}{busy && <TypingState status={status}/>}<div ref={endRef}/></div> : <Welcome onPrompt={submit} context={context}/>}</div></div>
      <footer className="shrink-0 border-t border-slate-200 bg-white/95 px-4 py-4 backdrop-blur sm:px-8"><AIPageComposer onSubmit={submit} busy={busy}/><p className="mt-2 text-center text-[11px] text-slate-400">Thinkers AI can make mistakes. Verify important information.</p></footer>
    </section>
  </div></PageBackground>;
}

function Welcome({ onPrompt, context }) { return <div className="flex min-h-[28rem] flex-col items-center justify-center text-center"><span className="relative grid h-20 w-20 place-items-center rounded-3xl bg-slate-950 shadow-xl"><img src="/favicon.png" alt="" className="h-14 w-14 object-contain"/><Sparkles className="absolute -right-2 -top-2 h-6 w-6 text-amber-500"/></span><h2 className="mt-6 text-3xl font-black tracking-tight text-slate-950">How can I help you learn?</h2><p className="mt-3 max-w-xl text-slate-500">Ask questions, understand difficult ideas, summarize lessons, or test your knowledge.{context.lessonTitle ? ` Current lesson: ${context.lessonTitle}.` : ''}</p><div className="mt-8 grid w-full max-w-2xl gap-3 sm:grid-cols-2">{prompts.map(prompt => <button type="button" key={prompt} onClick={() => onPrompt(prompt)} className="rounded-2xl border border-slate-200 bg-white p-4 text-left text-sm font-bold shadow-sm transition hover:-translate-y-0.5 hover:border-amber-300 hover:bg-amber-50">{prompt}</button>)}</div></div>; }
function TypingState({ status }) { return <div className="flex gap-3"><span className="grid h-9 w-9 place-items-center rounded-xl bg-slate-950"><Bot className="h-5 w-5 text-amber-300"/></span><div className="rounded-2xl border bg-white px-4 py-3 shadow-sm"><div className="flex items-center gap-3 text-sm text-slate-500"><span className="flex gap-1"><i className="ai-typing-dot"/><i className="ai-typing-dot [animation-delay:150ms]"/><i className="ai-typing-dot [animation-delay:300ms]"/></span>{status === 'thinking' ? 'Thinking…' : 'Generating answer…'}</div></div></div>; }
