import { ArrowUpRight, Clock3, Star } from 'lucide-react';
import { memo } from 'react';
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';

function CourseCard({ course, index = 0 }) {
  const { t, i18n } = useTranslation('courses');
  const price = course.type === 'free'
    ? t('catalog.free')
    : new Intl.NumberFormat(i18n.language === 'ar' ? 'ar-JO' : 'en-US', { style: 'currency', currency: course.currency || 'USD' }).format(course.price);

  return (
    <article style={{ '--card-index': index }} className="landing-card group h-full overflow-hidden rounded-[1.5rem] border border-slate-200/80 bg-white shadow-[0_20px_55px_-38px_rgba(15,23,42,0.35)] hover:shadow-[0_30px_70px_-38px_rgba(15,23,42,0.48)]">
      <Link to={`/courses/${course.slug}`} className="flex h-full flex-col focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#F5C542]/40">
        <div className="relative aspect-[16/10] overflow-hidden bg-slate-100">
          {course.thumbnail
            ? <img src={course.thumbnail} alt={`${course.title} course`} loading="lazy" decoding="async" width="640" height="400" className="h-full w-full object-cover transition duration-500 ease-out group-hover:scale-105" />
            : <div className="grid h-full place-items-center bg-[linear-gradient(135deg,#FFF8D9,#F5C542)] text-3xl font-extrabold text-slate-950">T</div>}
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(11,19,43,0)_45%,rgba(11,19,43,0.38)_100%)]" />
          <span className="absolute left-4 top-4 rounded-full border border-white/60 bg-white/90 px-3 py-1 text-xs font-semibold capitalize text-slate-900 backdrop-blur">{course.level}</span>
        </div>
        <div className="flex flex-1 flex-col p-6 sm:p-7">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#0B132B]">{course.category?.name || 'General'}</p>
          <h3 className="mt-3 min-h-14 text-xl font-bold tracking-[-0.03em] text-slate-950">{course.title}</h3>
          <p className="mt-2 min-h-10 line-clamp-2 text-sm leading-6 text-slate-500">{course.short_description}</p>
          <p className="mt-4 text-sm text-slate-600">{t('card.by')} <strong className="text-slate-900">{course.instructor?.name}</strong></p>
          <div className="mt-auto flex items-center justify-between border-t border-slate-200/80 pt-5">
            <div className="flex items-center gap-4 text-sm text-slate-500">
              <span className="flex items-center gap-1 font-semibold text-amber-600"><Star className="h-4 w-4 fill-current" />{course.review_count ? Number(course.average_rating).toFixed(1) : t('card.new')}</span>
              <span className="flex items-center gap-1"><Clock3 className="h-4 w-4" />{course.duration}m</span>
            </div>
            <strong className="flex items-center gap-1 text-slate-950">{price}<ArrowUpRight className="h-4 w-4 text-amber-500 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" /></strong>
          </div>
        </div>
      </Link>
    </article>
  );
}

export default memo(CourseCard);
