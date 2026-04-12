import React from 'react';
import { Shield, Zap, TrendingUp, Sparkles } from 'lucide-react';

export default function StatsGrid({ t, stats, loading }) {
  const items = [
    { icon: Shield, label: t('current_streak'), value: stats?.streak_days || 0, sub: t('days_strong'), testId: 'streak-count' },
    { icon: Zap, label: t('urges_resisted'), value: stats?.urges_resisted || 0, sub: t('total'), testId: 'urges-resisted' },
    { icon: TrendingUp, label: t('resist_rate'), value: `${stats?.resist_rate || 0}%`, sub: t('success'), testId: 'resist-rate' },
    { icon: Sparkles, label: t('best_streak'), value: stats?.best_streak || 0, sub: t('days'), testId: 'best-streak' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {items.map((item) => (
        <div key={item.testId} className="rounded-2xl p-6 shadow-sm" style={{ background: '#FFFFFF', border: '1px solid #E8E6E1' }}>
          <div className="flex items-center gap-2 mb-3">
            <item.icon className="w-5 h-5" style={{ color: '#6B9080' }} strokeWidth={1.5} />
            <span className="text-sm" style={{ color: '#A3B1AA', fontFamily: 'Figtree, sans-serif' }}>{item.label}</span>
          </div>
          <p data-testid={item.testId} className="text-3xl font-light font-heading" style={{ color: '#2A3A35' }}>
            {loading ? '-' : item.value}
          </p>
          <p className="text-xs mt-1" style={{ color: '#A3B1AA' }}>{item.sub}</p>
        </div>
      ))}
    </div>
  );
}
