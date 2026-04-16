/**
 * scheduleReminderNotifications(reminders)
 *
 * Sends the reminder schedule to the service worker via postMessage.
 * The SW owns the setTimeout calls — this means the notifications fire
 * even when the page is backgrounded, as long as the SW is still alive.
 *
 * Requirements: Notification permission granted + SW registered.
 * Limitation: does not fire if the browser process is fully closed.
 * For true always-on push, configure VAPID Web Push on the backend.
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

  if (!reg.active) return;

  reg.active.postMessage({
    type: 'SCHEDULE_REMINDERS',
    times: reminders.times,
    days: reminders.days || [],
  });
}
