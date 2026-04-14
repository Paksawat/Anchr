/**
 * Notification helpers for Anchr.
 *
 * scheduleReminderNotifications(reminders)
 *   — Schedules OS-level notifications for today's remaining reminder times.
 *   — Uses navigator.serviceWorker.ready + reg.showNotification(), so the
 *     notification appears in the OS tray even when the tab is backgrounded.
 *   — Requires: notifications permission granted + SW registered.
 *   — Limitation: doesn't fire if the browser is fully closed.
 *     For true background push, configure VAPID Web Push on the backend.
 */

export async function scheduleReminderNotifications(reminders) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  if (!('serviceWorker' in navigator)) return;
  if (!reminders?.enabled || !reminders?.times?.length) return;

  let reg;
  try {
    reg = await navigator.serviceWorker.ready;
  } catch {
    return;
  }

  const now = new Date();

  for (const timeStr of reminders.times) {
    const [h, m] = timeStr.split(':').map(Number);
    const target = new Date();
    target.setHours(h, m, 0, 0);
    const delay = target - now;

    if (delay > 0) {
      setTimeout(() => {
        // reg.showNotification is a service-worker notification — persists in
        // the OS notification tray and fires even if the tab is not focused
        reg.showNotification('Anchr — time to check in', {
          body: 'Take a moment to reflect. Stay grounded.',
          icon: '/anchr-circle-small.svg',
          badge: '/anchr-circle-small.svg',
          tag: `anchr-${timeStr}`,     // deduplicates: same time won't double-fire
          renotify: false,
          data: { url: '/dashboard' },
        });
      }, delay);
    }
  }
}
