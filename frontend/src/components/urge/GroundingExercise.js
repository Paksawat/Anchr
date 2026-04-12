import React, { useState } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';

export default function GroundingExercise() {
  const { t } = useLanguage();
  const [groundingStep, setGroundingStep] = useState(0);

  const GROUNDING_STEPS = [
    { count: 5, sense: t('see'), instruction: t('see_instruction') },
    { count: 4, sense: t('touch'), instruction: t('touch_instruction') },
    { count: 3, sense: t('hear'), instruction: t('hear_instruction') },
    { count: 2, sense: t('smell'), instruction: t('smell_instruction') },
    { count: 1, sense: t('taste'), instruction: t('taste_instruction') },
  ];

  return (
    <div className="rounded-2xl p-6" style={{ background: '#FFFFFF', border: '1px solid #E8E6E1' }}>
      <h3 className="text-sm font-medium uppercase tracking-wider mb-2" style={{ color: '#A3B1AA' }}>{t('grounding_title')}</h3>
      <div className="space-y-3">
        {GROUNDING_STEPS.map((step, idx) => (
          <button
            key={step.sense}
            data-testid={`grounding-step-${idx}`}
            onClick={() => setGroundingStep(idx)}
            className="w-full text-left p-4 rounded-xl transition-all duration-200"
            style={{
              background: groundingStep === idx ? '#A4C3B222' : '#F9F8F6',
              border: groundingStep === idx ? '1px solid #A4C3B2' : '1px solid transparent'
            }}
          >
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium"
                style={{ background: groundingStep >= idx ? '#6B9080' : '#E8E6E1', color: groundingStep >= idx ? '#FFF' : '#A3B1AA' }}>
                {step.count}
              </span>
              <div>
                <p className="text-sm font-medium" style={{ color: '#2A3A35' }}>{step.sense}</p>
                <p className="text-xs" style={{ color: '#7A8B85' }}>{step.instruction}</p>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
