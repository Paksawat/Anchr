import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { Footprints, Droplets, Phone, Wind } from 'lucide-react';

export default function CopingTools() {
  const { t } = useLanguage();

  const suggestions = [
    { icon: Footprints, label: t('go_for_walk'), desc: t('walk_desc') },
    { icon: Droplets, label: t('drink_water'), desc: t('water_desc') },
    { icon: Phone, label: t('call_someone'), desc: t('call_desc') },
    { icon: Wind, label: t('step_outside'), desc: t('outside_desc') },
  ];

  return (
    <div className="rounded-2xl p-6 space-y-3" style={{ background: '#FFFFFF', border: '1px solid #E8E6E1' }}>
      <h3 className="text-sm font-medium uppercase tracking-wider mb-2" style={{ color: '#A3B1AA' }}>{t('do_this_instead')}</h3>
      {suggestions.map((item) => (
        <div key={item.label} className="flex items-center gap-4 p-4 rounded-xl transition-all duration-200 hover:-translate-y-px cursor-pointer" style={{ background: '#F9F8F6' }}>
          <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: '#A4C3B244' }}>
            <item.icon className="w-5 h-5" style={{ color: '#6B9080' }} strokeWidth={1.5} />
          </div>
          <div>
            <p className="text-sm font-medium" style={{ color: '#2A3A35' }}>{item.label}</p>
            <p className="text-xs" style={{ color: '#A3B1AA' }}>{item.desc}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
