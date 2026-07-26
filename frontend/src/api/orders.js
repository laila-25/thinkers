import api from './client';

export const getCheckoutCourse = courseId => api.get(`/api/checkout/courses/${courseId}`);

export const getOrders = (signal, courseId = null) => api.get('/api/orders', {
  signal,
  params: courseId ? { course_id: Number(courseId) } : undefined,
});

export const createOrder = courseId => api.post('/api/orders', { course_id: Number(courseId) });
