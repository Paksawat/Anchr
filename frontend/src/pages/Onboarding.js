import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import axios from 'axios';
import { Anchor, ChevronRight, AlertCircle } from 'lucide-react';
import { Button } from '../components/ui/button';

const API = `${process.env.REACT_APP_API_URL}/api`;

const URGE_ICONS = {
  smoking: 'Cigarette',
  drinking: 'Wine',
  gambling: 'Dice',
  drugs: 'Pill',
  overeating: 'Utensils',
  social_media: 'Smartphone',
  shopping: 'ShoppingBag',
  pornography: 'EyeOff',
  gaming: 'Gamepad2',
  other: 'PlusCircle',
};

export default function Onboarding() {
  const { user, setUser } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [step, setStep] = useState('disclaimer'); // 'disclaimer' | 'urge'
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(false);
  const [urgeTypes, setUrgeTypes] = useState([]);
  const [selected, setSelected] = useState(null);
  const [customType, setCustomType] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    axios
      .get(`${API}/urge-types`, { withCredentials: true })
      .then((res) => setUrgeTypes(res.data))
      .catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleContinue = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      const res = await axios.put(
        `${API}/profile`,
        {
          urge_type: selected,
          custom_urge_type: selected === 'other' ? customType : null,
        },
        { withCredentials: true },
      );
      setUser((prev) => ({ ...prev, ...res.data }));
      navigate('/dashboard');
    } catch (error) {
      console.error('Failed to save profile:', error);
    } finally {
      setSaving(false);
    }
  };

  if (step === 'disclaimer') {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: '#F9F8F6' }}>
        <div className="w-full max-w-md" data-testid="onboarding-page">
          <div className="text-center mb-8">
            <img src="/anchr-circle-small.svg" alt="Anchr" className="w-16 h-16 mx-auto mb-5" />
            <h1 className="font-heading text-3xl font-light tracking-tight" style={{ color: '#2A3A35' }}>
              {t('welcome_to_anchr')}
            </h1>
          </div>

          <div className="rounded-2xl p-6 shadow-sm mb-6" style={{ background: '#FFFFFF', border: '1px solid #E8E6E1' }}>
            <div className="flex items-center gap-2 mb-4">
              <AlertCircle className="w-5 h-5 shrink-0" style={{ color: '#E5989B' }} strokeWidth={1.5} />
              <h2 className="font-medium text-base" style={{ color: '#2A3A35' }}>{t('disclaimer_title')}</h2>
            </div>
            <p className="text-sm leading-relaxed" style={{ color: '#7A8B85' }}>
              {t('disclaimer_text')}
            </p>
          </div>

          <label className="flex items-start gap-3 cursor-pointer mb-6 p-4 rounded-xl" style={{ background: '#F9F8F6', border: '1px solid #E8E6E1' }}>
            <input
              type="checkbox"
              checked={disclaimerAccepted}
              onChange={(e) => setDisclaimerAccepted(e.target.checked)}
              className="mt-0.5 shrink-0 w-4 h-4"
              style={{ accentColor: '#6B9080' }}
            />
            <span className="text-sm leading-relaxed" style={{ color: '#7A8B85' }}>
              {t('disclaimer_accept')}
            </span>
          </label>

          <Button
            onClick={() => setStep('urge')}
            disabled={!disclaimerAccepted}
            className="w-full h-12 rounded-full text-white font-medium"
            style={{ background: disclaimerAccepted ? '#6B9080' : '#A3B1AA' }}
          >
            {t('continue')}
            <ChevronRight className="w-4 h-4 ml-1" strokeWidth={1.5} />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: '#F9F8F6' }}
    >
      <div className="w-full max-w-lg" data-testid="onboarding-page">
        <div className="text-center mb-10">
          <div
            className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-5"
            style={{ background: '#A4C3B2' }}
          >
            <Anchor
              className="w-8 h-8"
              style={{ color: '#2A3A35' }}
              strokeWidth={1.5}
            />
          </div>
          <h1
            className="font-heading text-3xl sm:text-4xl font-light tracking-tight"
            style={{ color: '#2A3A35' }}
          >
            What are you working on?
          </h1>
          <p
            className="mt-3 text-base"
            style={{ color: '#7A8B85', fontFamily: 'Figtree, sans-serif' }}
          >
            This helps us personalize your experience. You can change this
            later.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {urgeTypes.map((type) => (
            <button
              key={type.id}
              data-testid={`urge-type-${type.id}`}
              onClick={() => setSelected(type.id)}
              className="p-5 rounded-2xl text-left transition-all duration-200 hover:-translate-y-0.5"
              style={{
                background: selected === type.id ? '#6B908015' : '#FFFFFF',
                border:
                  selected === type.id
                    ? '2px solid #6B9080'
                    : '1px solid #E8E6E1',
              }}
            >
              <p className="text-sm font-medium" style={{ color: '#2A3A35' }}>
                {type.label}
              </p>
            </button>
          ))}
        </div>

        {selected === 'other' && (
          <div className="mt-4">
            <input
              data-testid="custom-urge-input"
              type="text"
              value={customType}
              onChange={(e) => setCustomType(e.target.value)}
              placeholder="Describe your challenge..."
              className="w-full p-4 rounded-xl text-sm"
              style={{
                border: '1px solid #E8E6E1',
                background: '#FFFFFF',
                color: '#2A3A35',
              }}
            />
          </div>
        )}

        <div className="mt-8 flex gap-3">
          <Button
            data-testid="onboarding-continue"
            onClick={handleContinue}
            disabled={!selected || saving}
            className="flex-1 h-12 rounded-full text-white font-medium"
            style={{ background: selected ? '#6B9080' : '#A3B1AA' }}
          >
            {saving ? 'Saving...' : 'Continue'}
            <ChevronRight className="w-4 h-4 ml-1" strokeWidth={1.5} />
          </Button>
          <button
            data-testid="onboarding-skip"
            onClick={() => navigate('/dashboard')}
            className="px-6 h-12 rounded-full text-sm font-medium"
            style={{ color: '#7A8B85' }}
          >
            Skip
          </button>
        </div>
      </div>
    </div>
  );
}
