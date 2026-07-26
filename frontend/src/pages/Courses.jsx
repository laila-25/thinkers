import { useEffect, useState } from 'react';
import api from '../api/client';
import CourseCard from '../components/CourseCard';
import { useSearchParams } from 'react-router';
import { useTranslation } from 'react-i18next';

export default function Courses() {
  const { t } = useTranslation('courses');
  const [searchParams] = useSearchParams();
  const [courses, setCourses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [filters, setFilters] = useState({ search: searchParams.get('search') || '', category: searchParams.get('category') || '', level: searchParams.get('level') || '', type: searchParams.get('type') || '' });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    api.get('/api/categories', { signal: controller.signal }).then(({ data }) => setCategories(data.data)).catch(() => { if (!controller.signal.aborted) setCategories([]); });
    return () => controller.abort();
  }, []);

  useEffect(() => setFilters(current => ({ ...current, search: searchParams.get('search') || '', category: searchParams.get('category') || current.category })), [searchParams]);

  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setIsLoading(true);
      setError('');
      try {
        const params = Object.fromEntries(Object.entries(filters).filter(([, value]) => value));
        const { data } = await api.get('/api/courses', { params, signal: controller.signal });
        setCourses(data.data);
      } catch {
        if (!controller.signal.aborted) setError(t('catalog.error'));
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    }, filters.search ? 300 : 0);

    return () => { clearTimeout(timer); controller.abort(); };
  }, [filters, t]);

  const updateFilter = event => setFilters(current => ({ ...current, [event.target.name]: event.target.value }));

  return (
    <section className="section-shell page-section">
      <div className="max-w-2xl"><p className="section-kicker">{t('catalog.eyebrow')}</p><h1 className="mt-3 text-4xl font-bold text-slate-950 sm:text-5xl">{t('catalog.title')}</h1><p className="mt-4 text-lg leading-7 text-slate-600">{t('catalog.description')}</p></div>
      <div className="mt-10 grid grid-cols-1 gap-4 rounded-[1.5rem] border border-slate-200/80 bg-white p-5 shadow-[0_20px_50px_-35px_rgba(15,23,42,0.28)] md:grid-cols-4">
        <input name="search" value={filters.search} onChange={updateFilter} placeholder={t('catalog.search')} className="md:col-span-1 rounded-xl border border-slate-300 px-4 py-3 outline-none focus:ring-2 focus:ring-primary" />
        <select name="category" value={filters.category} onChange={updateFilter} className="rounded-xl border border-slate-300 px-4 py-3"><option value="">{t('catalog.allCategories')}</option>{categories.flatMap(category => [<option key={category.id} value={category.slug}>{category.name}</option>, ...(category.children ?? []).map(child => <option key={child.id} value={child.slug}>— {child.name}</option>)])}</select>
        <select name="level" value={filters.level} onChange={updateFilter} className="rounded-xl border border-slate-300 px-4 py-3"><option value="">{t('catalog.allLevels')}</option><option value="beginner">{t('catalog.beginner')}</option><option value="intermediate">{t('catalog.intermediate')}</option><option value="advanced">{t('catalog.advanced')}</option></select>
        <select name="type" value={filters.type} onChange={updateFilter} className="rounded-xl border border-slate-300 px-4 py-3"><option value="">{t('catalog.allTypes')}</option><option value="free">{t('catalog.free')}</option><option value="paid">{t('catalog.paid')}</option></select>
      </div>
      {error && <p className="mt-8 rounded-xl bg-red-50 p-4 text-red-700">{error}</p>}
      {isLoading ? <p className="mt-12 text-center text-slate-500">{t('catalog.loading')}</p> : courses.length ? <div className="mt-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">{courses.map((course, index) => <CourseCard key={course.id} course={course} index={index} />)}</div> : <div className="mt-12 text-center text-slate-500">{t('catalog.empty')}</div>}
    </section>
  );
}
