import { Clock3, Star } from 'lucide-react';
import { m, useReducedMotion } from 'framer-motion';
import { Link } from 'react-router';

export default function CourseCard({ course, index = 0 }) {
  const reduceMotion = useReducedMotion();
  const price = course.type === 'free'
    ? 'Free'
    : new Intl.NumberFormat('en-US', { style: 'currency', currency: course.currency }).format(course.price);

  return (
    <m.article
      initial={reduceMotion ? false : { opacity: 0, y: 26, scale: 0.985 }}
      whileInView={reduceMotion ? undefined : { opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, amount: 0.18 }}
      transition={{ duration: 0.52, delay: reduceMotion ? 0 : Math.min(index, 5) * 0.1, ease: [0.22, 1, 0.36, 1] }}
      whileHover={reduceMotion ? undefined : { y: -7, scale: 1.012, boxShadow: '0 30px 70px -38px rgba(15,23,42,0.48)' }}
      className="group overflow-hidden rounded-[1.5rem] border border-slate-200/80 bg-white shadow-[0_20px_55px_-38px_rgba(15,23,42,0.35)]"
    >
      <Link to={`/courses/${course.slug}`}>
        <div className="relative aspect-[16/10] overflow-hidden bg-slate-100">
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(11,19,43,0)_0%,rgba(11,19,43,0.28)_100%)]" />
          {course.thumbnail
            ? <img src={course.thumbnail} alt="" loading="lazy" className="h-full w-full object-cover transition duration-500 ease-out group-hover:scale-105" />
            : <div className="grid h-full place-items-center bg-[linear-gradient(135deg,#0B132B,#334155)] text-3xl font-bold text-[#F5C542]">T</div>}
          <span className="absolute left-4 top-4 rounded-full border border-white/60 bg-white/90 px-3 py-1 text-xs font-semibold capitalize text-slate-900 backdrop-blur">{course.level}</span>
        </div>
        <div className="p-6 sm:p-7">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#0B132B]">{course.category?.name || 'General'}</p>
          <h3 className="mt-3 min-h-14 text-xl font-bold tracking-[-0.03em] text-slate-950">{course.title}</h3>
          <p className="mt-2 min-h-10 line-clamp-2 text-sm leading-6 text-slate-500">{course.short_description}</p>
          <p className="mt-4 text-sm text-slate-600">By <strong className="text-slate-900">{course.instructor?.name}</strong></p>
          <div className="mt-5 flex items-center justify-between border-t border-slate-200/80 pt-4">
            <div className="flex items-center gap-4 text-sm text-slate-500">
              <span className="flex items-center gap-1 font-semibold text-amber-600"><Star className="h-4 w-4 fill-current" />{course.review_count ? Number(course.average_rating).toFixed(1) : 'New'}</span>
              <span className="flex items-center gap-1"><Clock3 className="h-4 w-4" />{course.duration}m</span>
            </div>
            <strong className="text-slate-950">{price}</strong>
          </div>
        </div>
      </Link>
    </m.article>
  );
}
