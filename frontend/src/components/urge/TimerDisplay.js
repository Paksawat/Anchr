import React, { useState } from 'react';
import { Play, Pause, X } from 'lucide-react';
import { Button } from '../ui/button';

export default function TimerDisplay({ timeLeft, timerDuration, isRunning, encouragement, onTogglePause, onCancel, formatTime }) {
  const progress = ((timerDuration - timeLeft) / timerDuration) * 100;
  const [confirmCancel, setConfirmCancel] = useState(false);

  const handleCancelClick = () => {
    if (confirmCancel) {
      onCancel();
    } else {
      setConfirmCancel(true);
      // Auto-dismiss confirm state after 3 seconds
      setTimeout(() => setConfirmCancel(false), 3000);
    }
  };

  return (
    <div className="text-center py-8">
      <div className="relative w-48 h-48 mx-auto mb-6">
        <svg className="w-48 h-48 -rotate-90" viewBox="0 0 200 200">
          <circle cx="100" cy="100" r="90" fill="none" stroke="#E8E6E1" strokeWidth="4" />
          <circle
            cx="100" cy="100" r="90" fill="none" stroke="#6B9080" strokeWidth="4"
            strokeDasharray={`${2 * Math.PI * 90}`}
            strokeDashoffset={`${2 * Math.PI * 90 * (1 - progress / 100)}`}
            strokeLinecap="round"
            className="transition-all duration-1000"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span data-testid="timer-countdown" className="font-heading text-4xl font-light" style={{ color: '#2A3A35' }}>
            {formatTime(timeLeft)}
          </span>
          <span className="text-xs mt-1" style={{ color: '#A3B1AA' }}>remaining</span>
        </div>
      </div>

      <p className="text-lg italic max-w-sm mx-auto" style={{ color: '#7A8B85', fontFamily: 'Figtree, sans-serif' }}>
        "{encouragement}"
      </p>

      <div className="flex justify-center gap-3 mt-6">
        <Button
          data-testid="pause-timer-btn"
          onClick={onTogglePause}
          variant="outline"
          className="rounded-full px-6 active:scale-95 transition-transform"
          style={{ border: '1px solid #E8E6E1' }}
        >
          {isRunning
            ? <><Pause className="w-4 h-4 mr-2" strokeWidth={2} /> Pause</>
            : <><Play className="w-4 h-4 mr-2" strokeWidth={2} /> Resume</>}
        </Button>

        <button
          onClick={handleCancelClick}
          className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all active:scale-95"
          style={{
            background: confirmCancel ? '#FDF2F2' : '#F0EFEB',
            color: confirmCancel ? '#E5989B' : '#A3B1AA',
            border: `1px solid ${confirmCancel ? '#E5989B55' : '#E8E6E1'}`,
          }}
        >
          <X className="w-4 h-4" strokeWidth={2} />
          {confirmCancel ? 'Tap again to cancel' : 'Stop'}
        </button>
      </div>
    </div>
  );
}
