import { useEffect, useState } from 'react';
import { Star, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import api from '../api/client';
import useAuth from '../context/useAuth';

export default function CourseReviews({ course }) {
  const { t, i18n } = useTranslation('courses');
  const { user, isAuthenticated } = useAuth();
  const student = user?.roles?.some(role => role.name === 'student');
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState({ average_rating: 0, review_count: 0, distribution: {} });
  const [own, setOwn] = useState(null);
  const [rating, setRating] = useState(5);
  const [text, setText] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const message = error => error.response?.data?.message || Object.values(error.response?.data?.errors || {})[0]?.[0] || t('reviews.actionFailed');

  const load = async () => {
    const [list, summary] = await Promise.all([api.get(`/api/courses/${course.id}/reviews`), api.get(`/api/courses/${course.id}/rating`)]);
    setReviews(list.data.data || []);
    setStats(summary.data.data);
    if (isAuthenticated && student) {
      const mine = await api.get(`/api/courses/${course.id}/my-review`);
      setOwn(mine.data.data);
      if (mine.data.data) { setRating(mine.data.data.rating); setText(mine.data.data.review_text); }
    }
  };

  useEffect(() => { load().catch(() => setNotice(t('reviews.loadError'))); }, [course.id, isAuthenticated, student, t]); // eslint-disable-line react-hooks/exhaustive-deps
  const submit = async event => {
    event.preventDefault(); setBusy(true); setNotice('');
    try {
      if (own) await api.put(`/api/reviews/${own.id}`, { rating, review_text: text });
      else await api.post(`/api/courses/${course.id}/reviews`, { rating, review_text: text });
      setNotice(t(own ? 'reviews.updated' : 'reviews.published')); await load();
    } catch (error) { setNotice(message(error)); } finally { setBusy(false); }
  };
  const remove = async () => {
    if (!window.confirm(t('reviews.deleteConfirm'))) return;
    try { await api.delete(`/api/reviews/${own.id}`); setOwn(null); setText(''); setRating(5); await load(); }
    catch (error) { setNotice(message(error)); }
  };

  return <section className="border-t border-slate-200 py-20"><div className="section-shell"><div className="grid gap-12 lg:grid-cols-[320px_1fr]">
    <aside><p className="section-kicker">{t('reviews.eyebrow')}</p><h2 className="section-title">{t('reviews.title')}</h2><div className="mt-8 flex items-end gap-3"><strong className="text-6xl text-slate-950">{Number(stats.average_rating).toFixed(1)}</strong><div><Stars value={Math.round(stats.average_rating)}/><p className="mt-1 text-sm text-slate-500">{t('reviews.count', { count: stats.review_count })}</p></div></div><div className="mt-8 space-y-3">{[5, 4, 3, 2, 1].map(star => { const count = stats.distribution?.[star] || 0; const width = stats.review_count ? count / stats.review_count * 100 : 0; return <div key={star} className="flex items-center gap-3 text-sm"><span>{star}</span><div className="h-2 flex-1 rounded-full bg-slate-100"><div className="h-full rounded-full bg-primary" style={{ width: `${width}%` }}/></div><span className="w-6 text-end text-slate-500">{count}</span></div>; })}</div></aside>
    <div>{student && <form onSubmit={submit} className="mb-10 rounded-2xl border border-slate-200 bg-slate-50 p-6"><div className="flex justify-between"><h3 className="text-xl font-bold">{t(own ? 'reviews.edit' : 'reviews.share')}</h3>{own && <button type="button" onClick={remove} className="text-red-600" aria-label={t('reviews.delete')}><Trash2/></button>}</div><label className="mt-5 block text-sm font-semibold">{t('reviews.rating')}</label><div className="mt-2 flex gap-1">{[1, 2, 3, 4, 5].map(value => <button type="button" key={value} onClick={() => setRating(value)} aria-label={t('reviews.stars', { count: value })}><Star className={`h-7 w-7 ${value <= rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`}/></button>)}</div><label className="mt-5 block text-sm font-semibold" htmlFor="review-text">{t('reviews.review')}</label><textarea id="review-text" className="field mt-2 min-h-32" value={text} onChange={event => setText(event.target.value)} minLength={10} maxLength={5000} required placeholder={t('reviews.placeholder')}/><button disabled={busy} className="action mt-4">{busy ? t('reviews.saving') : t(own ? 'reviews.update' : 'reviews.publish')}</button>{notice && <p className="notice">{notice}</p>}</form>}
      <div className="space-y-5">{reviews.length ? reviews.map(review => <article key={review.id} className="rounded-2xl border border-slate-200 p-6"><div className="flex justify-between"><div><strong>{review.user?.name}</strong><Stars value={review.rating}/></div><time className="text-sm text-slate-400">{new Date(review.created_at).toLocaleDateString(i18n.language)}</time></div><p className="mt-4 leading-7 text-slate-600">{review.review_text}</p></article>) : <div className="rounded-2xl bg-slate-50 p-8 text-center text-slate-500">{t('reviews.empty')}</div>}</div>
    </div>
  </div></div></section>;
}

function Stars({ value }) { return <div className="mt-1 flex gap-0.5 text-amber-400">{[1, 2, 3, 4, 5].map(star => <Star key={star} className={`h-4 w-4 ${star <= value ? 'fill-current' : ''}`}/>)}</div>; }
