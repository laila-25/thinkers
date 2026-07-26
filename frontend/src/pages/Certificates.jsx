import { ArrowLeft, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router';
import CertificatesPanel from '../components/CertificatesPanel';
import PageBackground from '../components/PageBackground';

export default function Certificates() {
  return <PageBackground variant="certificate" className="min-h-screen">
    <main className="section-shell py-10 sm:py-14">
      <Link to="/student/dashboard" className="inline-flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-amber-700"><ArrowLeft className="h-4 w-4"/> Student dashboard</Link>
      <header className="mt-5 rounded-3xl border border-amber-200/70 bg-white/90 p-7 shadow-[0_28px_80px_-48px_rgba(120,83,20,.65)] backdrop-blur-xl sm:p-10 dark:border-amber-400/20 dark:bg-slate-900/90">
        <div className="flex items-start gap-4"><span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-amber-100 text-amber-700"><ShieldCheck className="h-7 w-7"/></span><div><p className="section-kicker">Verified achievements</p><h1 className="mt-2 text-3xl font-bold sm:text-4xl">Your certificates</h1><p className="mt-3 max-w-2xl text-slate-600 dark:text-slate-300">Download your completion certificates or share their public verification links.</p></div></div>
      </header>
      <CertificatesPanel standalone/>
    </main>
  </PageBackground>;
}
