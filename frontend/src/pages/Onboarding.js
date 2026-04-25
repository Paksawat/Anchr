import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import axios from 'axios';
import { ChevronRight, AlertCircle, Flame, TrendingUp, Heart } from 'lucide-react';
import { Button } from '../components/ui/button';

const API = `${import.meta.env.VITE_API_URL}/api`;

const STEPS = ['welcome', 'how', 'disclaimer', 'urge'];

function StepDots({ current }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {STEPS.map((s, i) => (
        <div
          key={s}
          className="rounded-full transition-all duration-300"
          style={{
            width: STEPS[current] === s ? 20 : 6,
            height: 6,
            background: STEPS[current] === s ? '#6B9080' : '#E8E6E1',
          }}
        />
      ))}
    </div>
  );
}

export default function Onboarding() {
  const { user, setUser } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [stepIndex, setStepIndex] = useState(0);
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

  const next = () => setStepIndex((i) => Math.min(i + 1, STEPS.length - 1));

  const acceptDisclaimer = async () => {
    try {
      const res = await axios.put(
        `${API}/profile`,
        { disclaimer_accepted: true },
        { withCredentials: true },
      );
      setUser((prev) => ({ ...prev, ...res.data }));
    } catch (error) {
      console.error('Failed to save disclaimer acceptance:', error);
    }
    next();
  };

  const handleFinish = async () => {
    if (!selected) {
      navigate('/dashboard');
      return;
    }
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

  const currentStep = STEPS[stepIndex];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8" style={{ background: '#F9F8F6' }}>
      <div className="w-full max-w-md" data-testid="onboarding-page">

        {/* Logo always visible */}
        <div className="text-center mb-6">
          <img src="/anchr-circle-small.svg" alt="Anchr" className="w-14 h-14 mx-auto" />
        </div>

        <StepDots current={stepIndex} />

        {/* ── Step 1: Welcome ── */}
        {currentStep === 'welcome' && (
          <div className="space-y-6">
            <div className="text-center">
              <h1 className="font-heading text-4xl font-light tracking-tight mb-3" style={{ color: '#2A3A35' }}>
                {t('welcome_to_anchr')}
              </h1>
              <p className="text-base leading-relaxed" style={{ color: '#7A8B85', fontFamily: 'Figtree, sans-serif' }}>
                {t('onboarding_welcome_subtitle')}
              </p>
            </div>

            <div className="rounded-2xl p-6 space-y-4" style={{ background: '#FFFFFF', border: '1px solid #E8E6E1' }}>
              <p className="text-sm leading-relaxed" style={{ color: '#7A8B85' }}>
                {t('onboarding_welcome_desc')}
              </p>
              <div className="space-y-3 pt-2">
                {[
                  { icon: '🌊', key: 'onboarding_point_1' },
                  { icon: '📈', key: 'onboarding_point_2' },
                  { icon: '💬', key: 'onboarding_point_3' },
                ].map(({ icon, key }) => (
                  <div key={key} className="flex items-start gap-3">
                    <span className="text-lg leading-none mt-0.5">{icon}</span>
                    <p className="text-sm leading-relaxed" style={{ color: '#2A3A35' }}>{t(key)}</p>
                  </div>
                ))}
              </div>
            </div>

            <Button
              onClick={next}
              className="w-full h-12 rounded-full text-white font-medium"
              style={{ background: '#6B9080' }}
            >
              {t('onboarding_get_started')}
              <ChevronRight className="w-4 h-4 ml-1" strokeWidth={1.5} />
            </Button>
          </div>
        )}

        {/* ── Step 2: How it works ── */}
        {currentStep === 'how' && (
          <div className="space-y-6">
            <div className="text-center">
              <h1 className="font-heading text-3xl font-light tracking-tight mb-2" style={{ color: '#2A3A35' }}>
                {t('onboarding_how_title')}
              </h1>
            </div>

            <div className="space-y-3">
              {[
                {
                  icon: Flame,
                  color: '#E5989B',
                  bg: '#E5989B18',
                  title: 'onboarding_feature_1_title',
                  desc: 'onboarding_feature_1_desc',
                },
                {
                  icon: TrendingUp,
                  color: '#6B9080',
                  bg: '#6B908018',
                  title: 'onboarding_feature_2_title',
                  desc: 'onboarding_feature_2_desc',
                },
                {
                  icon: Heart,
                  color: '#A4C3B2',
                  bg: '#A4C3B218',
                  title: 'onboarding_feature_3_title',
                  desc: 'onboarding_feature_3_desc',
                },
              ].map(({ icon: Icon, color, bg, title, desc }) => (
                <div
                  key={title}
                  className="flex items-start gap-4 p-4 rounded-2xl"
                  style={{ background: '#FFFFFF', border: '1px solid #E8E6E1' }}
                >
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: bg }}>
                    <Icon className="w-5 h-5" style={{ color }} strokeWidth={1.5} />
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-1" style={{ color: '#2A3A35' }}>{t(title)}</p>
                    <p className="text-xs leading-relaxed" style={{ color: '#7A8B85' }}>{t(desc)}</p>
                  </div>
                </div>
              ))}
            </div>

            <Button
              onClick={next}
              className="w-full h-12 rounded-full text-white font-medium"
              style={{ background: '#6B9080' }}
            >
              {t('continue')}
              <ChevronRight className="w-4 h-4 ml-1" strokeWidth={1.5} />
            </Button>
          </div>
        )}

        {/* ── Step 3: Disclaimer ── */}
        {currentStep === 'disclaimer' && (
          <div className="space-y-5">
            <div className="text-center">
              <h1 className="font-heading text-3xl font-light tracking-tight mb-2" style={{ color: '#2A3A35' }}>
                {t('disclaimer_title')}
              </h1>
            </div>

            <div className="rounded-2xl p-5" style={{ background: '#FDF2F2', border: '1px solid #E5989B33' }}>
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" style={{ color: '#E5989B' }} strokeWidth={1.5} />
                <p className="text-sm leading-relaxed" style={{ color: '#7A8B85' }}>
                  {t('disclaimer_text')}
                </p>
              </div>
            </div>

            <div className="rounded-2xl p-5 space-y-3" style={{ background: '#FFFFFF', border: '1px solid #E8E6E1' }}>
              <p className="text-xs font-medium uppercase tracking-wider" style={{ color: '#A3B1AA' }}>
                {t('onboarding_resources_title')}
              </p>
              {[
                'onboarding_resource_1',
                'onboarding_resource_2',
                'onboarding_resource_3',
              ].map((key) => (
                <div key={key} className="flex items-start gap-2">
                  <span className="text-xs mt-0.5" style={{ color: '#6B9080' }}>•</span>
                  <p className="text-sm" style={{ color: '#7A8B85' }}>{t(key)}</p>
                </div>
              ))}
            </div>

            <label className="flex items-start gap-3 cursor-pointer p-4 rounded-xl" style={{ background: '#F9F8F6', border: '1px solid #E8E6E1' }}>
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
              onClick={acceptDisclaimer}
              disabled={!disclaimerAccepted}
              className="w-full h-12 rounded-full text-white font-medium"
              style={{ background: disclaimerAccepted ? '#6B9080' : '#A3B1AA' }}
            >
              {t('accept_and_continue')}
              <ChevronRight className="w-4 h-4 ml-1" strokeWidth={1.5} />
            </Button>
          </div>
        )}

        {/* ── Step 4: What are you working on ── */}
        {currentStep === 'urge' && (
          <div className="space-y-5">
            <div className="text-center">
              <h1 className="font-heading text-3xl font-light tracking-tight mb-2" style={{ color: '#2A3A35' }}>
                {t('onboarding_urge_title')}
              </h1>
              <p className="text-sm" style={{ color: '#7A8B85', fontFamily: 'Figtree, sans-serif' }}>
                {t('onboarding_urge_subtitle')}
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
                    border: selected === type.id ? '2px solid #6B9080' : '1px solid #E8E6E1',
                  }}
                >
                  <p className="text-sm font-medium" style={{ color: '#2A3A35' }}>
                    {t('urge_' + type.id) || type.label}
                  </p>
                </button>
              ))}
            </div>

            {selected === 'other' && (
              <input
                data-testid="custom-urge-input"
                type="text"
                value={customType}
                onChange={(e) => setCustomType(e.target.value)}
                placeholder={t('custom_urge_placeholder')}
                className="w-full p-4 rounded-xl text-sm"
                style={{ border: '1px solid #E8E6E1', background: '#FFFFFF', color: '#2A3A35', outline: 'none' }}
              />
            )}

            <div className="flex gap-3">
              <Button
                data-testid="onboarding-continue"
                onClick={handleFinish}
                disabled={!selected || saving}
                className="flex-1 h-12 rounded-full text-white font-medium"
                style={{ background: selected ? '#6B9080' : '#A3B1AA' }}
              >
                {saving ? t('saving') : t('go_to_dashboard')}
                <ChevronRight className="w-4 h-4 ml-1" strokeWidth={1.5} />
              </Button>
              <button
                data-testid="onboarding-skip"
                onClick={() => navigate('/dashboard')}
                className="px-6 h-12 rounded-full text-sm font-medium"
                style={{ color: '#7A8B85' }}
              >
                {t('skip')}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
