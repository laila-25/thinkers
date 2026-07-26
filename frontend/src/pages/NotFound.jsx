import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';

export default function NotFound() { const { t } = useTranslation(); return <main className="section-shell grid min-h-[65vh] place-items-center py-24 text-center"><div><p className="text-7xl font-black text-amber-400" aria-hidden="true">404</p><h1 className="mt-4 text-3xl font-extrabold text-slate-950 dark:text-white">{t('errors.notFoundTitle')}</h1><p className="mx-auto mt-3 max-w-md text-slate-600 dark:text-slate-300">{t('errors.notFoundText')}</p><Link to="/" className="action mt-7">{t('errors.backHome')}</Link></div></main>; }
