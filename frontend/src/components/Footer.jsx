import { FaFacebookF, FaInstagram, FaLinkedinIn, FaYoutube } from 'react-icons/fa6';
import { ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';

const socials = [['LinkedIn', 'https://www.linkedin.com', FaLinkedinIn], ['Instagram', 'https://www.instagram.com', FaInstagram], ['Facebook', 'https://www.facebook.com', FaFacebookF], ['YouTube', 'https://www.youtube.com', FaYoutube]];

export default function Footer() {
  const { t } = useTranslation();
  const columns = [[t('footer.platform'), [[t('nav.courses'), '/courses'], [t('nav.categories'), '/categories'], [t('footer.studentDashboard'), '/student/dashboard']]], [t('footer.company'), [[t('nav.about'), '/about'], [t('nav.contact'), '/contact'], [t('footer.becomeInstructor'), '/register']]]];
  return (
    <footer className="deferred-section border-t border-slate-200 bg-white">
      <div className="section-shell py-14 sm:py-16">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-[1.4fr_0.7fr_0.7fr_1fr]">
          <div><Link to="/" className="inline-flex items-center gap-3"><img src="/logo.png" alt="" loading="lazy" decoding="async" width="56" height="56" className="h-14 w-auto"/><span className="text-xl font-extrabold tracking-tight text-slate-950">{t('brand')}</span></Link><p className="mt-4 max-w-sm text-sm leading-7 text-slate-500">{t('footer.description')}</p></div>
          {columns.map(([title, links]) => <div key={title}><h3 className="text-sm font-bold uppercase tracking-[0.18em] text-slate-900">{title}</h3><ul className="mt-5 space-y-3">{links.map(([label, to]) => <li key={label}><Link className="text-sm text-slate-500 hover:text-amber-700" to={to}>{label}</Link></li>)}</ul></div>)}
          <div><h3 className="text-sm font-bold uppercase tracking-[0.18em] text-slate-900">{t('footer.start')}</h3><p className="mt-5 text-sm leading-6 text-slate-500">{t('footer.discover')}</p><Link to="/courses" className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-amber-700">{t('footer.explore')} <ArrowUpRight className="h-4 w-4"/></Link><div className="mt-6 flex gap-2">{socials.map(([label, href, Icon]) => <a key={label} href={href} target="_blank" rel="noreferrer" aria-label={label} className="grid h-10 w-10 place-items-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm hover:-translate-y-1 hover:border-amber-300 hover:bg-amber-50 hover:text-amber-700"><Icon className="h-4 w-4"/></a>)}</div></div>
        </div>
        <div className="mt-12 flex flex-col gap-2 border-t border-slate-200 pt-6 text-xs text-slate-500 sm:flex-row sm:justify-between"><p>{t('footer.copyright', { year: new Date().getFullYear() })}</p><p>{t('footer.built')}</p></div>
      </div>
    </footer>
  );
}
