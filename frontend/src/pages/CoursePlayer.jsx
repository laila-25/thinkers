import { useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, Bookmark, BookOpenCheck, CheckCircle2, ChevronLeft, ChevronRight, Menu, PanelLeftClose, RefreshCw, Star } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router';
import api from '../api/client';
import QuizPlayer from '../components/QuizPlayer';
import VideoPlayer from '../components/VideoPlayer';
import AILessonActions from '../features/ai/AILessonActions';
import { useTranslation } from 'react-i18next';
import PageBackground from '../components/PageBackground';

export default function CoursePlayer() {
  const { t } = useTranslation('courses');
  const { enrollmentId, lessonId } = useParams();
  const navigate = useNavigate();
  const [enrollment, setEnrollment] = useState(null);
  const [lesson, setLesson] = useState(null);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [notice, setNotice] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [notes, setNotes] = useState('');
  const [enrollmentLoading, setEnrollmentLoading] = useState(true);
  const [lessonLoading, setLessonLoading] = useState(false);
  const timer = useRef();
  const lessons = useMemo(() => enrollment?.sections.flatMap(section => section.lessons) || [], [enrollment]);
  const loadedEnrollmentId = enrollment?.id;
  const firstLessonId = lessons[0]?.id;
  const currentIndex = lessons.findIndex(item => item.id === lesson?.id);
  const currentEntry = lessons[currentIndex];
  const previousLesson = lessons[currentIndex - 1];
  const nextLesson = lessons[currentIndex + 1];
  const completedLessons = lessons.filter(item => item.progress?.status === 'completed').length;
  const remainingLessons = Math.max(0, lessons.length - completedLessons);

  const refresh = async () => {
    const { data } = await api.get(`/api/learning/enrollments/${enrollmentId}`);
    setEnrollment(data.data);
    return data.data;
  };

  useEffect(() => {
    const controller = new AbortController();
    setError('');
    setEnrollment(null);
    setLesson(null);
    setEnrollmentLoading(true);
    api.get(`/api/learning/enrollments/${enrollmentId}`, { signal: controller.signal })
      .then(({ data }) => setEnrollment(data.data))
      .catch(requestError => {
        if (requestError.code !== 'ERR_CANCELED') {
          setError(requestError.response?.data?.message || t('player.noAccess'));
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setEnrollmentLoading(false);
      });
    return () => controller.abort();
  }, [enrollmentId, t]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const id = lessonId || enrollment?.last_accessed_lesson_id || firstLessonId;
    if (!loadedEnrollmentId || !id) {
      setLessonLoading(false);
      return;
    }
    const controller = new AbortController();
    setError('');
    setLesson(null);
    setLessonLoading(true);
    api.get(`/api/learning/lessons/${id}`, { signal: controller.signal })
      .then(({ data }) => setLesson(data.data))
      .catch(requestError => {
        if (requestError.code !== 'ERR_CANCELED') {
          setError(requestError.response?.data?.message || t('player.lessonUnavailable'));
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLessonLoading(false);
      });
    return () => controller.abort();
  }, [lessonId, enrollment?.last_accessed_lesson_id, firstLessonId, loadedEnrollmentId, t]);

  useEffect(() => { setNotes(currentEntry?.progress?.notes || ''); }, [currentEntry?.id, currentEntry?.progress?.notes]);
  useEffect(() => () => clearTimeout(timer.current), []);

  const goTo = target => {
    if (!target) return;
    setSidebarOpen(false);
    navigate(`/learn/${enrollmentId}/lessons/${target.id}`);
  };

  const progress = async (status, percentage, position = 0) => {
    setActionError('');
    try {
      const { data } = await api.put(`/api/enrollments/${enrollmentId}/lessons/${lesson.id}/progress`, {
        status, completion_percentage: percentage, playback_position: Math.floor(position),
      });
      setEnrollment(data.data);
      return data.data;
    } catch (requestError) {
      setActionError(requestError.response?.data?.message || t('player.progressFailed'));
      return null;
    }
  };

  const track = ({ currentTime, duration }) => {
    if (enrollment?.status !== 'active' || currentEntry?.progress?.status === 'completed') return;
    clearTimeout(timer.current);
    timer.current = setTimeout(() => progress('in_progress', duration ? Math.min(99, Math.floor(currentTime / duration * 100)) : 0, currentTime), 1500);
  };

  const complete = async moveNext => {
    if (currentEntry?.progress?.status === 'completed') {
      if (moveNext && nextLesson) goTo(nextLesson);
      return;
    }
    if (enrollment.status !== 'active') return;
    const updated = await progress('completed', 100, currentEntry?.progress?.playback_position || 0);
    if (updated && moveNext && nextLesson) goTo(nextLesson);
  };

  const saveInteraction = async changes => {
    setActionError('');
    try {
      await api.patch(`/api/enrollments/${enrollmentId}/lessons/${lesson.id}/interaction`, changes);
      await refresh();
      setNotice('Saved');
      setTimeout(() => setNotice(''), 1600);
    } catch (requestError) {
      setActionError(requestError.response?.data?.message || 'Your lesson changes could not be saved.');
    }
  };

  useEffect(() => {
    const shortcut = event => {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement || event.target?.isContentEditable) return;
      if (event.key === 'ArrowRight') goTo(nextLesson);
      if (event.key === 'ArrowLeft') goTo(previousLesson);
      if (event.key.toLowerCase() === 'b' && lesson) saveInteraction({ is_bookmarked: !currentEntry?.progress?.is_bookmarked });
    };
    window.addEventListener('keydown', shortcut);
    return () => window.removeEventListener('keydown', shortcut);
  });

  if (error) return <PlayerUnavailable message={error} t={t}/>;
  if (enrollmentLoading || lessonLoading) return <PageBackground variant="player" className="min-h-screen"><PlayerSkeleton/></PageBackground>;
  if (!enrollment) return <PlayerUnavailable message={t('player.noAccess')} t={t}/>;
  if (!lessons.length) return <PlayerUnavailable message={t('playerUnavailable.noPublishedLessons')} t={t} showDashboardLink/>;
  if (!lesson) return <PlayerUnavailable message={t('player.lessonUnavailable')} t={t}/>;

  const nextLessonTitle = nextLesson?.title || t('player.reviewNext');
  const lessonCompleted = currentEntry?.progress?.status === 'completed';
  const aiContext = { courseId: enrollment.course.id, lessonId: lesson.id, courseTitle: enrollment.course.title, lessonTitle: lesson.title, lessonContent: lesson.text_content, lessonType: lesson.content_type, description: lesson.description, category: enrollment.course.category?.name, instructor: enrollment.course.instructor?.name, level: enrollment.course.level, duration: enrollment.course.duration, nextLesson: nextLessonTitle };

  return <PageBackground variant="player" className="min-h-screen"><section className="min-h-screen bg-transparent py-6 sm:py-10">
    <div className="section-shell">
      <header className="mb-6 rounded-3xl border border-white/20 bg-white/95 p-5 shadow-[0_24px_70px_-38px_rgba(0,0,0,.65)] backdrop-blur-xl sm:p-6 dark:border-slate-700 dark:bg-slate-900/90">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex items-start gap-3"><button type="button" onClick={() => setSidebarOpen(true)} className="rounded-xl border border-slate-200 p-2 lg:hidden" aria-label="Open lessons"><Menu className="h-5 w-5"/></button><div><p className="section-kicker">{t('player.workspace')}</p><h1 className="mt-2 text-2xl font-bold sm:text-3xl">{enrollment.course.title}</h1><p className="mt-2 text-sm text-slate-500">{remainingLessons} lessons remaining</p></div></div>
          <div className="min-w-52"><div className="flex justify-between text-xs font-semibold text-slate-500"><span>{t('player.progress')}</span><AnimatedPercentage value={enrollment.completion_percentage}/></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-[#F5C542] transition-[width] duration-700 ease-out" style={{ width: `${enrollment.completion_percentage}%` }}/></div></div>
        </div>
      </header>

      <div className={`grid gap-6 transition-[grid-template-columns] duration-300 ${sidebarCollapsed ? 'lg:grid-cols-[64px_1fr]' : 'lg:grid-cols-[300px_1fr]'}`}>
        <button type="button" aria-label="Close lessons" onClick={() => setSidebarOpen(false)} className={`fixed inset-0 z-40 bg-slate-950/40 transition lg:hidden ${sidebarOpen ? 'opacity-100' : 'pointer-events-none opacity-0'}`}/>
        <aside className={`fixed inset-y-0 left-0 z-50 w-80 overflow-y-auto bg-white/95 p-4 shadow-2xl backdrop-blur-xl transition-transform dark:bg-slate-900/95 lg:static lg:z-auto lg:w-auto lg:translate-x-0 lg:bg-transparent lg:p-0 lg:shadow-none lg:backdrop-blur-none ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="mb-3 flex justify-end"><button type="button" onClick={() => setSidebarCollapsed(value => !value)} className="hidden rounded-xl border border-slate-200 bg-white p-2 text-slate-500 hover:text-slate-950 lg:block" aria-label="Collapse lesson sidebar"><PanelLeftClose className={`h-5 w-5 transition ${sidebarCollapsed ? 'rotate-180' : ''}`}/></button></div>
          {!sidebarCollapsed && <div className="space-y-4">{enrollment.sections.map(section => <div key={section.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><h2 className="flex items-center gap-2 font-bold"><BookOpenCheck className="h-4 w-4 text-amber-600"/>{section.title}</h2><div className="mt-3 space-y-1">{section.lessons.map(item => <Link key={item.id} to={`/learn/${enrollmentId}/lessons/${item.id}`} onClick={() => setSidebarOpen(false)} aria-current={item.id === lesson.id ? 'step' : undefined} className={`block rounded-xl p-3 text-sm transition ${item.id === lesson.id ? 'bg-amber-50 font-semibold text-slate-950 ring-1 ring-amber-200' : 'text-slate-600 hover:bg-slate-50'}`}><span className="flex items-center justify-between gap-2"><span className="truncate">{item.title}</span>{item.progress?.status === 'completed' && <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600"/>}</span><small className="mt-1 block text-slate-400">{item.progress?.completion_percentage || 0}% complete</small></Link>)}</div></div>)}</div>}
        </aside>

        <div className="min-w-0 space-y-6">
          <main className="rounded-3xl border border-white/20 bg-white/95 p-5 shadow-[0_28px_90px_-42px_rgba(0,0,0,.78)] backdrop-blur-xl sm:p-8 dark:border-slate-700 dark:bg-slate-900/92">
            <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-wider text-amber-700">Lesson {currentIndex + 1} of {lessons.length}</p><h2 className="mt-2 text-2xl font-bold sm:text-3xl">{lesson.title}</h2><p className="mt-2 text-slate-500">{lesson.description}</p></div><div className="flex gap-2"><button type="button" onClick={() => saveInteraction({ is_bookmarked: !currentEntry?.progress?.is_bookmarked })} className={`rounded-xl border p-2.5 ${currentEntry?.progress?.is_bookmarked ? 'border-amber-300 bg-amber-50 text-amber-700' : 'border-slate-200 text-slate-500'}`} aria-label="Bookmark lesson"><Bookmark className={`h-5 w-5 ${currentEntry?.progress?.is_bookmarked ? 'fill-current' : ''}`}/></button><button type="button" onClick={() => saveInteraction({ is_important: !currentEntry?.progress?.is_important })} className={`rounded-xl border p-2.5 ${currentEntry?.progress?.is_important ? 'border-amber-300 bg-amber-50 text-amber-700' : 'border-slate-200 text-slate-500'}`} aria-label="Mark lesson important"><Star className={`h-5 w-5 ${currentEntry?.progress?.is_important ? 'fill-current' : ''}`}/></button></div></div>
            {notice && <p className="mt-3 text-sm font-semibold text-emerald-700" role="status">{notice}</p>}
            {actionError && <p className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700" role="alert">{actionError}</p>}
            <div className={`mt-7 ${lesson.content_type === 'video' ? 'lg:sticky lg:top-24 lg:z-10' : ''}`}>{lesson.content_type === 'text' && <div className="lesson-content" dangerouslySetInnerHTML={{ __html: lesson.text_content || `<p>${t('player.noContent')}</p>` }}/>} {lesson.content_type === 'video' && (lesson.video ? <VideoPlayer src={lesson.video.stream_url} type={lesson.video.mime_type} startTime={currentEntry?.progress?.playback_position || 0} onProgress={track} onEnded={() => complete(true)}/> : <p>{t('player.videoUnavailable')}</p>)}{lesson.content_type === 'quiz' && <QuizPlayer lesson={lesson} onProgressChanged={refresh}/>}</div>
            <div className="mt-8 grid gap-5 lg:grid-cols-2"><div><h3 className="font-bold">Lesson notes</h3><textarea value={notes} onChange={event => setNotes(event.target.value)} maxLength={10000} rows={5} className="mt-3 w-full resize-y rounded-2xl border border-slate-200 p-4 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100" placeholder="Write private notes for this lesson…"/><div className="mt-2 flex items-center justify-between"><small className="text-slate-400">{notes.length}/10000</small><button type="button" onClick={() => saveInteraction({ notes })} className="action">Save notes</button></div></div><div><h3 className="font-bold">{t('player.resources')}</h3>{lesson.attachments?.length ? lesson.attachments.map(item => <a key={item.id} className="mt-3 block rounded-xl border border-slate-200 p-3 text-amber-700 hover:bg-amber-50" href={item.download_url}>{item.display_name}</a>) : <p className="mt-3 text-sm text-slate-500">{t('player.noResources')}</p>}</div></div>
            <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-6"><button type="button" disabled={!previousLesson} onClick={() => goTo(previousLesson)} className="flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-3 font-bold disabled:opacity-40"><ChevronLeft className="h-4 w-4"/>Previous</button><button type="button" disabled={lessonCompleted && !nextLesson} onClick={() => complete(true)} className="action disabled:cursor-not-allowed disabled:opacity-60">{lessonCompleted ? (nextLesson ? 'Next lesson' : 'Lesson completed') : (nextLesson ? 'Complete & next' : t('player.markComplete'))}<ChevronRight className="h-4 w-4"/></button></div>
            <p className="mt-4 text-center text-xs text-slate-400">Shortcuts: ← previous · → next · B bookmark</p>
          </main>
          <AILessonActions context={aiContext}/>
        </div>
      </div>
    </div>
  </section></PageBackground>;
}

function AnimatedPercentage({ value }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    const start = display; const difference = value - start; const startedAt = performance.now();
    let frame;
    const animate = time => { const progress = Math.min(1, (time - startedAt) / 500); setDisplay(Math.round(start + difference * progress)); if (progress < 1) frame = requestAnimationFrame(animate); };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps
  return <span className="tabular-nums">{display}%</span>;
}

function PlayerSkeleton() {
  return <div className="section-shell animate-pulse py-10 motion-reduce:animate-none"><div className="h-28 rounded-3xl bg-slate-200 dark:bg-slate-700"/><div className="mt-6 grid gap-6 lg:grid-cols-[300px_1fr]"><div className="h-96 rounded-3xl bg-slate-200 dark:bg-slate-700"/><div className="space-y-5 rounded-3xl bg-white p-8 dark:bg-slate-900"><div className="h-8 w-2/3 rounded bg-slate-200 dark:bg-slate-700"/><div className="aspect-video rounded-2xl bg-slate-900/80"/><div className="h-28 rounded-2xl bg-slate-200 dark:bg-slate-700"/></div></div></div>;
}

function PlayerUnavailable({ message, t, showDashboardLink = false }) {
  return <PageBackground variant="player" className="min-h-screen">
    <main className="section-shell grid min-h-[72vh] place-items-center py-16">
      <section className="max-w-xl rounded-3xl border border-amber-300/30 bg-slate-900/90 p-8 text-center shadow-2xl backdrop-blur-xl sm:p-10" role="alert">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-amber-400/15 text-amber-300"><AlertTriangle className="h-7 w-7"/></span>
        <h1 className="mt-5 text-2xl font-black text-white">{t('playerUnavailable.title')}</h1>
        <p className="mt-3 text-slate-300">{message}</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button type="button" onClick={() => window.location.reload()} className="action gap-2"><RefreshCw className="h-4 w-4"/>{t('playerUnavailable.tryAgain')}</button>
          {showDashboardLink && <Link to="/student/dashboard" className="rounded-xl border border-slate-600 px-5 py-3 font-bold text-white transition hover:border-amber-400">{t('playerUnavailable.backToDashboard')}</Link>}
        </div>
      </section>
    </main>
  </PageBackground>;
}
