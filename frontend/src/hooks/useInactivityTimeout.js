import { useState, useEffect, useRef, useCallback } from 'react';

const INACTIVITY_MS = 20 * 60 * 1000; // 20 minutes idle → show prompt
const COUNTDOWN_MS  =  3 * 60 * 1000; // 3 minutes to respond → auto logout

const ACTIVITY_EVENTS = [
  'mousemove', 'mousedown', 'keydown',
  'scroll', 'touchstart', 'click',
];

function isStandalone() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true
  );
}

/**
 * useInactivityTimeout(onLogout)
 *
 * Only active when the app is opened in a regular browser tab (not installed PWA).
 *
 * Flow:
 *   1. Any user activity resets the 20-minute inactivity timer.
 *   2. After 20 min of silence, `showPrompt` becomes true.
 *   3. User has 3 minutes to click "Stay logged in"; `countdown` ticks down.
 *   4. If no action: onLogout() fires automatically.
 *   5. While the prompt is visible, activity events are ignored so the timer
 *      doesn't silently reset behind the modal.
 *
 * Returns { showPrompt, countdown (seconds), stayLoggedIn, forceLogout }
 */
export function useInactivityTimeout(onLogout) {
  const [showPrompt, setShowPrompt] = useState(false);
  const [countdown, setCountdown]   = useState(COUNTDOWN_MS / 1000);

  // Refs keep the latest values accessible inside event listeners / setTimeout
  // callbacks without needing to re-register them on every render.
  const showPromptRef = useRef(false);
  const onLogoutRef   = useRef(onLogout);
  const inactivityId  = useRef(null);
  const countdownId   = useRef(null);
  const intervalId    = useRef(null);

  useEffect(() => { onLogoutRef.current = onLogout; }, [onLogout]);
  useEffect(() => { showPromptRef.current = showPrompt; }, [showPrompt]);

  // ── helpers ──────────────────────────────────────────────────────────────

  const clearAll = useCallback(() => {
    clearTimeout(inactivityId.current);
    clearTimeout(countdownId.current);
    clearInterval(intervalId.current);
  }, []);

  const doLogout = useCallback(() => {
    clearAll();
    setShowPrompt(false);
    showPromptRef.current = false;
    onLogoutRef.current();
  }, [clearAll]);

  const startCountdown = useCallback(() => {
    setShowPrompt(true);
    showPromptRef.current = true;
    setCountdown(COUNTDOWN_MS / 1000);

    // Tick every second so the UI shows a live countdown
    intervalId.current = setInterval(() => {
      setCountdown((prev) => Math.max(0, prev - 1));
    }, 1000);

    // Hard logout when countdown expires
    countdownId.current = setTimeout(doLogout, COUNTDOWN_MS);
  }, [doLogout]);

  const resetInactivityTimer = useCallback(() => {
    clearTimeout(inactivityId.current);
    inactivityId.current = setTimeout(startCountdown, INACTIVITY_MS);
  }, [startCountdown]);

  // ── public API ────────────────────────────────────────────────────────────

  const stayLoggedIn = useCallback(() => {
    clearAll();
    setShowPrompt(false);
    showPromptRef.current = false;
    resetInactivityTimer(); // restart the 20-minute clock
  }, [clearAll, resetInactivityTimer]);

  // ── mount / unmount ───────────────────────────────────────────────────────

  useEffect(() => {
    // PWA installs don't need this — the OS handles the session lifecycle
    if (isStandalone()) return;

    const onActivity = () => {
      // Ignore activity while the prompt is open — user must explicitly choose
      if (showPromptRef.current) return;
      resetInactivityTimer();
    };

    resetInactivityTimer(); // start timer on mount
    ACTIVITY_EVENTS.forEach((ev) =>
      window.addEventListener(ev, onActivity, { passive: true }),
    );

    return () => {
      clearAll();
      ACTIVITY_EVENTS.forEach((ev) =>
        window.removeEventListener(ev, onActivity),
      );
    };
  }, [resetInactivityTimer, clearAll]);

  return { showPrompt, countdown, stayLoggedIn, forceLogout: doLogout };
}
