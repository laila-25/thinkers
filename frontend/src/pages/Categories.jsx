import { useEffect, useState } from 'react';
import api from '../api/client';
import CategoryCard from '../components/CategoryCard';
import PageHero from '../components/PageHero';

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    let active = true;
    api.get('/api/categories')
      .then(({ data }) => {
        if (active) setCategories(data.data || []);
      })
      .catch(() => {
        if (active) setStatus('error');
      })
      .finally(() => {
        if (active) setStatus(current => current === 'error' ? current : 'ready');
      });
    return () => { active = false; };
  }, []);

  return (
    <div className="bg-white">
      <PageHero eyebrow="Explore topics" title="Find the subject that moves you forward." description="Browse every active Thinkers category and discover carefully reviewed courses built around your goals." />
      <section className="page-section">
        <div className="section-shell">
          {status === 'loading' && <p className="text-center text-slate-500">Loading categories...</p>}
          {status === 'error' && <p className="notice mx-auto max-w-xl text-center">Categories could not be loaded. Please try again.</p>}
          {status === 'ready' && (categories.length ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {categories.map((category, index) => (
                <CategoryCard key={category.id} category={category} index={index} />
              ))}
            </div>
          ) : <p className="text-center text-slate-500">Categories will appear here when available.</p>)}
        </div>
      </section>
    </div>
  );
}
