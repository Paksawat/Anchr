import { useState, useEffect } from 'react';

const DISMISSED_KEY = 'anchr_install_dismissed';

// Capture the event at module load time — it can fire before React mounts,
// and a useEffect listener would miss it entirely.
let _capturedPrompt = null;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  _capturedPrompt = e;
});

export function useInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(() => _capturedPrompt);
  const [dismissed, setDismissed] = useState(
    () => localStorage.getItem(DISMISSED_KEY) === '1',
  );

  // Already running as an installed PWA — no banner needed
  const isStandalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true;

  // iOS Safari: no beforeinstallprompt, needs manual Add-to-Home-Screen instructions
  const isIOS =
    /iPhone|iPad|iPod/.test(navigator.userAgent) && !window.MSStream;

  // Only target mobile browsers
  const isMobile = /Mobi|Android|iPhone|iPad|iPod/.test(navigator.userAgent);

  useEffect(() => {
    // Pick up any prompt that arrives after mount
    const handler = (e) => {
      e.preventDefault();
      _capturedPrompt = e;
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

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

  const showBanner =
    isMobile &&
    !isStandalone &&
    !dismissed &&
    (!!deferredPrompt || isIOS);

  return { showBanner, isIOS, install, dismiss };
}
