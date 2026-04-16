import { useState, useEffect } from 'react';

const DISMISSED_KEY = 'anchr_install_dismissed';

// ── Platform detection (evaluated once at module load) ──────────────────────
const ua = navigator.userAgent;

// iOS: iPhone, iPad (both old UA and new iPadOS desktop UA)
const isIOS =
  /iPhone|iPad|iPod/.test(ua) ||
  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

// Android: any Android browser
const isAndroid = /Android/.test(ua);

// Standalone detection is platform-specific:
//   iOS  → navigator.standalone (set by Safari when launched from Home Screen)
//   Android/Chrome → matchMedia display-mode
const isStandalone = isIOS
  ? window.navigator.standalone === true
  : window.matchMedia('(display-mode: standalone)').matches;

// Capture beforeinstallprompt at module load — it can fire before React mounts.
let _capturedPrompt = null;
if (!isStandalone) {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    _capturedPrompt = e;
  });
}

// ── Hook ────────────────────────────────────────────────────────────────────
export function useInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(() => _capturedPrompt);
  const [dismissed, setDismissed] = useState(
    () => localStorage.getItem(DISMISSED_KEY) === '1',
  );

  // Pick up any prompt that arrives after mount
  useEffect(() => {
    if (isStandalone) return; // already installed — skip
    const handler = (e) => {
      e.preventDefault();
      _capturedPrompt = e;
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  // Clear prompt once the user installs via the native OS dialog
  useEffect(() => {
    const handler = () => {
      _capturedPrompt = null;
      setDeferredPrompt(null);
    };
    window.addEventListener('appinstalled', handler);
    return () => window.removeEventListener('appinstalled', handler);
  }, []);

  const install = async () => {
    if (!deferredPrompt) return false;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      _capturedPrompt = null;
      setDeferredPrompt(null);
    }
    return outcome === 'accepted';
  };

  const dismiss = () => {
    localStorage.setItem(DISMISSED_KEY, '1');
    setDismissed(true);
  };

  // iOS: show banner when not in standalone (no prompt available — manual steps needed)
  // Android: show banner when Chrome has surfaced a prompt
  const showBanner = !isStandalone && !dismissed && (
    (isIOS) ||
    (isAndroid && !!deferredPrompt)
  );

  return { showBanner, isIOS, isAndroid, install, dismiss };
}
