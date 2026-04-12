import React from 'react';
import { Play, Pause } from 'lucide-react';
import { Button } from '../ui/button';

export default function TimerDisplay({ timeLeft, timerDuration, isRunning, encouragement, onTogglePause, formatTime }) {
  const progress = ((timerDuration - timeLeft) / timerDuration) * 100;

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
          className="rounded-full px-6"
          style={{ border: '1px solid #E8E6E1' }}
        >
          {isRunning ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
          {isRunning ? 'Pause' : 'Resume'}
        </Button>
      </div>
    </div>
  );
}
