import React from 'react';
import { Target, Clock, ArrowUp, ArrowDown } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, Cell, XAxis, YAxis, Tooltip, LabelList } from 'recharts';

const formatHour = (h) => {
  if (h === 0) return '12am';
  if (h < 12) return `${h}am`;
  if (h === 12) return '12pm';
  return `${h - 12}pm`;
};

export function TriggerInsights({ t, triggerStats }) {
  return (
    <div className="rounded-2xl p-6 shadow-sm" style={{ background: '#FFFFFF', border: '1px solid #E8E6E1' }}>
      <h3 className="font-heading text-lg font-medium mb-4" style={{ color: '#2A3A35' }}>{t('top_triggers')}</h3>
      {triggerStats?.top_trigger && (
        <div className="mb-4 p-3 rounded-xl" style={{ background: '#A4C3B222' }}>
          <p className="text-sm font-medium" style={{ color: '#6B9080' }}>
            <Target className="w-4 h-4 inline mr-1" strokeWidth={1.5} />{triggerStats.top_trigger} {t('is_top_trigger')}
          </p>
        </div>
      )}
      <div className="space-y-3">
        {triggerStats?.triggers?.slice(0, 5).map((tr) => {
          const maxCount = triggerStats.triggers[0]?.count || 1;
          return (
            <div key={tr.name} className="flex items-center gap-3">
              <span className="text-sm w-24 truncate" style={{ color: '#7A8B85' }}>{tr.name}</span>
              <div className="flex-1 h-3 rounded-full overflow-hidden" style={{ background: '#F0EFEB' }}>
                <div className="h-full rounded-full transition-all duration-500" style={{ width: `${(tr.count / maxCount) * 100}%`, background: '#6B9080' }} />
              </div>
              <span className="text-xs w-6 text-right" style={{ color: '#A3B1AA' }}>{tr.count}</span>
            </div>
          );
        })}
        {(!triggerStats?.triggers || triggerStats.triggers.length === 0) && (
          <p className="text-sm" style={{ color: '#A3B1AA' }}>{t('no_trigger_data')}</p>
        )}
      </div>
    </div>
  );
}

export function PeakTimes({ t, triggerStats }) {
  return (
    <div className="rounded-2xl p-6 shadow-sm" style={{ background: '#FFFFFF', border: '1px solid #E8E6E1' }}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-heading text-lg font-medium" style={{ color: '#2A3A35' }}>{t('peak_times')}</h3>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-xs" style={{ color: '#7A8B85' }}>
            <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: '#E5989B' }} />
            {t('peak_hour_label')}
          </span>
          <span className="flex items-center gap-1.5 text-xs" style={{ color: '#7A8B85' }}>
            <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: '#A4C3B2' }} />
            {t('other_hours_label')}
          </span>
        </div>
      </div>
      {triggerStats?.peak_hour != null && (
        <div className="mb-4 p-3 rounded-xl" style={{ background: '#E2D4C844' }}>
          <p className="text-sm font-medium" style={{ color: '#7A8B85' }}>
            <Clock className="w-4 h-4 inline mr-1" strokeWidth={1.5} />{t('most_urges_at')} {formatHour(triggerStats.peak_hour)}
          </p>
        </div>
      )}
      {triggerStats?.hours && triggerStats.hours.length > 0 ? (
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={triggerStats.hours} margin={{ top: 16, right: 4, left: -20, bottom: 0 }}>
            <XAxis
              dataKey="hour"
              tick={{ fontSize: 10, fill: '#A3B1AA' }}
              tickFormatter={formatHour}
              axisLine={false}
              tickLine={false}
              interval={2}
            />
            <YAxis
              tick={{ fontSize: 10, fill: '#A3B1AA' }}
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
            />
            <Tooltip
              content={({ active, payload }) =>
                active && payload?.length ? (
                  <div className="rounded-lg p-2 shadow" style={{ background: '#FFF', border: '1px solid #E8E6E1' }}>
                    <p className="text-xs font-medium" style={{ color: '#2A3A35' }}>{formatHour(payload[0]?.payload?.hour)}</p>
                    <p className="text-xs" style={{ color: '#7A8B85' }}>{payload[0]?.value} {payload[0]?.value === 1 ? 'urge' : 'urges'}</p>
                  </div>
                ) : null
              }
            />
            <Bar dataKey="count" radius={[4, 4, 0, 0]}>
              <LabelList
                dataKey="count"
                position="top"
                style={{ fontSize: 9, fill: '#A3B1AA' }}
                formatter={(v) => (v > 0 ? v : '')}
              />
              {triggerStats.hours.map((entry) => (
                <Cell
                  key={`hour-${entry.hour}`}
                  fill={entry.hour === triggerStats.peak_hour ? '#E5989B' : '#A4C3B2'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <p className="text-sm" style={{ color: '#A3B1AA' }}>{t('no_time_data')}</p>
      )}
    </div>
  );
}

export function RecentUrges({ t, urges }) {
  return (
    <div className="rounded-2xl p-6 shadow-sm" style={{ background: '#FFFFFF', border: '1px solid #E8E6E1' }}>
      <h3 className="font-heading text-lg font-medium mb-4" style={{ color: '#2A3A35' }}>{t('recent_urges')}</h3>
      {urges.length > 0 ? (
        <div className="space-y-3">
          {urges.slice(0, 10).map((u) => {
            const urgeTypeLabel = u.urge_type
              ? u.urge_type === 'other' && u.custom_urge_type
                ? u.custom_urge_type
                : t('urge_' + u.urge_type) || u.urge_type
              : null;
            return (
              <div key={u.urge_id} className="flex items-center justify-between p-3 rounded-xl" style={{ background: '#F9F8F6' }}>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{
                    background: u.outcome === 'resisted' ? '#6B908033' : u.outcome === 'relapsed' ? '#E5989B33' : '#E2D4C844'
                  }}>
                    {u.outcome === 'resisted' ? <ArrowUp className="w-4 h-4" style={{ color: '#6B9080' }} strokeWidth={1.5} /> :
                     u.outcome === 'relapsed' ? <ArrowDown className="w-4 h-4" style={{ color: '#E5989B' }} strokeWidth={1.5} /> :
                     <Clock className="w-4 h-4" style={{ color: '#7A8B85' }} strokeWidth={1.5} />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium" style={{ color: '#2A3A35' }}>
                        {u.trigger ? (t(u.trigger) !== u.trigger ? t(u.trigger) : u.trigger) : t('no_trigger')}
                        {' · '}
                        {u.emotion ? (t(u.emotion) !== u.emotion ? t(u.emotion) : u.emotion) : t('no_emotion')}
                      </p>
                      {urgeTypeLabel && (
                        <span
                          className="text-xs px-2 py-0.5 rounded-full"
                          style={{ background: '#6B908015', color: '#6B9080' }}
                        >
                          {urgeTypeLabel}
                        </span>
                      )}
                    </div>
                    <p className="text-xs mt-0.5" style={{ color: '#A3B1AA' }}>
                      {new Date(u.created_at).toLocaleDateString()} at {new Date(u.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
                <span className="text-xs px-3 py-1 rounded-full font-medium shrink-0" style={{
                  background: u.outcome === 'resisted' ? '#6B908022' : u.outcome === 'relapsed' ? '#E5989B22' : '#E2D4C844',
                  color: u.outcome === 'resisted' ? '#6B9080' : u.outcome === 'relapsed' ? '#E5989B' : '#7A8B85'
                }}>
                  {u.outcome === 'resisted' ? t('resisted') : u.outcome === 'relapsed' ? t('i_slipped') : t('in_progress_label')}
                </span>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-sm text-center py-8" style={{ color: '#A3B1AA' }}>{t('no_urges_yet')}</p>
      )}
    </div>
  );
}
