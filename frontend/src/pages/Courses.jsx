import { useEffect, useState } from 'react';
import api from '../api/client';
import CourseCard from '../components/CourseCard';
import { useSearchParams } from 'react-router';

export default function Courses() {
  const [searchParams] = useSearchParams();
  const [courses, setCourses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [filters, setFilters] = useState({ search: searchParams.get('search') || '', category: searchParams.get('category') || '', level: searchParams.get('level') || '', type: searchParams.get('type') || '' });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/api/categories').then(({ data }) => setCategories(data.data)).catch(() => setCategories([]));
  }, []);

  useEffect(() => setFilters(current => ({ ...current, search: searchParams.get('search') || '', category: searchParams.get('category') || current.category })), [searchParams]);

  useEffect(() => {
    const timer = setTimeout(async () => {
      setIsLoading(true);
      setError('');
      try {
        const params = Object.fromEntries(Object.entries(filters).filter(([, value]) => value));
        const { data } = await api.get('/api/courses', { params });
        setCourses(data.data);
      } catch {
        setError('Courses could not be loaded. Please try again.');
      } finally {
        setIsLoading(false);
      }
    }, filters.search ? 300 : 0);

    return () => clearTimeout(timer);
  }, [filters]);

  const updateFilter = event => setFilters(current => ({ ...current, [event.target.name]: event.target.value }));

  return (
    <section className="section-shell page-section">
      <div className="max-w-2xl"><p className="section-kicker">Course catalog</p><h1 className="mt-3 text-4xl font-bold text-slate-950 sm:text-5xl">Explore courses</h1><p className="mt-4 text-lg leading-7 text-slate-600">Learn from approved instructors through courses reviewed by Thinkers.</p></div>
      <div className="mt-10 grid grid-cols-1 gap-4 rounded-[1.5rem] border border-slate-200/80 bg-white p-5 shadow-[0_20px_50px_-35px_rgba(15,23,42,0.28)] md:grid-cols-4">
        <input name="search" value={filters.search} onChange={updateFilter} placeholder="Search courses..." className="md:col-span-1 rounded-xl border border-slate-300 px-4 py-3 outline-none focus:ring-2 focus:ring-primary" />
        <select name="category" value={filters.category} onChange={updateFilter} className="rounded-xl border border-slate-300 px-4 py-3"><option value="">All categories</option>{categories.flatMap(category => [<option key={category.id} value={category.slug}>{category.name}</option>, ...(category.children ?? []).map(child => <option key={child.id} value={child.slug}>— {child.name}</option>)])}</select>
        <select name="level" value={filters.level} onChange={updateFilter} className="rounded-xl border border-slate-300 px-4 py-3"><option value="">All levels</option><option value="beginner">Beginner</option><option value="intermediate">Intermediate</option><option value="advanced">Advanced</option></select>
        <select name="type" value={filters.type} onChange={updateFilter} className="rounded-xl border border-slate-300 px-4 py-3"><option value="">Free and paid</option><option value="free">Free</option><option value="paid">Paid</option></select>
      </div>
      {error && <p className="mt-8 rounded-xl bg-red-50 p-4 text-red-700">{error}</p>}
      {isLoading ? <p className="mt-12 text-center text-slate-500">Loading courses...</p> : courses.length ? <div className="mt-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">{courses.map((course, index) => <CourseCard key={course.id} course={course} index={index} />)}</div> : <div className="mt-12 text-center text-slate-500">No published courses match your filters.</div>}
    </section>
  );
}
