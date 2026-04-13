import React from 'react';

export default function WeeklyChart({ t, weekly }) {
  if (!weekly) return null;

  const maxUrges = Math.max(...weekly.map((d) => d.urges), 1);

  return (
    <div className="rounded-2xl p-6 shadow-sm" style={{ background: '#FFFFFF', border: '1px solid #E8E6E1' }}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-heading text-lg font-medium" style={{ color: '#2A3A35' }}>{t('this_week')}</h3>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 text-xs" style={{ color: '#7A8B85' }}>
            <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: '#6B9080' }} />
            {t('all_resisted')}
          </span>
          <span className="flex items-center gap-1.5 text-xs" style={{ color: '#7A8B85' }}>
            <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: '#A4C3B2' }} />
            {t('partial_resisted')}
          </span>
          <span className="flex items-center gap-1.5 text-xs" style={{ color: '#7A8B85' }}>
            <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: '#E8E6E1' }} />
            {t('no_urges')}
          </span>
        </div>
      </div>
      <div className="flex items-end gap-2 h-36">
        {weekly.map((day) => {
          const height = day.urges > 0 ? Math.max((day.urges / maxUrges) * 100, 12) : 4;
          const allResisted = day.resisted === day.urges && day.urges > 0;
          const barColor = allResisted ? '#6B9080' : day.urges > 0 ? '#A4C3B2' : '#E8E6E1';
          return (
            <div key={day.date} className="flex-1 flex flex-col items-center gap-1">
              {day.urges > 0 && (
                <span className="text-xs font-medium" style={{ color: '#7A8B85' }}>{day.urges}</span>
              )}
              <div className="w-full flex flex-col justify-end" style={{ height: '100px' }}>
                <div
                  title={`${day.urges} urge${day.urges !== 1 ? 's' : ''}, ${day.resisted} resisted`}
                  className="w-full rounded-t-lg transition-all duration-300"
                  style={{ height: `${height}%`, background: barColor }}
                />
              </div>
              <span className="text-xs" style={{ color: '#A3B1AA' }}>{day.label}</span>
            </div>
          );
        })}
      </div>
      <p className="text-xs mt-3" style={{ color: '#A3B1AA' }}>{t('chart_numbers_hint')}</p>
    </div>
  );
}
