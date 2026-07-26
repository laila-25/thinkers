import { useEffect } from 'react';
import { useLocation } from 'react-router';

const metadata = {
  '/': ['Thinkers | Learn with purpose', 'Expert-led online courses, structured learning paths, and AI-assisted education.'],
  '/courses': ['Courses | Thinkers', 'Explore expert-led courses and build practical skills with Thinkers.'],
  '/categories': ['Course Categories | Thinkers', 'Browse Thinkers courses by subject and learning goal.'],
  '/about': ['About | Thinkers', 'Learn how Thinkers creates focused, trustworthy online education.'],
  '/contact': ['Contact | Thinkers', 'Contact the Thinkers team for learning and platform support.'],
  '/login': ['Sign in | Thinkers', 'Sign in to continue learning on Thinkers.'],
  '/register': ['Create account | Thinkers', 'Create your Thinkers learning account.'],
};
export default function RouteMetadata() {
  const { pathname } = useLocation();
  const [title, description] = metadata[pathname] || (pathname.startsWith('/courses/') ? ['Course Details | Thinkers', 'Review course details, curriculum, and instructor information on Thinkers.'] : pathname.includes('dashboard') ? ['Dashboard | Thinkers', 'Manage your Thinkers learning activity and progress.'] : ['Thinkers', 'A focused platform for expert-led online learning.']);
  const origin = window.location.origin; const canonical = `${origin}${pathname}`;

  useEffect(() => {
    const setMeta = (attribute, key, content) => {
      let element = document.head.querySelector(`meta[${attribute}="${key}"]`);
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attribute, key);
        document.head.appendChild(element);
      }
      element.content = content;
    };

    document.title = title;
    setMeta('name', 'description', description);
    setMeta('name', 'robots', pathname.includes('dashboard') || pathname.startsWith('/learn/') ? 'noindex,nofollow' : 'index,follow');
    setMeta('property', 'og:type', 'website');
    setMeta('property', 'og:site_name', 'Thinkers');
    setMeta('property', 'og:title', title);
    setMeta('property', 'og:description', description);
    setMeta('property', 'og:url', canonical);
    setMeta('name', 'twitter:card', 'summary_large_image');
    setMeta('name', 'twitter:title', title);
    setMeta('name', 'twitter:description', description);

    let canonicalLink = document.head.querySelector('link[rel="canonical"]');
    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.rel = 'canonical';
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.href = canonical;

    let schema = document.head.querySelector('script[data-thinkers-schema]');
    if (!schema) {
      schema = document.createElement('script');
      schema.type = 'application/ld+json';
      schema.dataset.thinkersSchema = '';
      document.head.appendChild(schema);
    }
    schema.textContent = JSON.stringify({ '@context': 'https://schema.org', '@type': 'WebSite', name: 'Thinkers', url: origin });
  }, [canonical, description, origin, pathname, title]);

  return null;
}
