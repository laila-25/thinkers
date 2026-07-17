import { useEffect, useState } from 'react';
import { useParams } from 'react-router';
import api from '../api/client';

export default function LessonPreview() {
  const { lessonId } = useParams();
  const [lesson, setLesson] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => { api.get(`/api/preview/lessons/${lessonId}`).then(({ data }) => setLesson(data.data)).catch(() => setError('This preview is unavailable.')); }, [lessonId]);
  if (error) return <div className="max-w-4xl mx-auto py-20 text-red-700">{error}</div>;
  if (!lesson) return <div className="py-20 text-center">Loading preview…</div>;
  return <section className="max-w-5xl mx-auto px-4 py-12"><p className="text-sm font-semibold text-accent">Free lesson preview</p><h1 className="mt-2 text-3xl font-bold">{lesson.title}</h1><div className="mt-8 bg-white border rounded-2xl p-6">{lesson.content_type === 'text' && <div className="lesson-content" dangerouslySetInnerHTML={{ __html: lesson.text_content || '' }} />}{lesson.content_type === 'video' && lesson.video && <video controls className="w-full rounded-xl bg-black" src={`${api.defaults.baseURL}/api/preview/lessons/${lesson.id}/video`} />}{lesson.content_type === 'quiz' && <p>Quiz previews are not available yet.</p>}</div></section>;
}
