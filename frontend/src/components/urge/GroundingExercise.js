import React, { useState } from 'react';

const GROUNDING_STEPS = [
  { count: 5, sense: 'SEE', instruction: 'Name 5 things you can see right now' },
  { count: 4, sense: 'TOUCH', instruction: 'Name 4 things you can touch' },
  { count: 3, sense: 'HEAR', instruction: 'Name 3 things you can hear' },
  { count: 2, sense: 'SMELL', instruction: 'Name 2 things you can smell' },
  { count: 1, sense: 'TASTE', instruction: 'Name 1 thing you can taste' },
];

export default function GroundingExercise() {
  const [groundingStep, setGroundingStep] = useState(0);

  return (
    <div className="rounded-2xl p-6" style={{ background: '#FFFFFF', border: '1px solid #E8E6E1' }}>
      <h3 className="text-sm font-medium uppercase tracking-wider mb-2" style={{ color: '#A3B1AA' }}>
        5-4-3-2-1 Grounding
      </h3>
      <div className="space-y-3">
        {GROUNDING_STEPS.map((step) => (
          <button
            key={step.sense}
            data-testid={`grounding-step-${step.sense.toLowerCase()}`}
            onClick={() => setGroundingStep(GROUNDING_STEPS.indexOf(step))}
            className="w-full text-left p-4 rounded-xl transition-all duration-200"
            style={{
              background: groundingStep === GROUNDING_STEPS.indexOf(step) ? '#A4C3B222' : '#F9F8F6',
              border: groundingStep === GROUNDING_STEPS.indexOf(step) ? '1px solid #A4C3B2' : '1px solid transparent'
            }}
          >
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium"
                style={{
                  background: groundingStep >= GROUNDING_STEPS.indexOf(step) ? '#6B9080' : '#E8E6E1',
                  color: groundingStep >= GROUNDING_STEPS.indexOf(step) ? '#FFF' : '#A3B1AA'
                }}
              >
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
