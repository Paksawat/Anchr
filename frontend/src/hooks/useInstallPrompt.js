import { useState, useEffect } from 'react';

const DISMISSED_KEY = 'anchr_install_dismissed';

export function useInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
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
    const handler = (e) => {
      e.preventDefault(); // stop Chrome mini-infobar
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  // Detect if user installs through the native prompt and hide the banner
  useEffect(() => {
    const handler = () => setDeferredPrompt(null);
    window.addEventListener('appinstalled', handler);
    return () => window.removeEventListener('appinstalled', handler);
  }, []);

  const install = async () => {
    if (!deferredPrompt) return false;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setDeferredPrompt(null);
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
