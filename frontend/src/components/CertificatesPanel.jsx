import { Award, Check, Copy, Download, ExternalLink, FileClock } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import api from '../api/client';

export default function CertificatesPanel({ standalone = false }) {
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(null);
  const [downloading, setDownloading] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    api.get('/api/certificates', { signal: controller.signal })
      .then(response => setCertificates(response.data.data || []))
      .catch(requestError => { if (!controller.signal.aborted) setError(requestError.response?.data?.message || 'Certificates could not be loaded.'); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, []);

  const share = async certificate => {
    const url = `${window.location.origin}${certificate.verification_url}`;
    if (navigator.share) {
      await navigator.share({ title: certificate.course.title, text: 'Verify my Thinkers certificate', url });
      return;
    }
    await navigator.clipboard.writeText(url);
    setCopied(certificate.id);
    window.setTimeout(() => setCopied(null), 1800);
  };

  const download = async certificate => {
    setDownloading(certificate.id);
    setError('');
    try {
      const response = await api.get(certificate.download_url, { responseType: 'blob' });
      const url = URL.createObjectURL(response.data);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${certificate.certificate_number}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'The certificate could not be downloaded.');
    } finally {
      setDownloading(null);
    }
  };

  if (loading) return <div className="mt-10 animate-pulse"><div className="h-7 w-40 rounded bg-slate-200"/><div className="mt-4 h-40 rounded-3xl bg-slate-200"/></div>;

  const latest = certificates[0];

  return <section className="mt-10" aria-labelledby="certificates-title">
    <div className="flex flex-wrap items-end justify-between gap-3"><div><p className="section-kicker">Your accomplishments</p><h2 id="certificates-title" className="mt-1 text-2xl font-bold">Certificates</h2>{!standalone && <Link to="/certificates" className="mt-2 inline-block text-sm font-bold text-amber-700 hover:text-amber-800">Open certificate center →</Link>}</div><div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-right"><strong className="block text-2xl text-slate-950">{certificates.length}</strong><span className="text-xs font-semibold text-amber-800">earned certificates</span></div></div>
    {latest && <div className="mt-5 flex items-center gap-3 rounded-2xl border border-amber-200/80 bg-gradient-to-r from-amber-50 to-white p-4"><Award className="h-6 w-6 shrink-0 text-amber-700"/><p className="text-sm text-slate-600"><strong className="block text-slate-950">Latest achievement</strong>{latest.course.title} · {new Date(latest.issued_at).toLocaleDateString()}</p></div>}
    {error && <p className="mt-4 rounded-2xl bg-rose-50 p-4 text-rose-700">{error}</p>}
    {!error && !certificates.length ? <div className="mt-5 rounded-3xl border border-dashed border-slate-300 bg-white p-9 text-center"><Award className="mx-auto h-9 w-9 text-slate-300"/><h3 className="mt-3 font-bold">Complete a course to earn your first certificate</h3><p className="mt-1 text-sm text-slate-500">Certificates are issued automatically after every required lesson is completed.</p></div> : <div className="mt-5 grid gap-5 lg:grid-cols-2">{certificates.map(certificate => <article key={certificate.id} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-amber-100 text-amber-700"><Award className="h-6 w-6"/></span><span className={`rounded-full px-3 py-1 text-xs font-bold ${certificate.status === 'issued' ? 'bg-emerald-50 text-emerald-700' : certificate.status === 'revoked' ? 'bg-rose-50 text-rose-700' : 'bg-slate-100 text-slate-600'}`}>{certificate.status === 'issued' ? 'Verified' : certificate.status === 'revoked' ? 'Revoked' : 'Preparing PDF'}</span></div>
      <h3 className="mt-5 text-xl font-bold">{certificate.course.title}</h3><p className="mt-1 text-sm text-slate-500">Instructor: {certificate.course.instructor || 'Thinkers Academy'}</p><p className="mt-4 font-mono text-xs text-slate-500">{certificate.certificate_number}</p>
      <div className="mt-5 flex flex-wrap gap-2">{certificate.download_url ? <button type="button" disabled={downloading === certificate.id} onClick={() => download(certificate)} className="action inline-flex items-center gap-2 disabled:opacity-60"><Download className="h-4 w-4"/> {downloading === certificate.id ? 'Downloading…' : 'Download PDF'}</button> : <span className="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-4 py-2 text-sm text-slate-500"><FileClock className="h-4 w-4"/> Processing</span>}<a href={certificate.verification_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold hover:bg-slate-50"><ExternalLink className="h-4 w-4"/> Verify</a><button type="button" onClick={() => share(certificate)} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold hover:bg-slate-50">{copied === certificate.id ? <Check className="h-4 w-4 text-emerald-600"/> : <Copy className="h-4 w-4"/>}{copied === certificate.id ? 'Copied' : 'Share'}</button></div>
    </article>)}</div>}
  </section>;
}
