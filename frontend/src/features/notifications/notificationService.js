const unwrap = response => response.data;
const client = () => import('../../api/client').then(module => module.default);

export const notificationService = {
  list: async ({ cursor, perPage = 15, unread = false, signal } = {}) => (await client()).get('/api/notifications', {
    signal, params: { cursor: cursor || undefined, per_page: perPage, unread: unread || undefined },
  }).then(unwrap),
  markRead: async (id, signal) => (await client()).patch(`/api/notifications/${id}/read`, {}, { signal }).then(unwrap),
  markAllRead: async signal => (await client()).patch('/api/notifications/read-all', {}, { signal }).then(unwrap),
  settings: async signal => (await client()).get('/api/notification-settings', { signal }).then(unwrap),
  updateSettings: async (preferences, signal) => (await client()).patch('/api/notification-settings', preferences, { signal }).then(unwrap),
  subscribe: (listener, { interval = 60_000, enabled = true } = {}) => {
    if (!enabled) return () => {};
    let controller;
    const refresh = async () => {
      controller?.abort();
      controller = new AbortController();
      try { listener(await notificationService.list({ perPage: 8, signal: controller.signal })); }
      catch (error) { if (error.code !== 'ERR_CANCELED') listener(null, error); }
    };
    refresh();
    const timer = window.setInterval(refresh, interval);
    return () => { window.clearInterval(timer); controller?.abort(); };
  },
};
