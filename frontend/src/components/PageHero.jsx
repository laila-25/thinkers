export default function PageHero({ eyebrow, title, description }) {
  return (
    <header className="border-b border-slate-200/80 bg-[radial-gradient(circle_at_80%_20%,rgba(245,197,66,0.18),transparent_28%),linear-gradient(180deg,#fffbeb_0%,#ffffff_100%)]">
      <div className="section-shell py-16 sm:py-20 lg:py-24">
        <p className="section-kicker">{eyebrow}</p>
        <h1 className="mt-4 max-w-4xl text-4xl font-bold tracking-[-0.04em] text-slate-950 sm:text-5xl lg:text-6xl">{title}</h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">{description}</p>
      </div>
    </header>
  );
}
