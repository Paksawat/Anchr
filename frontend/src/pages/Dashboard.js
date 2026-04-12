import React, { useState, useEffect } from 'react';
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

export default function Dashboard() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [motivations, setMotivations] = useState([]);
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(true);
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

  const urgeLabel =
    user?.urge_type === 'other' ? user?.custom_urge_type : user?.urge_type;

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
          <p
            className="mt-2 text-base"
            style={{ color: '#7A8B85', fontFamily: 'Figtree, sans-serif' }}
          >
            {t('dashboard_subtitle')}
            {urgeLabel && (
              <span
                className="ml-2 px-3 py-0.5 rounded-full text-xs font-medium"
                style={{ background: '#6B908015', color: '#6B9080' }}
              >
                Working on: {urgeLabel}
              </span>
            )}
          </p>
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
          <QuickActions t={t} />
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
    </AppLayout>
  );
}
