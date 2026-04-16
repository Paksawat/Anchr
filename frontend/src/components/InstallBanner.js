import React, { useState } from 'react';
import { Download, X, Share } from 'lucide-react';
import { useInstallPrompt } from '../hooks/useInstallPrompt';

export default function InstallBanner() {
  const { showBanner, isIOS, isAndroid, install, dismiss } = useInstallPrompt();
  const [showIOSSteps, setShowIOSSteps] = useState(false);

  if (!showBanner) return null;

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIOSSteps((prev) => !prev);
    } else if (isAndroid) {
      const accepted = await install();
      if (accepted) dismiss();
    }
  };

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden"
      style={{ filter: 'drop-shadow(0 -2px 12px rgba(42,58,53,0.10))' }}
    >
      {/* iOS: step-by-step instruction sheet */}
      {isIOS && showIOSSteps && (
        <div
          className="px-5 py-4 border-t"
          style={{ background: '#FFFFFF', borderColor: '#E8E6E1' }}
        >
          <p className="text-xs font-medium mb-3" style={{ color: '#7A8B85' }}>
            Add Anchr to your Home Screen:
          </p>
          <ol className="space-y-2.5">
            {[
              {
                icon: <Share className="w-4 h-4 shrink-0" style={{ color: '#6B9080' }} strokeWidth={1.5} />,
                text: 'Tap the Share button in Safari\'s toolbar',
              },
              {
                icon: <span className="w-4 h-4 shrink-0 text-center text-xs font-bold" style={{ color: '#6B9080' }}>+</span>,
                text: 'Scroll down and tap "Add to Home Screen"',
              },
              {
                icon: <span className="w-4 h-4 shrink-0 text-center text-xs font-bold" style={{ color: '#6B9080' }}>✓</span>,
                text: 'Tap "Add" in the top-right corner',
              },
            ].map(({ icon, text }, i) => (
              <li key={i} className="flex items-center gap-3">
                {icon}
                <span className="text-xs" style={{ color: '#2A3A35' }}>{text}</span>
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Main banner */}
      <div
        className="flex items-center gap-3 px-4 py-3"
        style={{ background: '#2A3A35' }}
      >
        <img
          src="/anchr-circle-small.svg"
          alt=""
          className="w-9 h-9 rounded-xl shrink-0"
        />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium leading-tight" style={{ color: '#FFFFFF' }}>
            Install Anchr
          </p>
          <p className="text-xs mt-0.5 leading-tight" style={{ color: '#A4C3B2' }}>
            {isIOS ? 'Add to your Home Screen via Safari' : 'Add to your home screen'}
          </p>
        </div>
        <button
          onClick={handleInstallClick}
          className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold shrink-0 transition-opacity active:opacity-75"
          style={{ background: '#6B9080', color: '#FFFFFF' }}
        >
          <Download className="w-3.5 h-3.5" strokeWidth={2} />
          {isIOS ? (showIOSSteps ? 'Hide' : 'How to') : 'Install'}
        </button>
        <button
          onClick={dismiss}
          className="p-1.5 rounded-lg shrink-0 transition-opacity active:opacity-75"
          style={{ color: '#A4C3B2' }}
          aria-label="Dismiss install banner"
        >
          <X className="w-4 h-4" strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}
