import { memo } from 'react';
import { Award, Bell, BookOpen, Bot, CircleDollarSign, GraduationCap, MessageSquareText, ShieldAlert } from 'lucide-react';
import { Link } from 'react-router';
import useLanguage from '../../context/useLanguage';

const icons = {
  certificate: Award, course: BookOpen, feedback: MessageSquareText, student: GraduationCap,
  revenue: CircleDollarSign, ai: Bot, security: ShieldAlert,
};

function relativeTime(date, locale) {
  const seconds = Math.round((new Date(date).getTime() - Date.now()) / 1000);
  const ranges = [['year', 31536000], ['month', 2592000], ['week', 604800], ['day', 86400], ['hour', 3600], ['minute', 60]];
  const [unit, size] = ranges.find(([, value]) => Math.abs(seconds) >= value) || ['second', 1];
  return new Intl.RelativeTimeFormat(locale, { numeric: 'auto' }).format(Math.round(seconds / size), unit);
}

function NotificationItem({ item, onRead, compact = false }) {
  const { language } = useLanguage();
  const Icon = icons[item.icon] || Bell;
  const content = <><span className={`grid shrink-0 place-items-center rounded-xl ${compact ? 'h-9 w-9' : 'h-11 w-11'} ${item.read_at ? 'bg-slate-100 text-slate-500 dark:bg-slate-800' : 'bg-amber-100 text-amber-700 dark:bg-amber-400/15 dark:text-amber-300'}`}><Icon className="h-5 w-5"/></span><span className="min-w-0 flex-1"><span className="flex items-start justify-between gap-3"><strong className="line-clamp-1 text-sm text-slate-950 dark:text-white">{item.title}</strong>{!item.read_at && <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-amber-500" aria-label="Unread"/>}</span>{item.message && <span className="mt-1 line-clamp-2 block text-xs leading-5 text-slate-500 dark:text-slate-400">{item.message}</span>}<time dateTime={item.created_at} className="mt-1 block text-[11px] font-semibold text-slate-400">{relativeTime(item.created_at, language)}</time></span></>;
  const classes = `flex w-full gap-3 rounded-2xl border p-3 text-start transition-colors motion-reduce:transition-none ${item.read_at ? 'border-transparent bg-transparent hover:bg-slate-50 dark:hover:bg-slate-800/70' : 'border-amber-200/70 bg-amber-50/70 hover:bg-amber-100/70 dark:border-amber-500/20 dark:bg-amber-400/10'}`;
  return item.destination
    ? <Link to={item.destination} onClick={() => !item.read_at && onRead(item.id)} className={classes}>{content}</Link>
    : <button type="button" onClick={() => !item.read_at && onRead(item.id)} disabled={Boolean(item.read_at)} className={classes}>{content}</button>;
}

export default memo(NotificationItem);
