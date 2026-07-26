import { useEffect, useState } from 'react';
import { useParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import api from '../api/client';
import VideoPlayer from '../components/VideoPlayer';

export default function LessonPreview() {
  const { t } = useTranslation('courses'); const { lessonId } = useParams(); const [lesson, setLesson] = useState(null); const [error, setError] = useState('');
  useEffect(() => { api.get(`/api/preview/lessons/${lessonId}`).then(({ data }) => setLesson(data.data)).catch(() => setError(t('details.notFound'))); }, [lessonId, t]);
  if (error) return <div className="mx-auto max-w-4xl py-20 text-red-700">{error}</div>;
  if (!lesson) return <div className="py-20 text-center">{t('preview.loading')}</div>;
  return <section className="mx-auto max-w-5xl px-4 py-12"><p className="text-sm font-semibold text-accent">{t('preview.free')}</p><h1 className="mt-2 text-3xl font-bold">{lesson.title}</h1><div className="mt-8 rounded-2xl border bg-white p-6">{lesson.content_type === 'text' && <div className="lesson-content" dangerouslySetInnerHTML={{ __html: lesson.text_content || '' }}/>} {lesson.content_type === 'video' && lesson.video && <VideoPlayer src={`${api.defaults.baseURL}/api/preview/lessons/${lesson.id}/video`} type={lesson.video.mime_type}/>} {lesson.content_type === 'quiz' && <p>{t('preview.quizUnavailable')}</p>}</div></section>;
}
