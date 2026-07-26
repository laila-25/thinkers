import { Award, CheckCircle2, Clock3, ShieldCheck, XCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router';
import api from '../api/client';
import PageBackground from '../components/PageBackground';

export default function VerifyCertificate() {
  const { code } = useParams();
  const [certificate, setCertificate] = useState(null);
  const [state, setState] = useState('loading');

  useEffect(() => {
    const controller = new AbortController();
    api.get(`/api/certificates/verify/${encodeURIComponent(code)}`, { signal: controller.signal })
      .then(response => { setCertificate(response.data.data); setState('ready'); })
      .catch(() => { if (!controller.signal.aborted) setState('invalid'); });
    return () => controller.abort();
  }, [code]);

  if (state === 'loading') return <PageBackground variant="certificate"><main className="mx-auto min-h-[65vh] max-w-3xl px-4 py-20"><div className="h-96 animate-pulse rounded-3xl bg-white/75 backdrop-blur-xl"/></main></PageBackground>;
  if (state === 'invalid') return <PageBackground variant="certificate"><main className="mx-auto grid min-h-[65vh] max-w-xl place-items-center px-4 py-20 text-center"><div><XCircle className="mx-auto h-14 w-14 text-rose-500"/><h1 className="mt-5 text-3xl font-bold">Certificate not found</h1><p className="mt-3 text-slate-500">This verification code is invalid or the certificate does not exist.</p><Link to="/" className="action mt-6 inline-flex">Return to Thinkers</Link></div></main></PageBackground>;

  const pending = certificate.status === 'pending';
  const headerClass = certificate.valid ? 'bg-emerald-50' : pending ? 'bg-amber-50' : 'bg-rose-50';
  const title = certificate.valid ? 'Valid Thinkers Certificate' : pending ? 'Certificate is being prepared' : 'Certificate is not valid';

  return <PageBackground variant="certificate"><main className="mx-auto min-h-[65vh] max-w-3xl px-4 py-16"><article className="overflow-hidden rounded-3xl border border-amber-200/80 bg-white/88 shadow-[0_35px_100px_-48px_rgba(120,83,20,.58)] backdrop-blur-xl dark:border-amber-400/20 dark:bg-slate-900/86"><div className={`p-6 text-center ${headerClass}`}>{certificate.valid ? <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-600"/> : pending ? <Clock3 className="mx-auto h-12 w-12 text-amber-600"/> : <XCircle className="mx-auto h-12 w-12 text-rose-600"/>}<h1 className="mt-3 text-2xl font-bold">{title}</h1>{pending && <p className="mt-2 text-sm text-amber-800">The certificate record is secure. Its downloadable PDF is still being generated.</p>}</div><div className="p-8 sm:p-10"><div className="flex items-center gap-3 text-amber-700"><Award className="h-7 w-7"/><span className="font-bold">Certificate of Completion</span></div><dl className="mt-7 grid gap-5 sm:grid-cols-2"><Detail label="Student" value={certificate.owner_name}/><Detail label="Course" value={certificate.course_title}/><Detail label="Instructor" value={certificate.instructor_name || 'Thinkers Academy'}/><Detail label="Issue date" value={certificate.issued_at}/><Detail label="Certificate ID" value={certificate.certificate_number}/><Detail label="Status" value={certificate.status}/></dl><div className="mt-8 flex items-center gap-2 border-t border-slate-100 pt-6 text-sm text-slate-500">{pending ? <Clock3 className="h-5 w-5 text-amber-600"/> : <ShieldCheck className={`h-5 w-5 ${certificate.valid ? 'text-emerald-600' : 'text-rose-600'}`}/>} {pending ? 'Verification will become active as soon as PDF generation finishes.' : 'Checked directly against the Thinkers certificate registry.'}</div></div></article></main></PageBackground>;
}

function Detail({ label, value }) { return <div><dt className="text-xs font-bold uppercase tracking-wider text-slate-400">{label}</dt><dd className="mt-1 break-words font-semibold text-slate-900">{value}</dd></div>; }
