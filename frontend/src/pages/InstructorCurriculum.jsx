import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, Check, FileUp, GripVertical, LoaderCircle, Pencil, Plus, Trash2, Upload, X } from 'lucide-react';
import { Link, useParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import api from '../api/client';
import PageBackground from '../components/PageBackground';

const QuizBuilder = lazy(() => import('../components/QuizBuilder'));
const RichTextEditor = lazy(() => import('../components/RichTextEditor'));
const lessonTypes = ['video', 'text', 'quiz', 'resource'];
const message = (error, fallback) => error.response?.data?.message || Object.values(error.response?.data?.errors || {})[0]?.[0] || fallback;

export default function InstructorCurriculum() {
  const { courseId } = useParams();
  const { t } = useTranslation('courses');
  const [course, setCourse] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [notice, setNotice] = useState('');
  const [saveState, setSaveState] = useState('saved');
  const [upload, setUpload] = useState({ kind: '', progress: 0, file: null });
  const dragged = useRef(null);

  const load = useCallback(async (signal) => {
    const { data } = await api.get(`/api/manage/courses/${courseId}/curriculum`, { signal });
    setCourse(data.data);
    setSelectedId(current => current || data.data.sections[0]?.lessons[0]?.id || null);
  }, [courseId]);

  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal).catch(error => error.code !== 'ERR_CANCELED' && setNotice(message(error, t('curriculumEditor.loadFailed'))));
    return () => controller.abort();
  }, [load, t]);

  const editable = ['draft', 'rejected'].includes(course?.status);
  const selected = useMemo(() => course?.sections.flatMap(section => section.lessons).find(lesson => lesson.id === selectedId), [course, selectedId]);

  const mutate = async action => {
    setSaveState('saving'); setNotice('');
    try { await action(); await load(); setSaveState('saved'); }
    catch (error) { setSaveState('unsaved'); setNotice(message(error, t('curriculumEditor.loadFailed'))); }
  };

  const createSection = async () => {
    const title = window.prompt(t('curriculumEditor.sectionTitle'));
    if (title?.trim()) await mutate(() => api.post(`/api/manage/courses/${courseId}/sections`, { title: title.trim(), position: course.sections.length + 1 }));
  };
  const renameSection = section => {
    const title = window.prompt(t('curriculumEditor.sectionTitle'), section.title);
    if (title?.trim() && title.trim() !== section.title) mutate(() => api.put(`/api/manage/sections/${section.id}`, { title: title.trim() }));
  };
  const deleteSection = section => window.confirm(t('curriculumEditor.deleteSection')) && mutate(() => api.delete(`/api/manage/sections/${section.id}`));
  const createLesson = (section, contentType) => {
    const title = window.prompt(t('curriculumEditor.lessonTitle'));
    if (title?.trim()) mutate(() => api.post(`/api/manage/sections/${section.id}/lessons`, { title: title.trim(), content_type: contentType, duration: 0, position: section.lessons.length + 1, is_published: false, is_preview: false }));
  };
  const renameLesson = lesson => {
    const title = window.prompt(t('curriculumEditor.lessonTitle'), lesson.title);
    if (title?.trim() && title.trim() !== lesson.title) mutate(() => api.put(`/api/manage/lessons/${lesson.id}`, { title: title.trim() }));
  };
  const deleteLesson = lesson => window.confirm(t('curriculumEditor.deleteLesson')) && mutate(async () => { await api.delete(`/api/manage/lessons/${lesson.id}`); setSelectedId(null); });

  const reorder = async (kind, targetId, section) => {
    const source = dragged.current;
    if (!source || source.kind !== kind || source.id === targetId || (kind === 'lesson' && source.sectionId !== section.id)) return;
    if (kind === 'section') {
      const rows = move(course.sections, source.id, targetId);
      setCourse({ ...course, sections: rows });
      await mutate(() => api.put(`/api/manage/courses/${courseId}/sections/reorder`, { ids: rows.map(item => item.id) }));
    } else {
      const rows = move(section.lessons, source.id, targetId);
      setCourse({ ...course, sections: course.sections.map(item => item.id === section.id ? { ...item, lessons: rows } : item) });
      await mutate(() => api.put(`/api/manage/sections/${section.id}/lessons/reorder`, { ids: rows.map(item => item.id) }));
    }
    dragged.current = null;
  };

  const uploadFile = async (kind, file) => {
    if (!file || !selected) return;
    const controller = new AbortController();
    setUpload({ kind, progress: 0, file, controller });
    const form = new FormData();
    form.append(kind === 'video' ? 'video' : 'file', file);
    try {
      await api.post(`/api/manage/lessons/${selected.id}/${kind === 'video' ? 'video' : 'attachments'}`, form, {
        signal: controller.signal,
        onUploadProgress: event => setUpload(current => ({ ...current, progress: event.total ? Math.round(event.loaded * 100 / event.total) : 0 })),
      });
      setUpload({ kind: '', progress: 100, file: null }); await load();
    } catch (error) {
      if (error.code !== 'ERR_CANCELED') setNotice(message(error, t('curriculumEditor.uploadFailed')));
      setUpload(current => ({ ...current, kind: '', controller: null }));
    }
  };

  if (!course) return <PageBackground variant="instructor" className="min-h-screen"><div className="mx-auto max-w-7xl px-4 py-20"><div className="h-96 animate-pulse rounded-3xl bg-white/70 dark:bg-slate-900/70"/></div></PageBackground>;
  return <PageBackground variant="instructor" className="min-h-screen"><div className="mx-auto max-w-[1500px] px-4 py-7">
    <header className="sticky top-20 z-30 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/70 bg-white/90 p-4 shadow-lg backdrop-blur-xl dark:border-slate-700 dark:bg-slate-900/90">
      <div className="flex items-center gap-3"><Link to={`/instructor/courses/${courseId}/builder`} className="rounded-xl border p-2" aria-label={t('curriculumEditor.back')}><ArrowLeft/></Link><div><p className="text-xs font-black uppercase tracking-widest text-amber-700">{course.status}</p><h1 className="text-xl font-black dark:text-white">{course.title}</h1></div></div>
      <div className="flex items-center gap-2 text-sm font-bold">{saveState === 'saving' ? <LoaderCircle className="h-4 w-4 animate-spin"/> : saveState === 'saved' ? <Check className="h-4 w-4 text-emerald-500"/> : <span className="text-amber-600">!</span>}{t(`builderStudio.${saveState}`)}</div>
    </header>
    {notice && <p role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">{notice}</p>}
    {!editable && <p className="notice mt-4">{t('curriculumEditor.readOnly')}</p>}
    <div className="mt-5 grid gap-5 lg:grid-cols-[390px_1fr]">
      <aside className="self-start rounded-3xl border border-white/70 bg-white/90 p-4 shadow-xl backdrop-blur-xl dark:border-slate-700 dark:bg-slate-900/90 lg:sticky lg:top-44">
        <div className="flex items-center justify-between"><h2 className="font-black dark:text-white">{t('builderStudio.curriculum')}</h2>{editable && <button onClick={createSection} className="rounded-xl bg-amber-400 p-2 text-slate-950" aria-label={t('curriculumEditor.addSection')}><Plus/></button>}</div>
        <div className="mt-4 max-h-[65vh] space-y-3 overflow-y-auto pe-1">{course.sections.map(section => <SectionTree key={section.id} section={section} editable={editable} selectedId={selectedId} select={setSelectedId} dragged={dragged} reorder={reorder} renameSection={renameSection} deleteSection={deleteSection} createLesson={createLesson}/>)}
        {!course.sections.length && <p className="rounded-xl border border-dashed p-6 text-center text-sm text-slate-500">{t('curriculumEditor.empty')}</p>}</div>
      </aside>
      <main className="min-h-[620px] rounded-3xl border border-white/70 bg-white/90 p-5 shadow-xl backdrop-blur-xl dark:border-slate-700 dark:bg-slate-900/90 sm:p-7">
        {!selected ? <div className="grid min-h-[500px] place-items-center text-slate-500">{t('curriculumEditor.selectLesson')}</div> : <LessonEditor lesson={selected} editable={editable} mutate={mutate} rename={() => renameLesson(selected)} remove={() => deleteLesson(selected)} upload={upload} uploadFile={uploadFile} t={t}/>}
      </main>
    </div>
  </div></PageBackground>;
}

function SectionTree({ section, editable, selectedId, select, dragged, reorder, renameSection, deleteSection, createLesson }) {
  const [adding, setAdding] = useState(false);
  return <div draggable={editable} onDragStart={() => { dragged.current = { kind: 'section', id: section.id }; }} onDragOver={event => event.preventDefault()} onDrop={() => reorder('section', section.id)} className="rounded-2xl border border-slate-200 bg-slate-50/80 p-3 dark:border-slate-700 dark:bg-slate-800/70">
    <div className="flex items-center gap-2"><GripVertical className="h-4 w-4 text-slate-400"/><strong className="min-w-0 flex-1 truncate dark:text-white">{section.title}</strong>{editable && <><button onClick={() => renameSection(section)} aria-label="Rename"><Pencil className="h-4 w-4"/></button><button onClick={() => deleteSection(section)} className="text-red-500" aria-label="Delete"><Trash2 className="h-4 w-4"/></button></>}</div>
    <div className="mt-2 space-y-1">{section.lessons.map(lesson => <button draggable={editable} onDragStart={event => { event.stopPropagation(); dragged.current = { kind: 'lesson', id: lesson.id, sectionId: section.id }; }} onDragOver={event => event.preventDefault()} onDrop={event => { event.stopPropagation(); reorder('lesson', lesson.id, section); }} key={lesson.id} onClick={() => select(lesson.id)} className={`flex w-full items-center gap-2 rounded-xl p-2 text-start text-sm ${selectedId === lesson.id ? 'bg-amber-100 font-bold text-slate-950 dark:bg-amber-400' : 'hover:bg-white dark:text-slate-200 dark:hover:bg-slate-700'}`}><GripVertical className="h-3 w-3"/><span className="min-w-0 flex-1 truncate">{lesson.title}</span><small>{lesson.content_type}</small></button>)}</div>
    {editable && <div className="mt-2">{adding ? <div className="grid grid-cols-2 gap-1">{lessonTypes.map(type => <button key={type} onClick={() => { createLesson(section, type); setAdding(false); }} className="rounded-lg border p-2 text-xs font-bold capitalize dark:border-slate-600 dark:text-white">{type}</button>)}<button onClick={() => setAdding(false)} className="col-span-2 text-xs text-slate-500">Cancel</button></div> : <button onClick={() => setAdding(true)} className="w-full rounded-lg border border-dashed p-2 text-xs font-bold text-amber-700">+ Add lesson</button>}</div>}
  </div>;
}

function LessonEditor({ lesson, editable, mutate, rename, remove, upload, uploadFile, t }) {
  const [content, setContent] = useState(lesson.text_content || '');
  const timer = useRef();
  useEffect(() => { setContent(lesson.text_content || ''); }, [lesson.id, lesson.text_content]);
  const changeContent = value => {
    setContent(value);
    if (!editable) return;
    clearTimeout(timer.current);
    timer.current = setTimeout(() => mutate(() => api.put(`/api/manage/lessons/${lesson.id}/content`, { content: value })), 800);
  };
  useEffect(() => () => clearTimeout(timer.current), []);
  return <div><div className="flex flex-wrap items-start justify-between gap-4"><div><span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-black uppercase text-amber-800">{lesson.content_type}</span><h2 className="mt-3 text-2xl font-black dark:text-white">{lesson.title}</h2></div>{editable && <div className="flex gap-2"><button onClick={rename} className="rounded-xl border p-2"><Pencil/></button><button onClick={remove} className="rounded-xl border p-2 text-red-500"><Trash2/></button></div>}</div>
    <div className="mt-7">
      {lesson.content_type === 'text' && <Suspense fallback={<EditorSkeleton/>}><RichTextEditor value={content} onChange={changeContent}/></Suspense>}
      {lesson.content_type === 'quiz' && <Suspense fallback={<EditorSkeleton/>}><QuizBuilder lesson={lesson} editable={editable}/></Suspense>}
      {lesson.content_type === 'video' && <><MediaPreview lesson={lesson}/><Uploader kind="video" accept="video/mp4,video/webm,video/quicktime" editable={editable} upload={upload} uploadFile={uploadFile} t={t}/></>}
      {lesson.content_type !== 'quiz' && <Resources lesson={lesson} editable={editable} remove={id => mutate(() => api.delete(`/api/manage/attachments/${id}`))} upload={upload} uploadFile={uploadFile} t={t}/>}
    </div>
  </div>;
}
const MediaPreview = ({ lesson }) => lesson.video ? <video className="aspect-video w-full rounded-2xl bg-black" controls preload="metadata" src={lesson.video.stream_url}/> : null;
function Uploader({ kind, accept, editable, upload, uploadFile, t }) { return editable && <div className="mt-5 rounded-2xl border border-dashed p-5"><label className="flex cursor-pointer items-center gap-3 font-bold"><Upload/><span>{t(kind === 'video' ? 'curriculumEditor.uploadVideo' : 'curriculumEditor.uploadResource')}</span><input className="sr-only" type="file" accept={accept} onChange={event => uploadFile(kind, event.target.files[0])}/></label>{upload.kind === kind && <div className="mt-4"><div className="h-2 rounded-full bg-slate-200"><div className="h-full rounded-full bg-amber-400" style={{ width: `${upload.progress}%` }}/></div><div className="mt-2 flex justify-between text-xs"><span>{upload.progress}%</span><button onClick={() => upload.controller?.abort()} className="text-red-500"><X className="inline h-3 w-3"/> Cancel</button></div></div>}{!upload.kind && upload.file && <button onClick={() => uploadFile(kind, upload.file)} className="mt-3 text-sm font-bold text-amber-700">Retry upload</button>}</div>; }
function Resources({ lesson, editable, remove, upload, uploadFile, t }) { return <div className="mt-8 border-t pt-6"><h3 className="font-black dark:text-white">{t('curriculumEditor.resources')}</h3><div className="mt-3 space-y-2">{lesson.attachments?.map(file => <div key={file.id} className="flex items-center justify-between rounded-xl bg-slate-50 p-3 dark:bg-slate-800"><span className="flex items-center gap-2"><FileUp className="h-4 w-4"/>{file.display_name}</span>{editable && <button onClick={() => remove(file.id)} className="text-red-500"><Trash2 className="h-4 w-4"/></button>}</div>)}</div><Uploader kind="attachment" accept=".pdf,.zip,.doc,.docx" editable={editable} upload={upload} uploadFile={uploadFile} t={t}/></div>; }
const EditorSkeleton = () => <div className="h-72 animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-800"/>;
const move = (rows, sourceId, targetId) => { const next = [...rows]; const sourceIndex = next.findIndex(item => item.id === sourceId); const targetIndex = next.findIndex(item => item.id === targetId); next.splice(targetIndex, 0, next.splice(sourceIndex, 1)[0]); return next; };
