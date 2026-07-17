import { useState } from 'react';
import { ArrowRight, BriefcaseBusiness, Code2, Languages, Palette, Sparkles, Shapes } from 'lucide-react';
import { m, useReducedMotion } from 'framer-motion';
import { Link } from 'react-router';

const icons = [Code2, BriefcaseBusiness, Palette, Languages, Shapes, Sparkles];

export default function CategoryCard({ category, index = 0 }) {
  const [active, setActive] = useState(false);
  const reduceMotion = useReducedMotion();
  const Icon = icons[index % icons.length];
  const description = category.description || `Explore reviewed ${category.name.toLowerCase()} courses and build practical skills.`;
  const state = active ? 'active' : 'rest';

  return (
    <m.article
      initial="rest"
      animate={state}
      variants={{
        rest: { y: 0, scale: 1, boxShadow: '0 20px 55px -42px rgba(15,23,42,0.35)' },
        active: { y: reduceMotion ? 0 : -6, scale: reduceMotion ? 1 : 1.012, boxShadow: '0 28px 65px -36px rgba(15,23,42,0.42)' },
      }}
      transition={{ duration: reduceMotion ? 0 : 0.3, ease: [0.22, 1, 0.36, 1] }}
      onHoverStart={() => setActive(true)}
      onHoverEnd={() => setActive(false)}
      onFocusCapture={() => setActive(true)}
      onBlurCapture={() => setActive(false)}
      className="h-full overflow-hidden rounded-3xl border border-slate-200 bg-white"
    >
      <Link to={`/courses?category=${category.slug}`} className="group flex h-full flex-col p-6 sm:p-7">
        <div className="flex items-start justify-between gap-4">
          <m.span
            variants={{ rest: { rotate: 0, scale: 1 }, active: { rotate: reduceMotion ? 0 : -6, scale: reduceMotion ? 1 : 1.1 } }}
            transition={{ type: 'spring', stiffness: 280, damping: 18 }}
            className="grid h-12 w-12 place-items-center rounded-2xl bg-amber-50 text-[#0B132B] ring-1 ring-amber-100"
          >
            <Icon className="h-6 w-6" />
          </m.span>
          <span className="text-sm font-bold text-amber-600">{String(index + 1).padStart(2, '0')}</span>
        </div>
        <h2 className="mt-6 text-xl font-bold text-slate-950">{category.name}</h2>
        <m.div
          variants={{ rest: { height: 0, opacity: 0, marginTop: 0 }, active: { height: 'auto', opacity: 1, marginTop: 10 } }}
          transition={{ duration: reduceMotion ? 0 : 0.28, ease: 'easeOut' }}
          className="hidden overflow-hidden sm:block"
        >
          <p className="line-clamp-2 text-sm leading-6 text-slate-600">{description}</p>
        </m.div>
        <p className="mt-3 text-sm leading-6 text-slate-600 sm:hidden">{description}</p>
        <span className="mt-auto inline-flex items-center gap-2 pt-5 text-sm font-semibold text-slate-600 transition-colors group-hover:text-slate-950 group-focus-visible:text-slate-950">
          Explore courses
          <m.span variants={{ rest: { x: 0 }, active: { x: reduceMotion ? 0 : 5 } }}><ArrowRight className="h-4 w-4" /></m.span>
        </span>
      </Link>
    </m.article>
  );
}
