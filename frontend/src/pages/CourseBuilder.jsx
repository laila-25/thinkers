import { useEffect, useRef, useState } from 'react';
import { Check, ChevronLeft, ChevronRight, Eye, ImagePlus, LoaderCircle, Save, Send, UploadCloud, X } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import api from '../api/client';
import PageBackground from '../components/PageBackground';
import { getBuilder, getBuilderPreview, submitBuilder, updateBuilder, uploadCourseMedia } from '../api/courseBuilder';

const emptyForm = {
  title: '', subtitle: '', category_id: '', language: 'English', level: 'beginner', type: 'free', price: 0,
  short_description: '', description: '', learning_objectives: [''], requirements: [''], target_audience: [''],
};

const errorMessage = error => {
  const validation = Object.values(error.response?.data?.errors || {}).flat().filter(Boolean);
  return validation.length ? validation.join(' • ') : error.response?.data?.message || error.message;
};

export default function CourseBuilder() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation('courses');
  const isNew = !courseId;
  const [step, setStep] = useState(1);
  const [form, setForm] = useState(emptyForm);
  const [categories, setCategories] = useState([]);
  const [state, setState] = useState({ loading: !isNew, status: 'saved', error: '' });
  const [preview, setPreview] = useState(null);
  const [media, setMedia] = useState({ thumbnail: 0, promotional: 0, uploading: '', error: '' });
  const [pendingMedia, setPendingMedia] = useState({ thumbnail: null, promotional: null });
  const saveTimer = useRef(null);
  const latestSaved = useRef('');

  useEffect(() => {
    const controller = new AbortController();
    api.get('/api/categories', { signal: controller.signal }).then(response => {
      const rows = response.data.data || [];
      setCategories(rows);
      setForm(current => ({ ...current, category_id: current.category_id || rows[0]?.id || '' }));
    });
    if (!isNew) {
      getBuilder(courseId, controller.signal).then(data => {
        const course = data.course;
        const next = {
          ...emptyForm, ...course,
          category_id: course.category?.id || course.category_id,
          learning_objectives: course.learning_objectives?.length ? course.learning_objectives : [''],
          requirements: course.requirements?.length ? course.requirements : [''],
          target_audience: course.target_audience?.length ? course.target_audience : [''],
        };
        setForm(next);
        latestSaved.current = JSON.stringify(clean(next));
        setState({ loading: false, status: 'saved', error: '' });
      }).catch(error => setState({ loading: false, status: 'error', error: errorMessage(error) }));
    }
    return () => controller.abort();
  }, [courseId, isNew]);

  useEffect(() => {
    if (isNew || state.loading || !courseId) return;
    const payload = clean(form);
    const serialized = JSON.stringify(payload);
    if (serialized === latestSaved.current) return;
    setState(current => ({ ...current, status: 'unsaved' }));
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      setState(current => ({ ...current, status: 'saving' }));
      updateBuilder(courseId, payload).then(() => {
        latestSaved.current = serialized;
        setState(current => ({ ...current, status: 'saved', error: '' }));
      }).catch(error => setState(current => ({ ...current, status: 'error', error: errorMessage(error) })));
    }, 700);
    return () => clearTimeout(saveTimer.current);
  }, [courseId, form, isNew, state.loading]);

  useEffect(() => {
    const warn = event => {
      if (state.status === 'saving' || state.status === 'unsaved') {
        event.preventDefault();
        event.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [state.status]);

  useEffect(() => {
    const shortcut = event => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
        event.preventDefault();
        clearTimeout(saveTimer.current);
        if (!isNew) updateBuilder(courseId, clean(form)).then(() => setState(current => ({ ...current, status: 'saved' })));
      }
    };
    window.addEventListener('keydown', shortcut);
    return () => window.removeEventListener('keydown', shortcut);
  }, [courseId, form, isNew]);

  const createDraft = async () => {
    setState(current => ({ ...current, status: 'saving', error: '' }));
    try {
      const payload = clean(form);
      const { data } = await api.post('/api/manage/courses', {
        ...payload,
        duration: 0,
        price: payload.type === 'paid' ? Number(payload.price) : undefined,
      });
      const id = data.data.id;
      await updateBuilder(id, payload);
      for (const kind of ['thumbnail', 'promotional']) {
        if (!pendingMedia[kind]) continue;
        const uploaded = await upload(kind, pendingMedia[kind], id);
        if (!uploaded) {
          navigate(`/instructor/courses/${id}/builder`, { replace: true });
          setStep(1);
          return;
        }
      }
      setPendingMedia({ thumbnail: null, promotional: null });
      navigate(`/instructor/courses/${id}/builder`, { replace: true });
      setStep(3);
    } catch (error) {
      setState(current => ({ ...current, status: 'error', error: errorMessage(error) }));
    }
  };

  const upload = async (kind, file, targetCourseId = courseId) => {
    if (!file || !targetCourseId) return false;
    const controller = new AbortController();
    setMedia(current => ({ ...current, uploading: kind, error: '', controller }));
    try {
      const course = await uploadCourseMedia(targetCourseId, kind, file, progress => setMedia(current => ({ ...current, [kind]: progress })), controller.signal);
      setForm(current => ({ ...current, thumbnail: course.thumbnail, has_promotional_video: course.has_promotional_video, promotional_video_url: course.promotional_video_url }));
      setMedia(current => ({ ...current, uploading: '', controller: null, [kind]: 100 }));
      setState(current => ({ ...current, error: '' }));
      return true;
    } catch (error) {
      if (error.code !== 'ERR_CANCELED') setMedia(current => ({ ...current, uploading: '', controller: null, error: errorMessage(error) }));
      return false;
    }
  };

  const selectMedia = (kind, file) => {
    if (!file) return;
    if (isNew) {
      setPendingMedia(current => ({ ...current, [kind]: file }));
      setMedia(current => ({ ...current, [kind]: 0, error: '' }));
      return;
    }
    void upload(kind, file);
  };

  const submit = async () => {
    try {
      await submitBuilder(courseId);
      navigate('/instructor/dashboard');
    } catch (error) {
      setState(current => ({ ...current, status: 'error', error: errorMessage(error) }));
    }
  };

  const showPreview = async () => {
    try { setPreview(await getBuilderPreview(courseId)); } catch (error) { setState(current => ({ ...current, error: errorMessage(error) })); }
  };

  if (state.loading) return <PageBackground variant="instructor" className="min-h-screen"><div className="mx-auto max-w-6xl px-4 py-20"><div className="h-96 animate-pulse rounded-3xl bg-white/70 dark:bg-slate-900/70"/></div></PageBackground>;

  return <PageBackground variant="instructor" className="min-h-screen"><div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
    <nav className="text-sm text-slate-500"><Link to="/instructor/dashboard">{t('builderStudio.dashboard')}</Link> / <span>{form.title || t('builderStudio.newCourse')}</span></nav>
    <header className="mt-5 flex flex-wrap items-center justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-[.2em] text-amber-700">{t('builderStudio.eyebrow')}</p><h1 className="mt-2 text-3xl font-black text-slate-950 dark:text-white">{form.title || t('builderStudio.newCourse')}</h1></div>{!isNew && <div className="flex gap-2"><button onClick={showPreview} className="inline-flex items-center gap-2 rounded-xl border px-4 py-2 font-bold dark:border-slate-700"><Eye className="h-4 w-4"/>{t('builderStudio.preview')}</button><button disabled={Boolean(media.uploading)} onClick={submit} className="action gap-2 disabled:cursor-not-allowed disabled:opacity-50"><Send className="h-4 w-4"/>{t('builderStudio.submit')}</button></div>}</header>
    <div className="mt-7 grid gap-3 sm:grid-cols-3">{[1,2,3].map(number => <button key={number} onClick={() => (!isNew || number <= 2) && setStep(number)} className={`rounded-2xl border p-4 text-start ${step === number ? 'border-amber-400 bg-amber-50 dark:bg-amber-400/10' : 'border-slate-200 bg-white/75 dark:border-slate-700 dark:bg-slate-900/70'}`}><span className="text-xs font-black text-amber-700">{t('builderStudio.step', { number })}</span><strong className="mt-1 block dark:text-white">{t(`builderStudio.steps.${number}`)}</strong></button>)}</div>
    {state.error && <p className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">{state.error}</p>}
    <main className="mt-6 rounded-3xl border border-white/70 bg-white/88 p-6 shadow-xl backdrop-blur-xl dark:border-slate-700 dark:bg-slate-900/88 sm:p-8">
      {step === 1 && <StepOne form={form} setForm={setForm} categories={categories} t={t} upload={selectMedia} media={media} pendingMedia={pendingMedia} isNew={isNew}/>}
      {step === 2 && <StepTwo form={form} setForm={setForm} t={t}/>}
      {step === 3 && !isNew && <StepThree courseId={courseId} t={t} upload={upload} media={media} form={form}/>}
      <div className="mt-8 flex justify-between border-t border-slate-200 pt-5 dark:border-slate-700"><button disabled={step === 1} onClick={() => setStep(value => value - 1)} className="inline-flex items-center gap-2 rounded-xl border px-4 py-2 font-bold disabled:opacity-40"><ChevronLeft className="h-4 w-4"/>{t('builderStudio.back')}</button>{step < 2 && <button onClick={() => setStep(2)} className="action gap-2">{t('builderStudio.next')}<ChevronRight className="h-4 w-4"/></button>}{step === 2 && (isNew ? <button onClick={createDraft} className="action gap-2"><Save className="h-4 w-4"/>{t('builderStudio.createDraft')}</button> : <button onClick={() => setStep(3)} className="action gap-2">{t('builderStudio.next')}<ChevronRight className="h-4 w-4"/></button>)}</div>
    </main>
    {!isNew && <SaveBar status={state.status} t={t}/>}
    {preview && <PreviewModal data={preview} close={() => setPreview(null)} t={t}/>}
  </div></PageBackground>;
}

function StepOne({ form, setForm, categories, t, upload, media, pendingMedia, isNew }) {
  return <div className="grid gap-5 md:grid-cols-2"><Heading title={t('builderStudio.basic')} description={t('builderStudio.basicHelp')}/><Field label={t('builderStudio.title')}><input required className="field" value={form.title} onChange={event => setForm({ ...form, title: event.target.value })}/></Field><Field label={t('builderStudio.subtitle')}><input className="field" value={form.subtitle || ''} onChange={event => setForm({ ...form, subtitle: event.target.value })}/></Field><Field label={t('builderStudio.category')}><select className="field" value={form.category_id} onChange={event => setForm({ ...form, category_id: Number(event.target.value) })}>{categories.map(category => <option key={category.id} value={category.id}>{category.name}</option>)}</select></Field><Field label={t('builderStudio.language')}><input className="field" value={form.language} onChange={event => setForm({ ...form, language: event.target.value })}/></Field><Field label={t('builderStudio.level')}><select className="field" value={form.level} onChange={event => setForm({ ...form, level: event.target.value })}>{['beginner','intermediate','advanced'].map(level => <option key={level} value={level}>{t(`builderStudio.levels.${level}`)}</option>)}</select></Field><Field label={t('builderStudio.pricing')}><div className="flex gap-3"><select className="field" value={form.type} onChange={event => setForm({ ...form, type: event.target.value })}><option value="free">{t('builderStudio.free')}</option><option value="paid">{t('builderStudio.paid')}</option></select>{form.type === 'paid' && <input aria-label={t('builderStudio.price')} type="number" min=".01" step=".01" className="field" value={form.price} onChange={event => setForm({ ...form, price: event.target.value })}/>}</div></Field><div className="grid gap-5 md:col-span-2 md:grid-cols-2"><div><MediaUpload label={t('builderStudio.thumbnail')} accept="image/jpeg,image/png,image/webp" kind="thumbnail" upload={upload} media={media} preview={form.thumbnail} selectedFile={pendingMedia.thumbnail}/><p className="mt-2 text-xs text-slate-500">{isNew ? t('builderStudio.mediaQueuedHelp') : t('builderStudio.thumbnailHelp')}</p></div><div><MediaUpload label={t('builderStudio.promotional')} accept="video/mp4,video/webm,video/quicktime" kind="promotional" upload={upload} media={media} preview={form.has_promotional_video ? t('builderStudio.videoReady') : ''} selectedFile={pendingMedia.promotional}/><p className="mt-2 text-xs text-slate-500">{isNew ? t('builderStudio.mediaQueuedHelp') : t('builderStudio.videoHelp')}</p></div></div>{media.error && <p className="md:col-span-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">{media.error}</p>}</div>;
}

function StepTwo({ form, setForm, t }) {
  return <div className="space-y-5"><Heading title={t('builderStudio.content')} description={t('builderStudio.contentHelp')}/><Field label={t('builderStudio.shortDescription')}><textarea maxLength="500" className="field min-h-24" value={form.short_description} onChange={event => setForm({ ...form, short_description: event.target.value })}/></Field><Field label={t('builderStudio.fullDescription')}><textarea className="field min-h-48" value={form.description} onChange={event => setForm({ ...form, description: event.target.value })}/></Field>{['learning_objectives','requirements','target_audience'].map(key => <ListEditor key={key} label={t(`builderStudio.${key}`)} values={form[key]} change={values => setForm({ ...form, [key]: values })} t={t}/>)}</div>;
}

function StepThree({ courseId, t, upload, media, form }) {
  return <div className="space-y-6"><Heading title={t('builderStudio.curriculum')} description={t('builderStudio.curriculumHelp')}/><Link to={`/instructor/courses/${courseId}/curriculum`} className="action">{t('builderStudio.openCurriculum')}</Link><MediaUpload label={t('builderStudio.promotional')} accept="video/mp4,video/webm,video/quicktime" kind="promotional" upload={upload} media={media} preview={form.has_promotional_video ? t('builderStudio.videoReady') : ''}/></div>;
}

function MediaUpload({ label, accept, kind, upload, media, disabled, preview, selectedFile }) {
  return <div className="h-full rounded-2xl border border-dashed border-slate-300 p-5 dark:border-slate-700"><div className="flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-xl bg-amber-100 text-amber-700">{kind === 'thumbnail' ? <ImagePlus/> : <UploadCloud/>}</span><div className="min-w-0"><strong className="dark:text-white">{label}</strong>{selectedFile && <p className="mt-1 truncate text-xs font-semibold text-amber-700 dark:text-amber-300">{selectedFile.name}</p>}{preview && (kind === 'thumbnail' ? <img src={preview} className="mt-3 h-24 w-40 rounded-xl object-cover" alt=""/> : <p className="text-sm text-emerald-600">{preview}</p>)}</div></div><input disabled={disabled || media.uploading === kind} type="file" accept={accept} className="mt-4 block w-full text-sm" onChange={event => upload(kind, event.target.files[0])}/>{media.uploading === kind && <div className="mt-3"><div className="h-2 rounded-full bg-slate-200"><div className="h-full rounded-full bg-amber-400" style={{ width: `${media[kind]}%` }}/></div><button onClick={() => media.controller?.abort()} className="mt-2 text-sm text-red-600">Cancel</button></div>}</div>;
}

function ListEditor({ label, values, change, t }) {
  return <Field label={label}><div className="space-y-2">{values.map((value, index) => <div key={index} className="flex gap-2"><input className="field" value={value} onChange={event => change(values.map((item, itemIndex) => itemIndex === index ? event.target.value : item))}/><button type="button" onClick={() => change(values.filter((_, itemIndex) => itemIndex !== index))} className="rounded-xl border p-3 text-red-600"><X className="h-4 w-4"/></button></div>)}<button type="button" onClick={() => change([...values, ''])} className="text-sm font-bold text-amber-700">+ {t('builderStudio.addItem')}</button></div></Field>;
}

const clean = form => ({
  category_id: Number(form.category_id), title: form.title, subtitle: form.subtitle || null,
  short_description: form.short_description, description: form.description,
  learning_objectives: form.learning_objectives.filter(Boolean), requirements: form.requirements.filter(Boolean),
  target_audience: form.target_audience.filter(Boolean), language: form.language, level: form.level,
  type: form.type, price: form.type === 'paid' ? Number(form.price) : 0,
});
const Heading = ({ title, description }) => <div className="md:col-span-2"><h2 className="text-2xl font-black dark:text-white">{title}</h2><p className="mt-1 text-sm text-slate-500">{description}</p></div>;
const Field = ({ label, children }) => <label className="block"><span className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-200">{label}</span>{children}</label>;
function SaveBar({ status, t }) { const map = { saving: [LoaderCircle, t('builderStudio.saving')], saved: [Check, t('builderStudio.saved')], unsaved: [Save, t('builderStudio.unsaved')], error: [X, t('builderStudio.saveError')] }; const [Icon, label] = map[status] || map.saved; return <div className="sticky bottom-4 z-30 mx-auto mt-6 flex w-fit items-center gap-2 rounded-full border bg-slate-950 px-5 py-3 font-bold text-white shadow-2xl"><Icon className={`h-4 w-4 ${status === 'saving' ? 'animate-spin' : ''}`}/>{label}</div>; }
function PreviewModal({ data, close, t }) { const course = data.course; return <div className="fixed inset-0 z-[100] overflow-y-auto bg-slate-950/75 p-4"><div className="mx-auto my-8 max-w-5xl rounded-3xl bg-white p-8 dark:bg-slate-900"><button onClick={close} className="float-right rounded-xl border p-2"><X/></button><p className="text-xs font-black uppercase text-amber-700">{t('builderStudio.draftPreview')}</p><h2 className="mt-3 text-4xl font-black dark:text-white">{course.title}</h2><p className="mt-2 text-lg text-slate-500">{course.subtitle}</p>{course.thumbnail && <img src={course.thumbnail} className="mt-6 aspect-video w-full rounded-2xl object-cover"/>}<div className="lesson-content mt-8" dangerouslySetInnerHTML={{ __html: course.description }}/><h3 className="mt-8 text-xl font-black">{t('builderStudio.curriculum')}</h3>{data.sections.map(section => <div key={section.id} className="mt-3 rounded-xl border p-4"><strong>{section.title}</strong><p className="mt-2 text-sm text-slate-500">{section.lessons.length} lessons</p></div>)}</div></div>; }
