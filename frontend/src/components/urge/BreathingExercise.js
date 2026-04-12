import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

export default function BreathingExercise() {
  const [breathPhase, setBreathPhase] = useState('inhale');

  useEffect(() => {
    const cycle = () => {
      setBreathPhase('inhale');
      const holdTimer = setTimeout(() => setBreathPhase('hold'), 4000);
      const exhaleTimer = setTimeout(() => setBreathPhase('exhale'), 8000);
      return [holdTimer, exhaleTimer];
    };
    const timers = cycle();
    const interval = setInterval(() => {
      cycle();
    }, 14000);
    return () => {
      clearInterval(interval);
      timers.forEach(clearTimeout);
    };
  }, []);

  return (
    <div className="rounded-2xl p-8 text-center" style={{ background: '#FFFFFF', border: '1px solid #E8E6E1' }}>
      <motion.div
        data-testid="breathing-circle"
        className="w-32 h-32 rounded-full mx-auto mb-6"
        style={{ background: '#A8DADC' }}
        animate={{
          scale: breathPhase === 'inhale' ? 1.5 : breathPhase === 'hold' ? 1.5 : 1,
          opacity: breathPhase === 'exhale' ? 0.6 : 1,
        }}
        transition={{ duration: breathPhase === 'exhale' ? 6 : 4, ease: 'easeInOut' }}
      />
      <p className="text-xl font-heading font-medium capitalize" style={{ color: '#2A3A35' }}>
        {breathPhase}
      </p>
      <p className="text-sm mt-1" style={{ color: '#A3B1AA' }}>
        {breathPhase === 'inhale' ? 'Breathe in slowly... 4 seconds' :
         breathPhase === 'hold' ? 'Hold gently... 4 seconds' :
         'Release slowly... 6 seconds'}
      </p>
    </div>
  );
}
