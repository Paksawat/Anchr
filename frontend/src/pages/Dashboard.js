import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import AppLayout from '../components/AppLayout';
import axios from 'axios';
import { Flame, Shield, TrendingUp, Zap, Heart, Clock, ArrowRight, Sparkles } from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function Dashboard() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [motivations, setMotivations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, motRes] = await Promise.all([
          axios.get(`${API}/stats`, { withCredentials: true }),
          axios.get(`${API}/motivations`, { withCredentials: true }),
        ]);
        setStats(statsRes.data);
        setMotivations(motRes.data);
      } catch {
        // Silently handle — stats will show defaults
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return t('good_morning');
    if (hour < 18) return t('good_afternoon');
    return t('good_evening');
  };

  const randomMotivation = motivations.length > 0
    ? motivations[Math.floor(Math.random() * motivations.length)]
    : null;

  return (
    <AppLayout>
      <div data-testid="dashboard-page" className="space-y-8">
        <div>
          <h1 className="font-heading text-4xl sm:text-5xl font-light tracking-tight" style={{ color: '#2A3A35' }}>
            {greeting()}, {user?.name?.split(' ')[0]}
          </h1>
          <p className="mt-2 text-base" style={{ color: '#7A8B85', fontFamily: 'Figtree, sans-serif' }}>
            {t('dashboard_subtitle')}
          </p>
        </div>

        <button
          data-testid="urge-button"
          onClick={() => navigate('/urge-timer')}
          className="w-full p-8 md:p-10 rounded-3xl text-left transition-all duration-300 hover:-translate-y-1 hover:shadow-lg group"
          style={{ background: '#E5989B', border: '1px solid #D58A8D22' }}
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <Flame className="w-7 h-7 text-white opacity-90" strokeWidth={1.5} />
                <span className="text-sm font-medium text-white opacity-80 uppercase tracking-wider" style={{ fontFamily: 'Figtree, sans-serif' }}>
                  {t('need_support')}
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-medium text-white tracking-tight font-heading">
                {t('having_urge')}
              </h2>
              <p className="mt-2 text-white opacity-80 text-sm" style={{ fontFamily: 'Figtree, sans-serif' }}>
                {t('urge_cta_desc')}
              </p>
            </div>
            <ArrowRight className="w-8 h-8 text-white opacity-60 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300" strokeWidth={1.5} />
          </div>
        </button>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="rounded-2xl p-6 shadow-sm" style={{ background: '#FFFFFF', border: '1px solid #E8E6E1' }}>
            <div className="flex items-center gap-2 mb-3">
              <Shield className="w-5 h-5" style={{ color: '#6B9080' }} strokeWidth={1.5} />
              <span className="text-sm" style={{ color: '#A3B1AA', fontFamily: 'Figtree, sans-serif' }}>{t('current_streak')}</span>
            </div>
            <p data-testid="streak-count" className="text-3xl font-light font-heading" style={{ color: '#2A3A35' }}>
              {loading ? '-' : stats?.streak_days || 0}
            </p>
            <p className="text-xs mt-1" style={{ color: '#A3B1AA' }}>{t('days_strong')}</p>
          </div>
          <div className="rounded-2xl p-6 shadow-sm" style={{ background: '#FFFFFF', border: '1px solid #E8E6E1' }}>
            <div className="flex items-center gap-2 mb-3">
              <Zap className="w-5 h-5" style={{ color: '#6B9080' }} strokeWidth={1.5} />
              <span className="text-sm" style={{ color: '#A3B1AA', fontFamily: 'Figtree, sans-serif' }}>{t('urges_resisted')}</span>
            </div>
            <p data-testid="urges-resisted" className="text-3xl font-light font-heading" style={{ color: '#2A3A35' }}>
              {loading ? '-' : stats?.urges_resisted || 0}
            </p>
            <p className="text-xs mt-1" style={{ color: '#A3B1AA' }}>{t('total')}</p>
          </div>
          <div className="rounded-2xl p-6 shadow-sm" style={{ background: '#FFFFFF', border: '1px solid #E8E6E1' }}>
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-5 h-5" style={{ color: '#6B9080' }} strokeWidth={1.5} />
              <span className="text-sm" style={{ color: '#A3B1AA', fontFamily: 'Figtree, sans-serif' }}>{t('resist_rate')}</span>
            </div>
            <p data-testid="resist-rate" className="text-3xl font-light font-heading" style={{ color: '#2A3A35' }}>
              {loading ? '-' : `${stats?.resist_rate || 0}%`}
            </p>
            <p className="text-xs mt-1" style={{ color: '#A3B1AA' }}>{t('success')}</p>
          </div>
          <div className="rounded-2xl p-6 shadow-sm" style={{ background: '#FFFFFF', border: '1px solid #E8E6E1' }}>
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-5 h-5" style={{ color: '#6B9080' }} strokeWidth={1.5} />
              <span className="text-sm" style={{ color: '#A3B1AA', fontFamily: 'Figtree, sans-serif' }}>{t('best_streak')}</span>
            </div>
            <p data-testid="best-streak" className="text-3xl font-light font-heading" style={{ color: '#2A3A35' }}>
              {loading ? '-' : stats?.best_streak || 0}
            </p>
            <p className="text-xs mt-1" style={{ color: '#A3B1AA' }}>{t('days')}</p>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <div className="md:col-span-2 rounded-2xl p-6 shadow-sm" style={{ background: '#FFFFFF', border: '1px solid #E8E6E1' }}>
            <h3 className="font-heading text-lg font-medium mb-4" style={{ color: '#2A3A35' }}>{t('quick_actions')}</h3>
            <div className="grid grid-cols-2 gap-3">
              <button data-testid="quick-breathing" onClick={() => navigate('/urge-timer', { state: { tab: 'breathing' } })} className="flex items-center gap-3 p-4 rounded-xl transition-all duration-200 hover:-translate-y-px" style={{ background: '#F0EFEB' }}>
                <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: '#A8DADC44' }}><Clock className="w-5 h-5" style={{ color: '#6B9080' }} strokeWidth={1.5} /></div>
                <span className="text-sm font-medium" style={{ color: '#2A3A35' }}>{t('breathing')}</span>
              </button>
              <button data-testid="quick-grounding" onClick={() => navigate('/urge-timer', { state: { tab: 'grounding' } })} className="flex items-center gap-3 p-4 rounded-xl transition-all duration-200 hover:-translate-y-px" style={{ background: '#F0EFEB' }}>
                <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: '#A4C3B244' }}><Shield className="w-5 h-5" style={{ color: '#6B9080' }} strokeWidth={1.5} /></div>
                <span className="text-sm font-medium" style={{ color: '#2A3A35' }}>{t('grounding')}</span>
              </button>
              <button data-testid="quick-progress" onClick={() => navigate('/progress')} className="flex items-center gap-3 p-4 rounded-xl transition-all duration-200 hover:-translate-y-px" style={{ background: '#F0EFEB' }}>
                <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: '#6B908044' }}><TrendingUp className="w-5 h-5" style={{ color: '#6B9080' }} strokeWidth={1.5} /></div>
                <span className="text-sm font-medium" style={{ color: '#2A3A35' }}>{t('progress')}</span>
              </button>
              <button data-testid="quick-motivation" onClick={() => navigate('/motivation')} className="flex items-center gap-3 p-4 rounded-xl transition-all duration-200 hover:-translate-y-px" style={{ background: '#F0EFEB' }}>
                <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: '#E5989B44' }}><Heart className="w-5 h-5" style={{ color: '#E5989B' }} strokeWidth={1.5} /></div>
                <span className="text-sm font-medium" style={{ color: '#2A3A35' }}>{t('motivation')}</span>
              </button>
            </div>
          </div>
          <div className="rounded-2xl p-6 shadow-sm flex flex-col justify-between" style={{ background: '#FFFFFF', border: '1px solid #E8E6E1' }}>
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Heart className="w-5 h-5" style={{ color: '#E5989B' }} strokeWidth={1.5} />
                <h3 className="font-heading text-lg font-medium" style={{ color: '#2A3A35' }}>{t('your_reminder')}</h3>
              </div>
              {randomMotivation ? (
                <p className="text-base leading-relaxed italic" style={{ color: '#7A8B85', fontFamily: 'Figtree, sans-serif' }}>"{randomMotivation.message}"</p>
              ) : (
                <p className="text-sm" style={{ color: '#A3B1AA', fontFamily: 'Figtree, sans-serif' }}>{t('add_reminder_prompt')}</p>
              )}
            </div>
            <button data-testid="add-motivation-btn" onClick={() => navigate('/motivation')} className="mt-4 text-sm font-medium flex items-center gap-1 transition-colors duration-200" style={{ color: '#6B9080' }}>
              {randomMotivation ? t('view_all') : t('add_one_now')} <ArrowRight className="w-4 h-4" strokeWidth={1.5} />
            </button>
          </div>
        </div>

        {stats?.weekly && (
          <div className="rounded-2xl p-6 shadow-sm" style={{ background: '#FFFFFF', border: '1px solid #E8E6E1' }}>
            <h3 className="font-heading text-lg font-medium mb-4" style={{ color: '#2A3A35' }}>{t('this_week')}</h3>
            <div className="flex items-end gap-2 h-32">
              {stats.weekly.map((day) => {
                const maxUrges = Math.max(...stats.weekly.map(d => d.urges), 1);
                const height = day.urges > 0 ? Math.max((day.urges / maxUrges) * 100, 12) : 4;
                return (
                  <div key={day.date} className="flex-1 flex flex-col items-center gap-2">
                    <div className="w-full flex flex-col justify-end" style={{ height: '100px' }}>
                      <div className="w-full rounded-t-lg transition-all duration-300" style={{ height: `${height}%`, background: day.resisted === day.urges && day.urges > 0 ? '#6B9080' : day.urges > 0 ? '#A4C3B2' : '#E8E6E1' }} />
                    </div>
                    <span className="text-xs" style={{ color: '#A3B1AA' }}>{day.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
