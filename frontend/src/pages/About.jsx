import { BookOpenCheck, ChartNoAxesCombined, UsersRound } from 'lucide-react';
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import Button from '../components/Button';
import PageHero from '../components/PageHero';

const icons = [BookOpenCheck, UsersRound, ChartNoAxesCombined];

export default function About() {
  const { t } = useTranslation();
  const values = t('about.values', { returnObjects: true });
  return (
    <div className="bg-white">
      <PageHero eyebrow={t('about.eyebrow')} title={t('about.title')} description={t('about.description')} />
      <section className="page-section">
        <div className="section-shell">
          <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
            <div><p className="section-kicker">{t('about.purpose')}</p><h2 className="section-title">{t('about.purposeTitle')}</h2><p className="mt-5 leading-7 text-slate-600">{t('about.purposeText')}</p></div>
            <div className="grid gap-5 sm:grid-cols-3">{values.map((item, index) => { const Icon = icons[index]; return <article key={item.title} className="soft-card p-6"><Icon className="h-7 w-7 text-amber-500"/><h3 className="mt-5 text-lg font-bold">{item.title}</h3><p className="mt-3 text-sm leading-6 text-slate-600">{item.description}</p></article>; })}</div>
          </div>
          <div className="mt-16 rounded-3xl border border-amber-200 bg-amber-50/70 px-6 py-12 text-center shadow-[0_24px_70px_-50px_rgba(183,121,31,0.4)] sm:px-12"><h2 className="text-3xl font-bold text-slate-950">{t('about.ctaTitle')}</h2><p className="mx-auto mt-4 max-w-2xl text-slate-600">{t('about.ctaText')}</p><div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row"><Link to="/courses"><Button size="lg">{t('about.explore')}</Button></Link><Link to="/register"><Button size="lg" variant="secondary">{t('about.join')}</Button></Link></div></div>
        </div>
      </section>
    </div>
  );
}
