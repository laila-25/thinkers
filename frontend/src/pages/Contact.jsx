import { Clock3, Mail, MapPin } from 'lucide-react';
import PageHero from '../components/PageHero';
import { useTranslation } from 'react-i18next';

export default function Contact() {
  const { t } = useTranslation();
  const details = [[Mail, t('contact.email'), 'hello@thinkers.local'], [MapPin, t('contact.location'), t('contact.locationValue')], [Clock3, t('contact.response'), t('contact.responseValue')]];
  return (
    <div className="bg-[#FAFAF7]">
      <PageHero eyebrow={t('contact.eyebrow')} title={t('contact.title')} description={t('contact.description')} />
      <section className="page-section">
        <div className="section-shell grid gap-8 lg:grid-cols-[1fr_1.2fr]">
          <div className="rounded-3xl border border-amber-200 bg-amber-50/70 p-8 shadow-[0_20px_55px_-44px_rgba(183,121,31,0.38)] sm:p-10">
            <h2 className="text-2xl font-bold text-slate-950">{t('contact.information')}</h2>
            <div className="mt-8 space-y-6">{details.map(([Icon, label, value]) => <div key={label} className="flex items-start gap-4"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white text-amber-700 shadow-sm"><Icon className="h-5 w-5"/></span><span><strong className="block text-slate-900">{label}</strong><span className="text-slate-600">{value}</span></span></div>)}</div>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-[0_20px_55px_-44px_rgba(15,23,42,0.2)] sm:p-10">
            <p className="section-kicker">{t('contact.help')}</p>
            <h2 className="mt-3 text-3xl font-bold">{t('contact.team')}</h2>
            <p className="mt-5 leading-7 text-slate-600">{t('contact.support')}</p>
            <a href="mailto:hello@thinkers.local?subject=Thinkers%20support%20request" className="action mt-8">{t('contact.emailAction')}</a>
          </div>
        </div>
      </section>
    </div>
  );
}
