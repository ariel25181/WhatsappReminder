(function (root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
  if (root) {
    root.schedulerUtils = api;
  }
})(typeof self !== 'undefined' ? self : globalThis, function () {
  function getDelayMs(item, now = Date.now()) {
    const time = Number(item && item.time);
    if (!Number.isFinite(time)) return 0;
    return Math.max(0, time - now);
  }

  function isReminderDue(item, now = Date.now()) {
    return getDelayMs(item, now) <= 0;
  }

  function buildNotificationPayload(item) {
    const message = String(item && item.message ? item.message : '');
    return {
      title: `💬 ${item && item.contactName ? item.contactName : 'Reminder'}`,
      body: message.length > 90 ? `${message.slice(0, 90)}…` : message,
      data: { waUrl: item && item.waUrl, id: item && item.id },
      requireInteraction: true,
      actions: [{ action: 'open', title: 'Open WhatsApp' }]
    };
  }

  function resolveBasePath(pathname) {
    const base = pathname || '/';
    if (base.endsWith('/')) return base;
    const lastSlash = base.lastIndexOf('/');
    return lastSlash >= 0 ? base.slice(0, lastSlash + 1) : '/';
  }

  function resolveAppUrl(path, basePath = '/') {
    if (!path) return basePath;
    if (/^https?:\/\//i.test(path)) return path;
    if (path.startsWith('/')) return path;
    return `${basePath}${path.replace(/^\.\//, '')}`;
  }

  return { getDelayMs, isReminderDue, buildNotificationPayload, resolveBasePath, resolveAppUrl };
});
