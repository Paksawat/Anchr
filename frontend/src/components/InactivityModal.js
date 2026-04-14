import React from 'react';
import { Clock, LogOut } from 'lucide-react';
import { Button } from './ui/button';

function fmt(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function InactivityModal({ countdown, onStay, onLogout }) {
  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      style={{ background: 'rgba(42,58,53,0.55)', backdropFilter: 'blur(6px)' }}
    >
      <div
        className="w-full max-w-sm rounded-3xl p-8 shadow-2xl"
        style={{ background: '#FFFFFF', border: '1px solid #E8E6E1' }}
      >
        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center"
            style={{ background: '#FDF2F2' }}
          >
            <Clock
              className="w-8 h-8"
              style={{ color: '#E5989B' }}
              strokeWidth={1.5}
            />
          </div>
        </div>

        {/* Heading */}
        <h2
          className="font-heading text-2xl font-light text-center mb-2"
          style={{ color: '#2A3A35' }}
        >
          Still there?
        </h2>

        {/* Body */}
        <p
          className="text-sm text-center mb-1"
          style={{ color: '#7A8B85', fontFamily: 'Figtree, sans-serif' }}
        >
          You've been inactive for 20 minutes.
        </p>
        <p
          className="text-sm text-center mb-8"
          style={{ color: '#7A8B85', fontFamily: 'Figtree, sans-serif' }}
        >
          You'll be logged out in{' '}
          <span
            className="font-semibold tabular-nums"
            style={{ color: '#E5989B' }}
          >
            {fmt(countdown)}
          </span>
        </p>

        {/* Actions */}
        <div className="flex flex-col gap-3">
          <Button
            onClick={onStay}
            className="w-full h-12 rounded-full text-white font-medium"
            style={{ background: '#6B9080' }}
          >
            Stay logged in
          </Button>
          <Button
            onClick={onLogout}
            variant="outline"
            className="w-full h-12 rounded-full font-medium flex items-center justify-center gap-2"
            style={{ border: '1px solid #E8E6E1', color: '#7A8B85' }}
          >
            <LogOut className="w-4 h-4" strokeWidth={1.5} />
            Log out now
          </Button>
        </div>
      </div>
    </div>
  );
}
