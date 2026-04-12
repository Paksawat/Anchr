import React from 'react';
import { Footprints, Droplets, Phone, Wind } from 'lucide-react';

const COPING_SUGGESTIONS = [
  { icon: Footprints, label: 'Go for a walk', desc: 'Move your body, change your scenery' },
  { icon: Droplets, label: 'Drink water', desc: 'Hydrate and reset' },
  { icon: Phone, label: 'Call someone', desc: 'Reach out to a trusted person' },
  { icon: Wind, label: 'Step outside', desc: 'Fresh air can shift your state' },
];

export default function CopingTools() {
  return (
    <div className="rounded-2xl p-6 space-y-3" style={{ background: '#FFFFFF', border: '1px solid #E8E6E1' }}>
      <h3 className="text-sm font-medium uppercase tracking-wider mb-2" style={{ color: '#A3B1AA' }}>
        Do this instead
      </h3>
      {COPING_SUGGESTIONS.map((item) => (
        <div
          key={item.label}
          className="flex items-center gap-4 p-4 rounded-xl transition-all duration-200 hover:-translate-y-px cursor-pointer"
          style={{ background: '#F9F8F6' }}
        >
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
