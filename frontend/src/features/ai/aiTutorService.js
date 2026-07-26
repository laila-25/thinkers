import api from '../../api/client';
import i18n from '../../i18n';

const clean = value => String(value || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
const contextPayload = context => ({
  course_title: context.courseTitle || undefined,
  lesson_title: context.lessonTitle || undefined,
  category: context.category || undefined,
  level: context.level || undefined,
  description: clean(context.description).slice(0, 5000) || undefined,
  lesson_content: clean(context.lessonContent).slice(0, 15000) || undefined,
});

const apiMessage = error => {
  if (!error.response) return i18n.t('errors.server', { ns: 'ai' });
  if (error.response.status === 401) return i18n.t('errors.auth', { ns: 'ai' });
  if (error.response.status === 419) return i18n.t('errors.expired', { ns: 'ai' });
  if (error.response.status === 403 && error.response.data?.message === 'Your email address is not verified.') return i18n.language?.startsWith('ar') ? 'تحقق من بريدك الإلكتروني قبل استخدام مساعد Thinkers الذكي.' : 'Verify your email address before using Thinkers AI.';
  if (error.response.status === 429) return i18n.t('errors.rate', { ns: 'ai' });
  return error.response.data?.message || i18n.t('errors.generic', { ns: 'ai' });
};

const csrfHeader = () => {
  if (typeof document === 'undefined') return {};

  const token = document.cookie
    .split('; ')
    .find(cookie => cookie.startsWith('XSRF-TOKEN='))
    ?.slice('XSRF-TOKEN='.length);

  return token ? { 'X-XSRF-TOKEN': decodeURIComponent(token) } : {};
};

async function refreshCsrf() {
  await api.get('/api/csrf-cookie', { params: { refresh: Date.now() } });
}

async function ensureCsrf() {
  if (!csrfHeader()['X-XSRF-TOKEN']) await refreshCsrf();
}

async function postToAi(url, payload) {
  // Reuse the authenticated CSRF cookie. Recovery uses Thinkers' protected
  // resynchronization endpoint, never the public pre-login endpoint.
  await ensureCsrf();

  try {
    return await api.post(url, payload, { headers: csrfHeader() });
  } catch (error) {
    if (error.response?.status === 401) {
      // AuthContext may still be valid while a request raced with Sanctum's
      // session initialization. Confirm the session and retry once before
      // telling the learner to sign in again.
      await api.get('/api/user');
      return api.post(url, payload, { headers: csrfHeader() });
    }

    if (error.response?.status !== 419) throw error;

    await refreshCsrf();
    return api.post(url, payload, { headers: csrfHeader() });
  }
}

export async function chatTutor(question, context = {}, messages = [], conversationId = null) {
  try {
    const { data } = await postToAi('/api/ai/chat', {
      question,
      conversation_id: conversationId || undefined,
      course_id: context.courseId || undefined,
      lesson_id: context.lessonId || undefined,
      context: contextPayload(context),
      messages: messages.slice(-12).map(message => ({ role: message.role, content: message.text || message.content })),
    });
    return data.data;
  } catch (error) {
    throw new Error(apiMessage(error));
  }
}

export async function askTutor(question, context = {}, messages = [], conversationId = null) {
  return (await chatTutor(question, context, messages, conversationId)).response;
}

export async function listConversations() { const { data } = await api.get('/api/ai/conversations'); return data.data; }
export async function loadConversation(id, cursor = null) {
  const { data } = await api.get(`/api/ai/conversations/${id}`, { params: cursor ? { cursor } : undefined });
  return data.data;
}
export async function createConversation(context = {}) { const { data } = await postToAi('/api/ai/conversations', { course_id: context.courseId, lesson_id: context.lessonId }); return data.data; }
export async function deleteConversation(id) {
  await ensureCsrf();
  try { await api.delete(`/api/ai/conversations/${id}`, { headers: csrfHeader() }); }
  catch (error) {
    if (error.response?.status !== 419) throw error;
    await refreshCsrf();
    await api.delete(`/api/ai/conversations/${id}`, { headers: csrfHeader() });
  }
}
export async function explainLesson(lessonId) { const { data } = await postToAi('/api/ai/explain-lesson', { lesson_id: lessonId }); return data.data.explanation; }
export async function summarizeLesson(lessonId) { const { data } = await postToAi('/api/ai/summarize-lesson', { lesson_id: lessonId }); return data.data.summary; }
export async function generateLessonQuiz(lessonId) { const { data } = await postToAi('/api/ai/generate-quiz', { lesson_id: lessonId }); return data.data.questions.map((question, index) => ({ ...question, id: index + 1 })); }

export async function generateSummary(context = {}) {
  const title = context.lessonTitle || context.courseTitle || i18n.t('defaults.topic', { ns: 'ai' });
  const content = clean(context.lessonContent || context.description);
  if (!content) throw new Error(i18n.t('defaults.noContent', { ns: 'ai' }));
  try {
    const { data } = await postToAi('/api/ai/summarize', { title, content: content.slice(0, 20000) });
    return data.data.summary;
  } catch (error) {
    throw new Error(apiMessage(error));
  }
}

export async function generateQuiz(topic = i18n.t('defaults.lesson', { ns: 'ai' }), content = '') {
  try {
    const { data } = await postToAi('/api/ai/generate-quiz', { topic, content: clean(content).slice(0, 15000) || undefined });
    return data.data.questions.map((question, index) => ({ ...question, id: index + 1 }));
  } catch (error) {
    throw new Error(apiMessage(error));
  }
}

export function learningPath(context = {}) {
  const duration = Number(context.duration) || 60;
  return { next: context.nextLesson || i18n.t('defaults.next', { ns: 'ai' }), related: context.category ? i18n.t('defaults.relatedCategory', { ns: 'ai', category: context.category }) : i18n.t('defaults.related', { ns: 'ai' }), difficulty: context.level || i18n.t('defaults.beginner', { ns: 'ai' }), completion: duration < 60 ? i18n.t('defaults.minutes', { ns: 'ai', count: duration }) : i18n.t('defaults.hours', { ns: 'ai', count: Math.ceil(duration / 60) }) };
}

export function isProgrammingCourse(category = '') {
  return /(program|software|web|code|develop|computer|javascript|python|php|react)/i.test(category);
}
