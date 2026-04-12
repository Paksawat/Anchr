import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { Lock, Sparkles } from 'lucide-react';
import { Button } from '../components/ui/button';
import { useAuth } from '../contexts/AuthContext';

export default function UpgradePrompt({ feature, children }) {
  const { user } = useAuth();
  const isPaid = user?.tier === 'paid';

  if (isPaid) return children;

  return (
    <div className="relative">
      <div className="pointer-events-none opacity-30 blur-[2px] select-none">
        {children}
      </div>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center p-8 rounded-2xl max-w-sm" style={{ background: '#FFFFFF', border: '1px solid #E8E6E1', boxShadow: '0 8px 32px rgba(42,58,53,0.12)' }}>
          <div className="w-14 h-14 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ background: '#6B908022' }}>
            <Lock className="w-6 h-6" style={{ color: '#6B9080' }} strokeWidth={1.5} />
          </div>
          <h3 className="font-heading text-lg font-medium mb-2" style={{ color: '#2A3A35' }}>
            {feature || 'Premium Feature'}
          </h3>
          <p className="text-sm mb-5" style={{ color: '#7A8B85' }}>
            Unlock deep insights, guided programs, habit system, and more with Anchr Pro.
          </p>
          <Button
            data-testid="upgrade-btn"
            onClick={() => {
              // Visual-only upgrade for now
              // In future: redirect to Stripe checkout
              alert('Coming soon! Anchr Pro will be available shortly.');
            }}
            className="rounded-full text-white font-medium px-8"
            style={{ background: '#6B9080' }}
          >
            <Sparkles className="w-4 h-4 mr-2" strokeWidth={1.5} />
            Upgrade to Pro
          </Button>
        </div>
      </div>
    </div>
  );
}
