export default function SectionTitle({ eyebrow, title, description, align = 'left' }) {
  const centered = align === 'center';
  return (
    <div className={`${centered ? 'mx-auto text-center' : ''} max-w-2xl`}>
      <p className="text-xs font-extrabold uppercase tracking-[0.24em] text-amber-700">{eyebrow}</p>
      <h2 className="mt-4 text-3xl font-extrabold leading-tight text-slate-950 sm:text-4xl lg:text-5xl">{title}</h2>
      {description && <p className="mt-5 text-base leading-7 text-slate-600 sm:text-lg">{description}</p>}
    </div>
  );
}
