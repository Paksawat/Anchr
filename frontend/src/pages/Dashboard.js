import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import AppLayout from '../components/AppLayout';
import StatsGrid from '../components/dashboard/StatsGrid';
import QuickActions from '../components/dashboard/QuickActions';
import WeeklyChart from '../components/dashboard/WeeklyChart';
import axios from 'axios';
import {
  Flame,
  Heart,
  ArrowRight,
  AlertTriangle,
  Lightbulb,
  TrendingUp,
  Sparkles,
  Plus,
  X,
} from 'lucide-react';

const API = `${process.env.REACT_APP_API_URL}/api`;

function InsightCard({ insight }) {
  const iconMap = {
    warning: AlertTriangle,
    insight: Lightbulb,
    positive: TrendingUp,
    suggestion: Sparkles,
  };
  const colorMap = {
    warning: '#E5989B',
    insight: '#6B9080',
    positive: '#6B9080',
    suggestion: '#A8DADC',
  };
  const bgMap = {
    warning: '#E5989B15',
    insight: '#6B908015',
    positive: '#A4C3B215',
    suggestion: '#A8DADC15',
  };
  const Icon = iconMap[insight.type] || Lightbulb;

  return (
    <div
      className="p-4 rounded-xl"
      style={{
        background: bgMap[insight.type],
        border: `1px solid ${colorMap[insight.type]}33`,
      }}
    >
      <div className="flex items-start gap-3">
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
          style={{ background: `${colorMap[insight.type]}22` }}
        >
          <Icon
            className="w-4 h-4"
            style={{ color: colorMap[insight.type] }}
            strokeWidth={1.5}
          />
        </div>
        <div>
          <p className="text-sm font-medium" style={{ color: '#2A3A35' }}>
            {insight.title}
          </p>
          <p className="text-xs mt-0.5" style={{ color: '#7A8B85' }}>
            {insight.message}
          </p>
          {insight.action && (
            <p
              className="text-xs mt-1 font-medium"
              style={{ color: colorMap[insight.type] }}
            >
              {insight.action}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

const PRESET_URGE_TYPES = [
  { id: 'smoking', label: 'Smoking' },
  { id: 'drinking', label: 'Drinking' },
  { id: 'gambling', label: 'Gambling' },
  { id: 'drugs', label: 'Drugs' },
  { id: 'overeating', label: 'Overeating' },
  { id: 'social_media', label: 'Social Media' },
  { id: 'shopping', label: 'Shopping' },
  { id: 'pornography', label: 'Pornography' },
  { id: 'gaming', label: 'Gaming' },
  { id: 'other', label: 'Other' },
];

export default function Dashboard() {
  const { user, setUser } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [motivations, setMotivations] = useState([]);
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUrgePicker, setShowUrgePicker] = useState(false);
  const [pickerCustom, setPickerCustom] = useState('');
  const pickerRef = useRef(null);
  const [slipDialogOpen, setSlipDialogOpen] = useState(false);
  const [slipTrigger, setSlipTrigger] = useState('');
  const [slipEmotion, setSlipEmotion] = useState('');
  const [slipNotes, setSlipNotes] = useState('');
  const [slipSaving, setSlipSaving] = useState(false);
  const isPaid = user?.tier === 'paid';

  useEffect(() => {
    const fetchData = async () => {
      try {
        const requests = [
          axios.get(`${API}/stats`, { withCredentials: true }),
          axios.get(`${API}/motivations`, { withCredentials: true }),
        ];
        if (isPaid) {
          requests.push(
            axios.get(`${API}/insights`, { withCredentials: true }),
          );
        }
        const results = await Promise.all(requests);
        setStats(results[0].data);
        setMotivations(results[1].data);
        if (results[2]) setInsights(results[2].data);
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const handleClick = (e) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target)) {
        setShowUrgePicker(false);
      }
    };
    if (showUrgePicker) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showUrgePicker]);

  const saveUrgeType = async (type, custom = '') => {
    try {
      const res = await axios.put(
        `${API}/profile`,
        { urge_type: type, custom_urge_type: type === 'other' ? custom : null },
        { withCredentials: true },
      );
      setUser(res.data);
      setShowUrgePicker(false);
      setPickerCustom('');
    } catch (err) {
      console.error('Failed to save urge type:', err);
    }
  };

  const handleLogSlip = async () => {
    setSlipSaving(true);
    try {
      await axios.post(
        `${API}/relapses`,
        { trigger: slipTrigger || null, emotion: slipEmotion || null, notes: slipNotes || null },
        { withCredentials: true },
      );
      setSlipDialogOpen(false);
      setSlipTrigger('');
      setSlipEmotion('');
      setSlipNotes('');
    } catch (err) {
      console.error('Failed to log slip:', err);
    } finally {
      setSlipSaving(false);
    }
  };

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return t('good_morning');
    if (hour < 18) return t('good_afternoon');
    return t('good_evening');
  };

  const randomMotivation =
    motivations.length > 0
      ? motivations[Math.floor(Math.random() * motivations.length)]
      : null;

  const urgeLabel = user?.urge_type
    ? user.urge_type === 'other'
      ? user.custom_urge_type
      : t('urge_' + user.urge_type)
    : null;

  return (
    <AppLayout>
      <div data-testid="dashboard-page" className="space-y-8">
        <div>
          <h1
            className="font-heading text-4xl sm:text-5xl font-light tracking-tight"
            style={{ color: '#2A3A35' }}
          >
            {greeting()}, {user?.name?.split(' ')[0]}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <p
              className="text-base"
              style={{ color: '#7A8B85', fontFamily: 'Figtree, sans-serif' }}
            >
              {t('dashboard_subtitle')}
            </p>
            {urgeLabel ? (
              <span
                className="px-3 py-0.5 rounded-full text-xs font-medium"
                style={{ background: '#6B908015', color: '#6B9080' }}
              >
                {t('working_on')}: {urgeLabel}
              </span>
            ) : (
              <div className="relative" ref={pickerRef}>
                <button
                  onClick={() => setShowUrgePicker((v) => !v)}
                  className="flex items-center gap-1 px-3 py-0.5 rounded-full text-xs font-medium transition-all duration-200"
                  style={{ background: '#F0EFEB', color: '#A3B1AA', border: '1px dashed #C8D5CF' }}
                >
                  <Plus className="w-3 h-3" strokeWidth={2} />
                  {t('set_urge_type')}
                </button>
                {showUrgePicker && (
                  <div
                    className="absolute top-8 left-0 z-50 rounded-2xl shadow-lg p-4 w-64"
                    style={{ background: '#FFFFFF', border: '1px solid #E8E6E1' }}
                  >
                    <p className="text-xs font-medium mb-3 uppercase tracking-wider" style={{ color: '#A3B1AA' }}>
                      {t('whats_your_urge')}
                    </p>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {PRESET_URGE_TYPES.filter((o) => o.id !== 'other').map((opt) => (
                        <button
                          key={opt.id}
                          onClick={() => saveUrgeType(opt.id)}
                          className="px-3 py-1 rounded-full text-xs font-medium transition-all duration-200"
                          style={{ background: '#F0EFEB', color: '#7A8B85' }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = '#6B9080'; e.currentTarget.style.color = '#FFF'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = '#F0EFEB'; e.currentTarget.style.color = '#7A8B85'; }}
                        >
                          {t('urge_' + opt.id)}
                        </button>
                      ))}
                    </div>
                    <div className="flex gap-2 mt-2">
                      <input
                        type="text"
                        value={pickerCustom}
                        onChange={(e) => setPickerCustom(e.target.value)}
                        placeholder={t('custom_urge_placeholder')}
                        className="flex-1 px-2 py-1.5 rounded-lg text-xs"
                        style={{ border: '1px solid #E8E6E1', color: '#2A3A35', outline: 'none' }}
                        onKeyDown={(e) => { if (e.key === 'Enter' && pickerCustom.trim()) saveUrgeType('other', pickerCustom.trim()); }}
                      />
                      <button
                        onClick={() => { if (pickerCustom.trim()) saveUrgeType('other', pickerCustom.trim()); }}
                        className="px-2 py-1.5 rounded-lg text-xs font-medium"
                        style={{ background: '#6B9080', color: '#FFF' }}
                      >
                        {t('save')}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Anti-relapse insights (paid) */}
        {isPaid && insights.length > 0 && (
          <div className="space-y-3">
            {insights.map((insight, i) => (
              <InsightCard key={i} insight={insight} />
            ))}
          </div>
        )}

        <button
          data-testid="urge-button"
          onClick={() => navigate('/urge-timer')}
          className="w-full p-8 md:p-10 rounded-3xl text-left transition-all duration-300 hover:-translate-y-1 hover:shadow-lg group"
          style={{ background: '#E5989B', border: '1px solid #D58A8D22' }}
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <Flame
                  className="w-7 h-7 text-white opacity-90"
                  strokeWidth={1.5}
                />
                <span
                  className="text-sm font-medium text-white opacity-80 uppercase tracking-wider"
                  style={{ fontFamily: 'Figtree, sans-serif' }}
                >
                  {t('need_support')}
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-medium text-white tracking-tight font-heading">
                {t('having_urge')}
              </h2>
              <p
                className="mt-2 text-white opacity-80 text-sm"
                style={{ fontFamily: 'Figtree, sans-serif' }}
              >
                {t('urge_cta_desc')}
              </p>
            </div>
            <ArrowRight
              className="w-8 h-8 text-white opacity-60 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300"
              strokeWidth={1.5}
            />
          </div>
        </button>

        <StatsGrid t={t} stats={stats} loading={loading} />

        <div className="grid md:grid-cols-3 gap-4">
          <QuickActions t={t} onLogSlip={() => setSlipDialogOpen(true)} />
          <div
            className="rounded-2xl p-6 shadow-sm flex flex-col justify-between"
            style={{ background: '#FFFFFF', border: '1px solid #E8E6E1' }}
          >
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Heart
                  className="w-5 h-5"
                  style={{ color: '#E5989B' }}
                  strokeWidth={1.5}
                />
                <h3
                  className="font-heading text-lg font-medium"
                  style={{ color: '#2A3A35' }}
                >
                  {t('your_reminder')}
                </h3>
              </div>
              {randomMotivation ? (
                <p
                  className="text-base leading-relaxed italic"
                  style={{
                    color: '#7A8B85',
                    fontFamily: 'Figtree, sans-serif',
                  }}
                >
                  "{randomMotivation.message}"
                </p>
              ) : (
                <p
                  className="text-sm"
                  style={{
                    color: '#A3B1AA',
                    fontFamily: 'Figtree, sans-serif',
                  }}
                >
                  {t('add_reminder_prompt')}
                </p>
              )}
            </div>
            <button
              data-testid="add-motivation-btn"
              onClick={() => navigate('/motivation')}
              className="mt-4 text-sm font-medium flex items-center gap-1 transition-colors duration-200"
              style={{ color: '#6B9080' }}
            >
              {randomMotivation ? t('view_all') : t('add_one_now')}{' '}
              <ArrowRight className="w-4 h-4" strokeWidth={1.5} />
            </button>
          </div>
        </div>

        <WeeklyChart t={t} weekly={stats?.weekly} />
      </div>

      {/* Log a Slip dialog */}
      {slipDialogOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(42,58,53,0.4)' }}
          onClick={() => setSlipDialogOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl p-6 shadow-xl"
            style={{ background: '#FFFFFF', border: '1px solid #E8E6E1' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-heading text-xl font-medium" style={{ color: '#2A3A35' }}>
                {t('log_a_slip')}
              </h3>
              <button onClick={() => setSlipDialogOpen(false)} style={{ color: '#A3B1AA' }}>
                <X className="w-5 h-5" strokeWidth={1.5} />
              </button>
            </div>
            <p className="text-sm mb-4" style={{ color: '#7A8B85' }}>
              {t('slip_dialog_desc')}
            </p>
            <div className="space-y-3">
              <select
                value={slipTrigger}
                onChange={(e) => setSlipTrigger(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl text-sm"
                style={{ border: '1px solid #E8E6E1', color: slipTrigger ? '#2A3A35' : '#A3B1AA', outline: 'none' }}
              >
                <option value="">{t('trigger_placeholder')}</option>
                {['stress','boredom','loneliness','location','social','tiredness','habit_loop','other'].map((k) => (
                  <option key={k} value={t(k)}>{t(k)}</option>
                ))}
              </select>
              <select
                value={slipEmotion}
                onChange={(e) => setSlipEmotion(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl text-sm"
                style={{ border: '1px solid #E8E6E1', color: slipEmotion ? '#2A3A35' : '#A3B1AA', outline: 'none' }}
              >
                <option value="">{t('emotion_placeholder')}</option>
                {['anxious','sad','angry','frustrated','lonely','restless','numb','overwhelmed'].map((k) => (
                  <option key={k} value={t(k)}>{t(k)}</option>
                ))}
              </select>
              <textarea
                value={slipNotes}
                onChange={(e) => setSlipNotes(e.target.value)}
                placeholder={t('any_notes')}
                rows={2}
                className="w-full px-3 py-2.5 rounded-xl text-sm resize-none"
                style={{ border: '1px solid #E8E6E1', color: '#2A3A35', outline: 'none' }}
              />
            </div>
            <button
              onClick={handleLogSlip}
              disabled={slipSaving}
              className="mt-4 w-full py-3 rounded-full text-white text-sm font-medium transition-opacity"
              style={{ background: '#E5989B', opacity: slipSaving ? 0.7 : 1 }}
            >
              {slipSaving ? t('saving') : t('log_slip_confirm')}
            </button>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
