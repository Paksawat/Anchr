import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import AppLayout from '../components/AppLayout';
import StatsGrid from '../components/dashboard/StatsGrid';
import QuickActions from '../components/dashboard/QuickActions';
import WeeklyChart from '../components/dashboard/WeeklyChart';
import axios from 'axios';
import { Flame, Heart, ArrowRight } from 'lucide-react';

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
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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
                <span className="text-sm font-medium text-white opacity-80 uppercase tracking-wider" style={{ fontFamily: 'Figtree, sans-serif' }}>{t('need_support')}</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-medium text-white tracking-tight font-heading">{t('having_urge')}</h2>
              <p className="mt-2 text-white opacity-80 text-sm" style={{ fontFamily: 'Figtree, sans-serif' }}>{t('urge_cta_desc')}</p>
            </div>
            <ArrowRight className="w-8 h-8 text-white opacity-60 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300" strokeWidth={1.5} />
          </div>
        </button>

        <StatsGrid t={t} stats={stats} loading={loading} />

        <div className="grid md:grid-cols-3 gap-4">
          <QuickActions t={t} />
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

        <WeeklyChart t={t} weekly={stats?.weekly} />
      </div>
    </AppLayout>
  );
}
