import { useEffect } from 'react';
import { FaFacebookF, FaInstagram, FaLinkedinIn, FaYoutube } from 'react-icons/fa6';
import { m, useReducedMotion } from 'framer-motion';
import { Link, Outlet, useLocation } from 'react-router';
import Navbar from '../components/Navbar';

const platformLinks = [['Courses', '/courses'], ['Categories', '/categories']];
const companyLinks = [['Become an instructor', '/register'], ['Contact', '/contact']];
const socialLinks = [
  ['LinkedIn', 'https://www.linkedin.com', FaLinkedinIn],
  ['Instagram', 'https://www.instagram.com', FaInstagram],
  ['Facebook', 'https://www.facebook.com', FaFacebookF],
  ['YouTube', 'https://www.youtube.com', FaYoutube],
];

export default function MainLayout() {
  const location = useLocation();
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const behavior = reduceMotion ? 'auto' : 'smooth';
    const frame = window.requestAnimationFrame(() => {
      if (location.hash) {
        document.getElementById(location.hash.slice(1))?.scrollIntoView({ behavior, block: 'start' });
      } else {
        window.scrollTo({ top: 0, behavior });
      }
    });

    return () => window.cancelAnimationFrame(frame);
  }, [location.pathname, location.hash, reduceMotion]);

  useEffect(() => {
    const previous = window.history.scrollRestoration;
    window.history.scrollRestoration = 'manual';
    return () => { window.history.scrollRestoration = previous; };
  }, []);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(245,197,66,0.06),transparent_25%),linear-gradient(180deg,#f8fafc_0%,#ffffff_36%,#f8fafc_100%)]">
      <Navbar />
      <main className={location.pathname === '/' ? '' : 'pt-24'}><Outlet /></main>
      <m.footer
        className="border-t border-slate-200/80 bg-white/90 backdrop-blur-xl"
        initial={reduceMotion ? false : { opacity: 0, y: 28 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.12 }}
        transition={{ duration: reduceMotion ? 0 : 0.65, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="section-shell py-16">
          <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
            <div>
              <Link to="/" className="flex items-center gap-2"><img src="/logo.png" alt="" className="h-14 w-auto" /><span className="text-xl font-bold tracking-[-0.03em] text-slate-950">Thinkers</span></Link>
              <p className="mt-4 max-w-xs text-sm leading-6 text-slate-500">A focused platform for expert-led courses, measurable progress, and confident learning.</p>
              <SocialLinks reduceMotion={reduceMotion} />
            </div>
            <FooterColumn title="Platform" links={platformLinks} />
            <FooterColumn title="Company" links={companyLinks} />
            <div>
              <h3 className="font-bold text-slate-900">Stay curious</h3>
              <p className="mt-4 text-sm leading-6 text-slate-500">Discover newly published learning experiences from approved instructors.</p>
              <Link to="/register" className="group mt-5 inline-flex items-center gap-1 font-semibold text-slate-900 transition hover:text-[#0B132B]">Create an account <span className="transition-transform duration-200 group-hover:translate-x-1">→</span></Link>
            </div>
          </div>
          <div className="mt-14 flex flex-col gap-3 border-t border-slate-200 pt-7 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between"><p>© {new Date().getFullYear()} Thinkers Platform.</p><p>Built for thoughtful learning.</p></div>
        </div>
      </m.footer>
    </div>
  );
}

function SocialLinks({ reduceMotion }) {
  return (
    <div className="mt-6 flex items-center gap-2" aria-label="Thinkers on social media">
      {socialLinks.map(([label, href, Icon], index) => (
        <m.a
          key={label}
          href={href}
          target="_blank"
          rel="noreferrer"
          aria-label={label}
          initial={reduceMotion ? false : { opacity: 0, scale: 0.8 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ delay: reduceMotion ? 0 : 0.18 + index * 0.07, duration: 0.32 }}
          whileHover={reduceMotion ? undefined : { y: -3, scale: 1.08, rotate: index % 2 ? 3 : -3 }}
          whileTap={reduceMotion ? undefined : { scale: 0.94 }}
          className="grid h-10 w-10 place-items-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm transition-colors hover:border-amber-300 hover:bg-amber-50 hover:text-[#0B132B] focus:outline-none focus:ring-4 focus:ring-amber-100"
        >
          <Icon className="h-[18px] w-[18px]" />
        </m.a>
      ))}
    </div>
  );
}

function FooterColumn({ title, links }) {
  return <div><h3 className="font-bold text-slate-900">{title}</h3><ul className="mt-4 space-y-3">{links.map(([label, to]) => <li key={label}><Link to={to} className="inline-block text-sm text-slate-500 transition duration-200 hover:translate-x-1 hover:text-slate-950 focus:text-slate-950">{label}</Link></li>)}</ul></div>;
}
