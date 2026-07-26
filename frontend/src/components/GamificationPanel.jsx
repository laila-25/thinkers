import { Award, Flame, Globe2, LockKeyhole, Sparkles, Trophy } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import api from '../api/client';

const achievementIcons = {
  first_lesson: '🎯', first_course: '🎓', seven_day_streak: '🔥',
  quiz_master: '🧠', ai_explorer: '✨', course_collector: '📚',
};

export default function GamificationPanel() {
  const [profile, setProfile] = useState(null);
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async signal => {
    setError('');
    try {
      const [profileResponse, leaderboardResponse] = await Promise.all([
        api.get('/api/gamification', { signal }),
        api.get('/api/leaderboard', { signal }),
      ]);
      setProfile(profileResponse.data.data);
      setLeaders(leaderboardResponse.data.data || []);
    } catch {
      if (!signal?.aborted) setError('Gamification data is unavailable right now.');
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal);
    return () => controller.abort();
  }, [load]);

  const updateSettings = async settings => {
    setSaving(true);
    setError('');
    try {
      const { data } = await api.patch('/api/gamification/settings', settings);
      setProfile(data.data);
      const leaderboard = await api.get('/api/leaderboard');
      setLeaders(leaderboard.data.data || []);
    } catch {
      setError('Could not save your gamification settings.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <GamificationSkeleton/>;
  if (!profile) return <section className="mt-8 rounded-3xl border border-rose-200 bg-rose-50 p-5 text-rose-800"><p>{error}</p><button type="button" onClick={() => { setLoading(true); load(); }} className="mt-3 font-bold underline">Try again</button></section>;

  const level = profile.level;
  const deviceTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  return <section className="mt-8" aria-labelledby="learning-rewards-title">
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div><p className="section-kicker">Learning rewards</p><h2 id="learning-rewards-title" className="mt-1 text-2xl font-bold">Your momentum</h2></div>
      {profile.timezone !== deviceTimezone && <button type="button" disabled={saving} onClick={() => updateSettings({ timezone: deviceTimezone })} className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900 disabled:opacity-50"><Globe2 className="h-4 w-4"/> Use device timezone</button>}
    </div>
    {error && <p className="mt-3 rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}

    <div className="mt-5 grid gap-4 md:grid-cols-3">
      <article className="rounded-3xl bg-slate-950 p-6 text-white md:col-span-2">
        <div className="flex items-start justify-between gap-4"><div><p className="text-sm text-slate-300">Level {level.number}</p><h3 className="mt-1 text-2xl font-bold">{level.name}</h3></div><span className="grid h-12 w-12 place-items-center rounded-2xl bg-amber-400 text-slate-950"><Sparkles className="h-6 w-6"/></span></div>
        <div className="mt-7 flex items-end justify-between gap-3"><strong className="text-3xl tabular-nums">{profile.total_xp.toLocaleString()} XP</strong><span className="text-sm text-slate-300">{level.next ? `${level.xp_to_next} XP to ${level.next.name}` : 'Highest level reached'}</span></div>
        <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-white/15" aria-label={`${level.progress_percentage}% level progress`}><div className="h-full rounded-full bg-amber-400 transition-[width] duration-700" style={{ width: `${level.progress_percentage}%` }}/></div>
      </article>
      <article className="rounded-3xl border border-orange-200 bg-orange-50 p-6"><Flame className="h-8 w-8 text-orange-600"/><p className="mt-5 text-sm font-semibold text-orange-800">Current streak</p><strong className="mt-1 block text-3xl text-slate-950">{profile.current_streak} days</strong><p className="mt-2 text-sm text-slate-600">Longest: {profile.longest_streak} days</p></article>
    </div>

    <div className="mt-5 grid gap-5 xl:grid-cols-[1.35fr_1fr]">
      <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-2"><Award className="h-5 w-5 text-amber-600"/><h3 className="text-lg font-bold">Achievements</h3></div>
        {profile.achievements.length ? <div className="mt-5 grid gap-3 sm:grid-cols-2">{profile.achievements.map(item => <div key={item.key} className="flex items-center gap-3 rounded-2xl bg-slate-50 p-4"><span className="text-2xl" aria-hidden="true">{achievementIcons[item.key] || '🏅'}</span><div><p className="font-bold">{item.name}</p><p className="text-xs text-slate-500">{item.description}</p></div></div>)}</div> : <div className="mt-5 rounded-2xl border border-dashed border-slate-200 p-7 text-center text-slate-500"><LockKeyhole className="mx-auto h-7 w-7 text-slate-300"/><p className="mt-2">Complete your first lesson to unlock an achievement.</p></div>}
      </article>
      <LearningCalendar dates={profile.calendar}/>
    </div>

    <article className="mt-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3"><div className="flex items-center gap-2"><Trophy className="h-5 w-5 text-amber-600"/><h3 className="text-lg font-bold">Leaderboard</h3></div><label className="flex cursor-pointer items-center gap-2 text-sm text-slate-600"><input type="checkbox" checked={profile.leaderboard_visible} disabled={saving} onChange={event => updateSettings({ leaderboard_visible: event.target.checked })} className="h-4 w-4 accent-amber-500"/> Show my profile</label></div>
      <p className="mt-1 text-xs text-slate-500">Private by default. Only learners who opt in appear here.</p>
      {leaders.length ? <ol className="mt-5 divide-y divide-slate-100">{leaders.slice(0, 10).map(person => <li key={`${person.rank}-${person.name}`} className={`grid grid-cols-[2.5rem_1fr_auto] items-center gap-3 py-3 ${person.is_current_user ? 'font-bold text-amber-800' : ''}`}><span className="text-center tabular-nums">#{person.rank}</span><span>{person.name}{person.is_current_user && ' (You)'}</span><span className="tabular-nums">{person.xp.toLocaleString()} XP</span></li>)}</ol> : <p className="mt-5 rounded-2xl bg-slate-50 p-5 text-center text-sm text-slate-500">No learners have opted in yet.</p>}
    </article>
  </section>;
}

function LearningCalendar({ dates }) {
  const activeDates = useMemo(() => new Set(dates), [dates]);
  const days = useMemo(() => Array.from({ length: 35 }, (_, index) => {
    const date = new Date();
    date.setHours(12, 0, 0, 0);
    date.setDate(date.getDate() - (34 - index));
    return date.toISOString().slice(0, 10);
  }), []);

  return <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"><h3 className="font-bold">Learning calendar</h3><p className="mt-1 text-sm text-slate-500">Your last five weeks of activity</p><div className="mt-5 grid grid-cols-7 gap-2" aria-label="Learning activity calendar">{days.map(date => <span key={date} title={`${date}${activeDates.has(date) ? ': active' : ''}`} className={`aspect-square rounded-md ${activeDates.has(date) ? 'bg-emerald-500' : 'bg-slate-100'}`}/>)}</div><div className="mt-4 flex items-center gap-2 text-xs text-slate-500"><span className="h-3 w-3 rounded-sm bg-emerald-500"/> Learning activity</div></article>;
}

function GamificationSkeleton() {
  return <div className="mt-8 animate-pulse space-y-5" aria-label="Loading learning rewards"><div className="h-7 w-44 rounded bg-slate-200"/><div className="grid gap-4 md:grid-cols-3"><div className="h-48 rounded-3xl bg-slate-200 md:col-span-2"/><div className="h-48 rounded-3xl bg-slate-200"/></div></div>;
}
