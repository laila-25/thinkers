export default function FeatureCard({ icon: Icon, title, description, index = 0 }) {
  return (
    <article style={{ '--card-index': index }} className="landing-card rounded-3xl border border-slate-200/80 bg-white p-7 text-slate-950 shadow-[0_18px_48px_-40px_rgba(15,23,42,0.2)] hover:shadow-[0_24px_60px_-38px_rgba(15,23,42,0.24)]">
      <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#F5C542] text-[#0B132B] shadow-[0_12px_28px_-14px_rgba(245,197,66,0.8)]"><Icon className="h-6 w-6" /></span>
      <h3 className="mt-6 text-xl font-bold text-slate-950">{title}</h3>
      <p className="mt-3 leading-7 text-slate-600">{description}</p>
    </article>
  );
}
