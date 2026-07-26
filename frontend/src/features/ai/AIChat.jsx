import { Bot, Sparkles } from 'lucide-react';
import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router';
import useAuth from '../../context/useAuth';

export default function AIChat() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const openWithContext = event => navigate('/ai', { state: { aiContext: event.detail || {} } });
    window.addEventListener('thinkers-ai:open', openWithContext);
    return () => window.removeEventListener('thinkers-ai:open', openWithContext);
  }, [navigate]);

  if (isLoading || !isAuthenticated || !user?.email_verified_at || location.pathname === '/ai') return null;
  return <button type="button" onClick={() => navigate('/ai')} className="fixed bottom-5 right-5 z-50 grid h-16 w-16 place-items-center rounded-full border border-amber-300 bg-gradient-to-br from-[#FFE77A] to-[#F5C542] text-slate-950 shadow-xl transition hover:-translate-y-1 hover:shadow-2xl focus:outline-none focus:ring-4 focus:ring-amber-200" aria-label="Open Thinkers AI Tutor"><Bot className="h-7 w-7"/><Sparkles className="absolute -right-1 -top-1 h-5 w-5 text-amber-700"/></button>;
}
