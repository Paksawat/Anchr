import React from 'react';

export default function WeeklyChart({ t, weekly }) {
  if (!weekly) return null;

  return (
    <div className="rounded-2xl p-6 shadow-sm" style={{ background: '#FFFFFF', border: '1px solid #E8E6E1' }}>
      <h3 className="font-heading text-lg font-medium mb-4" style={{ color: '#2A3A35' }}>{t('this_week')}</h3>
      <div className="flex items-end gap-2 h-32">
        {weekly.map((day) => {
          const maxUrges = Math.max(...weekly.map(d => d.urges), 1);
          const height = day.urges > 0 ? Math.max((day.urges / maxUrges) * 100, 12) : 4;
          return (
            <div key={day.date} className="flex-1 flex flex-col items-center gap-2">
              <div className="w-full flex flex-col justify-end" style={{ height: '100px' }}>
                <div
                  className="w-full rounded-t-lg transition-all duration-300"
                  style={{
                    height: `${height}%`,
                    background: day.resisted === day.urges && day.urges > 0 ? '#6B9080' : day.urges > 0 ? '#A4C3B2' : '#E8E6E1',
                  }}
                />
              </div>
              <span className="text-xs" style={{ color: '#A3B1AA' }}>{day.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
