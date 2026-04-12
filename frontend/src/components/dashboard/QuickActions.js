import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, Shield, TrendingUp, Heart } from 'lucide-react';

export default function QuickActions({ t }) {
  const navigate = useNavigate();
  const actions = [
    { testId: 'quick-breathing', to: '/urge-timer', state: { tab: 'breathing' }, icon: Clock, label: t('breathing'), bg: '#A8DADC44' },
    { testId: 'quick-grounding', to: '/urge-timer', state: { tab: 'grounding' }, icon: Shield, label: t('grounding'), bg: '#A4C3B244' },
    { testId: 'quick-progress', to: '/progress', state: null, icon: TrendingUp, label: t('progress'), bg: '#6B908044' },
    { testId: 'quick-motivation', to: '/motivation', state: null, icon: Heart, label: t('motivation'), bg: '#E5989B44', iconColor: '#E5989B' },
  ];

  return (
    <div className="md:col-span-2 rounded-2xl p-6 shadow-sm" style={{ background: '#FFFFFF', border: '1px solid #E8E6E1' }}>
      <h3 className="font-heading text-lg font-medium mb-4" style={{ color: '#2A3A35' }}>{t('quick_actions')}</h3>
      <div className="grid grid-cols-2 gap-3">
        {actions.map((a) => (
          <button
            key={a.testId}
            data-testid={a.testId}
            onClick={() => navigate(a.to, a.state ? { state: a.state } : undefined)}
            className="flex items-center gap-3 p-4 rounded-xl transition-all duration-200 hover:-translate-y-px"
            style={{ background: '#F0EFEB' }}
          >
            <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: a.bg }}>
              <a.icon className="w-5 h-5" style={{ color: a.iconColor || '#6B9080' }} strokeWidth={1.5} />
            </div>
            <span className="text-sm font-medium" style={{ color: '#2A3A35' }}>{a.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
