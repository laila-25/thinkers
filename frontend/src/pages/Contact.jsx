import { Clock3, Mail, MapPin } from 'lucide-react';
import PageHero from '../components/PageHero';

export default function Contact() {
  return (
    <div className="bg-white">
      <PageHero eyebrow="Contact Thinkers" title="Let’s start a thoughtful conversation." description="Have a question about learning, teaching, or the platform? The Thinkers team is ready to help." />
      <section className="page-section">
        <div className="section-shell grid gap-8 lg:grid-cols-[1fr_1.2fr]">
          <div className="rounded-3xl bg-slate-950 p-8 text-white sm:p-10">
            <h2 className="text-2xl font-bold text-white">Contact information</h2>
            <div className="mt-8 space-y-6">
              <a href="mailto:hello@thinkers.local" className="flex items-start gap-4"><Mail className="mt-0.5 h-6 w-6 text-amber-400" /><span><strong className="block text-white">Email</strong><span className="text-slate-300">hello@thinkers.local</span></span></a>
              <div className="flex items-start gap-4"><MapPin className="mt-0.5 h-6 w-6 text-amber-400" /><span><strong className="block text-white">Location</strong><span className="text-slate-300">Amman, Jordan</span></span></div>
              <div className="flex items-start gap-4"><Clock3 className="mt-0.5 h-6 w-6 text-amber-400" /><span><strong className="block text-white">Response time</strong><span className="text-slate-300">Usually within two business days</span></span></div>
            </div>
          </div>
          <div className="rounded-3xl border border-slate-200 p-8 sm:p-10">
            <p className="section-kicker">How can we help?</p>
            <h2 className="mt-3 text-3xl font-bold">Reach the right team.</h2>
            <p className="mt-5 leading-7 text-slate-600">For course access, instructor applications, content questions, or general platform support, email us with a short description. Include your account email when your question relates to an existing account.</p>
            <a href="mailto:hello@thinkers.local?subject=Thinkers%20support%20request" className="action mt-8">Email Thinkers</a>
          </div>
        </div>
      </section>
    </div>
  );
}
