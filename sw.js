const timers = new Map();

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));

self.addEventListener('message', event => {
  const { type, data } = event.data || {};
  if (type === 'SCHEDULE') scheduleOne(data);
  else if (type === 'CANCEL') cancelOne(data.id);
  else if (type === 'RESCHEDULE_ALL') {
    timers.forEach(t => clearTimeout(t));
    timers.clear();
    (data.items || []).forEach(scheduleOne);
  }
});

function scheduleOne(item) {
  const delay = item.time - Date.now();
  if (delay <= 0) return;
  cancelOne(item.id);
  const t = setTimeout(() => fire(item), delay);
  timers.set(item.id, t);
}

function cancelOne(id) {
  if (timers.has(id)) { clearTimeout(timers.get(id)); timers.delete(id); }
}

async function fire(item) {
  timers.delete(item.id);
  await self.registration.showNotification(`💬 ${item.contactName}`, {
    body: item.message.length > 90 ? item.message.slice(0, 90) + '…' : item.message,
    icon: '/icon.svg',
    badge: '/icon.svg',
    tag: item.id,
    data: { waUrl: item.waUrl, id: item.id },
    requireInteraction: true,
    actions: [{ action: 'open', title: 'Open WhatsApp' }]
  });
  const clients = await self.clients.matchAll({ type: 'window' });
  clients.forEach(c => c.postMessage({ type: 'FIRED', id: item.id }));
}

self.addEventListener('notificationclick', event => {
  event.notification.close();
  const { waUrl } = event.notification.data || {};
  if (!waUrl) return;
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then(clients => {
      if (clients.length) {
        clients[0].focus();
        clients[0].postMessage({ type: 'OPEN_WA', waUrl });
      } else {
        self.clients.openWindow(waUrl);
      }
    })
  );
});
