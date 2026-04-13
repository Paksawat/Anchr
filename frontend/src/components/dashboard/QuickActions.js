import React from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, Heart, AlertTriangle } from 'lucide-react';

export default function QuickActions({ t, onLogSlip }) {
  const navigate = useNavigate();
  const actions = [
    { testId: 'quick-progress', label: t('progress'), icon: TrendingUp, bg: '#6B908444', onClick: () => navigate('/progress') },
    { testId: 'quick-motivation', label: t('motivation'), icon: Heart, bg: '#E5989B44', iconColor: '#E5989B', onClick: () => navigate('/motivation') },
    { testId: 'quick-log-slip', label: t('log_a_slip'), icon: AlertTriangle, bg: '#E2D4C844', iconColor: '#C9A87C', onClick: onLogSlip },
  ];

  return (
    <div className="md:col-span-2 rounded-2xl p-6 shadow-sm" style={{ background: '#FFFFFF', border: '1px solid #E8E6E1' }}>
      <h3 className="font-heading text-lg font-medium mb-4" style={{ color: '#2A3A35' }}>{t('quick_actions')}</h3>
      <div className="grid grid-cols-3 gap-3">
        {actions.map((a) => (
          <button
            key={a.testId}
            data-testid={a.testId}
            onClick={a.onClick}
            className="flex flex-col items-center gap-2 p-4 rounded-xl transition-all duration-200 hover:-translate-y-px"
            style={{ background: '#F0EFEB' }}
          >
            <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: a.bg }}>
              <a.icon className="w-5 h-5" style={{ color: a.iconColor || '#6B9080' }} strokeWidth={1.5} />
            </div>
            <span className="text-xs font-medium text-center" style={{ color: '#2A3A35' }}>{a.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
