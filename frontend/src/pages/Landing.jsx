import { useEffect, useState } from 'react';
import { ArrowRight, Award, BarChart3, BookOpenCheck, Bot, Check, CheckCircle2, CirclePlay, Compass, Flame, Layers3, Play, ShieldCheck, Sparkles, Trophy, UsersRound } from 'lucide-react';
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import Button from '../components/Button';
import CourseCard from '../components/CourseCard';
import FeatureCard from '../components/FeatureCard';
import SectionTitle from '../components/SectionTitle';
import PageBackground from '../components/PageBackground';
import api from '../api/client';

const whyIcons = [ShieldCheck, UsersRound, BarChart3];
const featureIcons = [Bot, Layers3, CirclePlay, Trophy, Award, BarChart3];
const stepIcons = [Compass, CirclePlay, BarChart3];
const HERO_BACKGROUND = '/images/thinkers-hero-learning.webp';

export default function Landing() {
  const { t } = useTranslation();
  const [courses, setCourses] = useState([]);
  const [status, setStatus] = useState('loading');
  const [courseCount, setCourseCount] = useState(0);

  useEffect(() => {
    let active = true;
    const load = () => api.get('/api/courses', { params: { per_page: 3 } })
      .then(response => response.data)
      .then(data => { if (active) { setCourses((data.data || []).slice(0, 3)); setCourseCount(data.meta?.total || data.data?.length || 0); } })
      .catch(() => {})
      .finally(() => { if (active) setStatus('ready'); });
    const idleId = 'requestIdleCallback' in window ? window.requestIdleCallback(load, { timeout: 1200 }) : window.setTimeout(load, 300);
    return () => { active = false; if ('cancelIdleCallback' in window) window.cancelIdleCallback(idleId); else window.clearTimeout(idleId); };
  }, []);

  return (
    <PageBackground variant="landing" className="overflow-hidden">
      <Hero />

      <SocialProof courseCount={courseCount} />

      <section className="deferred-section page-section border-y border-white/60 bg-white/55 backdrop-blur-[2px] dark:border-slate-700/60 dark:bg-slate-900/45">
        <div className="section-shell">
          <SectionTitle eyebrow={t('landing.why.eyebrow')} title={t('landing.why.title')} description={t('landing.why.description')} align="center" />
          <div className="mt-12 grid gap-5 md:grid-cols-3">{t('landing.why.items', { returnObjects: true }).map((item, index) => <FeatureCard key={item.title} icon={whyIcons[index]} title={item.title} description={item.description} index={index} />)}</div>
        </div>
      </section>

      <section className="deferred-section page-section border-y border-amber-200/60 bg-amber-50/45 backdrop-blur-[2px] dark:border-amber-400/15 dark:bg-amber-400/5">
        <div className="section-shell">
          <SectionTitle eyebrow={t('landing.features.eyebrow')} title={t('landing.features.title')} description={t('landing.features.description')} align="center" />
          <div className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-3">{t('landing.features.items', { returnObjects: true }).map((item, index) => <FeatureShowcase key={item.title} icon={featureIcons[index]} title={item.title} description={item.description} index={index} />)}</div>
        </div>
      </section>

      <section className="deferred-section page-section bg-white/35 backdrop-blur-[1px] dark:bg-slate-950/15">
        <div className="section-shell">
          <SectionTitle eyebrow={t('landing.steps.eyebrow')} title={t('landing.steps.title')} align="center" />
          <div className="relative mt-14 grid gap-5 md:grid-cols-3">
            <div className="absolute left-[16%] right-[16%] top-10 hidden h-px bg-gradient-to-r from-transparent via-amber-300 to-transparent md:block" />
            {t('landing.steps.items', { returnObjects: true }).map((item, index) => <Step key={item.title} number={String(index + 1).padStart(2, '0')} icon={stepIcons[index]} title={item.title} description={item.description} index={index} label={t('landing.steps.label', { number: String(index + 1).padStart(2, '0') })} />)}
          </div>
        </div>
      </section>

      <section className="deferred-section page-section border-y border-white/60 bg-slate-50/55 backdrop-blur-[2px] dark:border-slate-700/60 dark:bg-slate-900/45">
        <div className="section-shell">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between"><SectionTitle eyebrow={t('landing.popular.eyebrow')} title={t('landing.popular.title')} description={t('landing.popular.description')} /><Link to="/courses" className="group inline-flex shrink-0 items-center gap-2 font-bold text-[#0B132B]">{t('landing.popular.viewAll')} <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1 rtl:rotate-180" /></Link></div>
          {status === 'loading' ? <CourseSkeletons label={t('landing.popular.loading')} /> : courses.length ? <div className="mt-10 grid gap-7 md:grid-cols-2 lg:grid-cols-3">{courses.map((course, index) => <CourseCard key={course.id} course={course} index={index} />)}</div> : <div className="mt-10 rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">{t('landing.popular.empty')}</div>}
        </div>
      </section>

      <CallToAction />
    </PageBackground>
  );
}

function Hero() {
  const { t } = useTranslation();
  return (
    <section className="relative flex min-h-[100svh] items-center overflow-hidden border-b border-slate-800 bg-slate-950 py-28 sm:py-32 lg:py-36">
      <img src={HERO_BACKGROUND} alt="" aria-hidden="true" width="1824" height="864" decoding="async" fetchPriority="high" className="absolute inset-0 h-full w-full object-cover object-center" />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(2,6,23,0.58)_0%,rgba(2,6,23,0.52)_48%,rgba(2,6,23,0.44)_100%)]" />
      <div className="section-shell relative grid items-center gap-12 lg:grid-cols-[1fr_0.9fr]">
        <div className="max-w-3xl">
          <HeroItem><span className="inline-flex items-center gap-2 rounded-full border border-amber-300/60 bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-amber-300 shadow-sm backdrop-blur-md"><Sparkles className="h-4 w-4" /> {t('landing.hero.badge')}</span></HeroItem>
          <HeroItem><h1 className="mt-7 text-5xl font-extrabold leading-[1.02] tracking-[-0.055em] text-white [text-shadow:0_3px_24px_rgba(0,0,0,0.35)] sm:text-6xl lg:text-7xl xl:text-[5rem]">{t('landing.hero.title')}<br/><span className="relative text-white"><span className="relative z-10">{t('landing.hero.titleAccent')}</span><span className="absolute inset-x-0 bottom-1 h-3 -rotate-1 rounded-full bg-[#F5C542]/70" /></span></h1></HeroItem>
          <HeroItem><p className="mt-7 max-w-2xl text-lg leading-8 text-slate-200 sm:text-xl">{t('landing.hero.description')}</p></HeroItem>
          <HeroItem><div className="mt-9 flex flex-col gap-3 sm:flex-row"><Link to="/courses" className="transition-transform duration-300 motion-safe:hover:-translate-y-0.5"><Button variant="accent" size="lg" className="w-full sm:w-auto">{t('landing.hero.explore')} <ArrowRight className="h-5 w-5 rtl:rotate-180" /></Button></Link><Link to="/about" className="transition-transform duration-300 motion-safe:hover:-translate-y-0.5"><Button variant="secondary" size="lg" className="w-full border-white/40 bg-white/10 text-white backdrop-blur-md hover:bg-white/20 sm:w-auto">{t('landing.hero.why')}</Button></Link></div></HeroItem>
          <HeroItem><div className="mt-9 flex flex-wrap gap-x-6 gap-y-3 text-sm text-slate-200">{t('landing.hero.points', { returnObjects: true }).map(item => <span key={item} className="flex items-center gap-2"><span className="grid h-5 w-5 place-items-center rounded-full bg-amber-300/20"><Check className="h-3.5 w-3.5 text-amber-300" /></span>{item}</span>)}</div></HeroItem>
        </div>
        <ProductPreview />
      </div>
    </section>
  );
}

function HeroItem({ children }) {
  return <div>{children}</div>;
}

function ProductPreview() {
  const { t } = useTranslation();
  return <div className="landing-preview-enter relative mx-auto w-full max-w-[36rem] lg:translate-x-3">
    <div className="absolute -inset-10 rounded-full bg-amber-300/20 blur-3xl"/>
    <div className="relative overflow-hidden rounded-[2rem] border border-white/20 bg-slate-950/65 p-3 shadow-[0_35px_100px_-30px_rgba(0,0,0,.85)] backdrop-blur-xl sm:p-4">
      <div className="flex items-center gap-2 border-b border-white/10 px-2 pb-3"><span className="h-2.5 w-2.5 rounded-full bg-rose-400"/><span className="h-2.5 w-2.5 rounded-full bg-amber-300"/><span className="h-2.5 w-2.5 rounded-full bg-emerald-400"/><span className="ml-auto text-[10px] font-bold uppercase tracking-[.18em] text-slate-400">Thinkers learning space</span></div>
      <div className="mt-3 overflow-hidden rounded-2xl border border-white/10 bg-[#101a2c]">
        <div className="relative aspect-[16/9]"><img src={HERO_BACKGROUND} alt="" width="640" height="360" decoding="async" className="h-full w-full object-cover opacity-70"/><div className="absolute inset-0 grid place-items-center bg-slate-950/25"><span className="grid h-14 w-14 place-items-center rounded-full border border-white/30 bg-white/15 text-white shadow-xl backdrop-blur"><Play className="h-6 w-6 fill-current"/></span></div><span className="absolute bottom-3 left-3 rounded-lg bg-slate-950/70 px-2.5 py-1 text-xs font-bold text-white backdrop-blur">{t('landing.preview.lesson')}</span></div>
        <div className="grid gap-3 p-4 sm:grid-cols-[1fr_auto] sm:items-center"><div><p className="text-sm font-bold text-white">{t('landing.preview.course')}</p><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10"><div className="h-full w-[72%] rounded-full bg-[#F5C542]"/></div></div><span className="text-xs font-bold text-amber-300">72% {t('landing.preview.complete')}</span></div>
      </div>
    </div>
    <div className="landing-float-up absolute -left-3 top-[38%] w-48 rounded-2xl border border-white/20 bg-white/95 p-3.5 shadow-2xl backdrop-blur dark:bg-slate-900/95 sm:-left-12 sm:w-56"><div className="flex gap-3"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#F5C542] text-slate-950"><Bot className="h-5 w-5"/></span><div><p className="text-xs font-extrabold text-slate-950 dark:text-white">{t('landing.preview.ai')}</p><p className="mt-1 text-[11px] leading-4 text-slate-500">{t('landing.preview.aiText')}</p></div></div></div>
    <div className="landing-float-down absolute -bottom-8 right-1 w-52 rounded-2xl border border-white/20 bg-white/95 p-4 shadow-2xl backdrop-blur dark:bg-slate-900/95 sm:-right-8"><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300"><Award className="h-5 w-5"/></span><div><p className="text-xs font-extrabold text-slate-950 dark:text-white">{t('landing.preview.certificate')}</p><p className="mt-0.5 text-[10px] text-emerald-700 dark:text-emerald-300">{t('landing.preview.verified')}</p></div></div></div>
    <div className="absolute -right-2 top-10 rounded-2xl border border-white/20 bg-[#0B132B]/95 p-3 text-white shadow-2xl sm:-right-7"><div className="flex items-center gap-2"><Flame className="h-5 w-5 text-orange-400"/><div><strong className="block text-sm">7 {t('landing.preview.days')}</strong><span className="text-[9px] uppercase tracking-wider text-slate-400">{t('landing.preview.streak')}</span></div></div></div>
  </div>;
}

function SocialProof({ courseCount }) {
  const { t } = useTranslation();
  const items = [
    { value: courseCount ? `${courseCount}+` : '—', label: t('landing.proof.courses'), icon: BookOpenCheck },
    { value: '6', label: t('landing.proof.tools'), icon: Sparkles },
    { value: '100%', label: t('landing.proof.progress'), icon: CheckCircle2 },
    { value: t('landing.proof.verifiedValue'), label: t('landing.proof.achievements'), icon: Award },
  ];
  return <section className="relative z-10 border-b border-slate-200/70 bg-white/82 shadow-[0_20px_60px_-48px_rgba(15,23,42,.45)] backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/82" aria-label={t('landing.proof.label')}><div className="section-shell grid grid-cols-2 divide-x divide-y divide-slate-200 dark:divide-slate-800 sm:grid-cols-4 sm:divide-y-0">{items.map(({ value, label, icon: Icon }) => <div key={label} className="flex items-center justify-center gap-3 px-3 py-7 sm:py-8"><Icon className="h-5 w-5 shrink-0 text-amber-600"/><div><strong className="block text-xl font-extrabold text-slate-950 dark:text-white sm:text-2xl">{value}</strong><span className="text-xs font-semibold text-slate-500 sm:text-sm">{label}</span></div></div>)}</div></section>;
}

function FeatureShowcase({ icon: Icon, title, description, index }) {
  return <article className={`landing-card group relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-7 shadow-[0_18px_50px_-40px_rgba(15,23,42,.3)] dark:border-slate-700/80 dark:bg-slate-900 ${index === 0 || index === 5 ? 'xl:col-span-2' : ''}`}><div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-amber-300/10 blur-2xl transition group-hover:bg-amber-300/20"/><span className="relative grid h-12 w-12 place-items-center rounded-2xl bg-[#F5C542] text-[#0B132B] shadow-[0_12px_28px_-14px_rgba(245,197,66,.8)]"><Icon className="h-6 w-6"/></span><h3 className="relative mt-6 text-xl font-extrabold text-slate-950 dark:text-white">{title}</h3><p className="relative mt-3 max-w-xl leading-7 text-slate-600 dark:text-slate-300">{description}</p><span className="relative mt-6 inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-[.16em] text-amber-700 dark:text-amber-300">{String(index + 1).padStart(2, '0')} <span className="h-px w-8 bg-amber-300"/></span></article>;
}

function Step({ number, icon: Icon, title, description, index, label }) {
  return <article style={{ '--card-index': index }} className="landing-card relative rounded-3xl border border-slate-200 bg-white p-7 text-center shadow-[0_20px_55px_-42px_rgba(15,23,42,0.35)]"><span className="relative z-10 mx-auto grid h-20 w-20 place-items-center rounded-full border-8 border-white bg-[#F5C542] text-[#0B132B] shadow-lg"><Icon className="h-7 w-7" /></span><span className="mt-6 block text-xs font-extrabold tracking-[0.2em] text-amber-600">{label || number}</span><h3 className="mt-2 text-xl font-bold">{title}</h3><p className="mt-3 leading-7 text-slate-600">{description}</p></article>;
}

function CourseSkeletons({ label }) {
  return <div className="mt-10 grid gap-7 md:grid-cols-2 lg:grid-cols-3" aria-label={label}>{[1, 2, 3].map(item => <div key={item} className="h-[430px] animate-pulse rounded-3xl bg-white shadow-sm" />)}</div>;
}

function CallToAction() {
  const { t } = useTranslation();
  return <section className="deferred-section page-section bg-transparent"><div className="section-shell"><div className="relative overflow-hidden rounded-[2rem] border border-amber-200 bg-[linear-gradient(135deg,rgba(255,249,223,.9),rgba(255,253,245,.82))] px-6 py-14 text-center shadow-[0_28px_85px_-44px_rgba(183,121,31,0.5)] backdrop-blur-xl dark:border-amber-300/20 dark:bg-[linear-gradient(135deg,rgba(20,32,53,.97),rgba(9,18,33,.95))] dark:shadow-[0_32px_90px_-46px_rgba(245,197,66,.24)] sm:px-12 sm:py-16"><div className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-[#F5C542]/25 blur-3xl dark:bg-[#F5C542]/12"/><div className="relative"><SectionTitle eyebrow={t('landing.cta.eyebrow')} title={t('landing.cta.title')} description={t('landing.cta.description')} align="center"/><div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row"><Link to="/register"><Button variant="accent" size="lg" className="w-full sm:w-auto">{t('landing.cta.create')}</Button></Link><Link to="/contact"><Button variant="secondary" size="lg" className="w-full sm:w-auto">{t('landing.cta.contact')}</Button></Link></div></div></div></div></section>;
}
