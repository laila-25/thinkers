import api from './client';

export const getBuilder = (courseId, signal) => api.get(`/api/manage/courses/${courseId}/builder`, { signal }).then(response => response.data.data);
export const updateBuilder = (courseId, payload, signal) => api.patch(`/api/manage/courses/${courseId}/builder`, payload, { signal }).then(response => response.data.data);
export const getBuilderPreview = courseId => api.get(`/api/manage/courses/${courseId}/preview`).then(response => response.data.data);
export const submitBuilder = courseId => api.post(`/api/manage/courses/${courseId}/submit`).then(response => response.data.data);
export const uploadCourseMedia = (courseId, kind, file, onProgress, signal) => {
  const form = new FormData();
  form.append(kind === 'thumbnail' ? 'thumbnail' : 'video', file);
  return api.post(`/api/manage/courses/${courseId}/${kind === 'thumbnail' ? 'thumbnail' : 'promotional-video'}`, form, {
    signal,
    // Large course media must not inherit the short timeout used for JSON APIs.
    // The user can still stop the request through the supplied AbortController.
    timeout: 0,
    onUploadProgress: event => onProgress?.(event.total ? Math.round(event.loaded * 100 / event.total) : 0),
  }).then(response => response.data.data);
};
