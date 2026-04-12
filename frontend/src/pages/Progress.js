import React, { useState, useEffect } from 'react';
import AppLayout from '../components/AppLayout';
import { useLanguage } from '../contexts/LanguageContext';
import axios from 'axios';
import { Tabs, TabsList, TabsTrigger } from '../components/ui/tabs';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { TriggerInsights, PeakTimes, RecentUrges } from '../components/progress/ProgressSections';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

function StatsCards({ t, stats }) {
  const items = [
    { label: t('streak'), value: `${stats?.streak_days || 0} ${t('days')}`, testId: 'progress-streak' },
    { label: t('resisted'), value: stats?.urges_resisted || 0 },
    { label: t('resist_rate'), value: `${stats?.resist_rate || 0}%` },
    { label: t('best_streak'), value: `${stats?.best_streak || 0} ${t('days')}` },
  ];
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {items.map((item) => (
        <div key={item.label} className="rounded-2xl p-5 shadow-sm" style={{ background: '#FFFFFF', border: '1px solid #E8E6E1' }}>
          <span className="text-sm" style={{ color: '#A3B1AA' }}>{item.label}</span>
          <p data-testid={item.testId} className="text-2xl font-heading font-light mt-1" style={{ color: '#2A3A35' }}>{item.value}</p>
        </div>
      ))}
    </div>
  );
}

function UrgeActivityChart({ t, stats, period, setPeriod }) {
  const chartData = period === 'weekly' ? stats?.weekly : stats?.monthly;

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-xl p-3 shadow-md" style={{ background: '#FFFFFF', border: '1px solid #E8E6E1' }}>
          <p className="text-xs font-medium" style={{ color: '#2A3A35' }}>{payload[0]?.payload?.label || label}</p>
          <p className="text-xs" style={{ color: '#6B9080' }}>{t('urges_resisted').split(' ')[0]}: {payload[0]?.value}</p>
          {payload[1] && <p className="text-xs" style={{ color: '#A4C3B2' }}>{t('resisted')}: {payload[1]?.value}</p>}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="rounded-2xl p-6 shadow-sm" style={{ background: '#FFFFFF', border: '1px solid #E8E6E1' }}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-heading text-lg font-medium" style={{ color: '#2A3A35' }}>{t('urge_activity')}</h3>
        <Tabs value={period} onValueChange={setPeriod}>
          <TabsList className="rounded-lg p-1" style={{ background: '#F0EFEB' }}>
            <TabsTrigger data-testid="tab-weekly" value="weekly" className="rounded-md px-3 py-1 text-xs data-[state=active]:bg-white data-[state=active]:shadow-sm">{t('week')}</TabsTrigger>
            <TabsTrigger data-testid="tab-monthly" value="monthly" className="rounded-md px-3 py-1 text-xs data-[state=active]:bg-white data-[state=active]:shadow-sm">{t('month')}</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      {chartData && chartData.length > 0 ? (
        <ResponsiveContainer width="100%" height={250}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="urgeGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#A4C3B2" stopOpacity={0.3} /><stop offset="95%" stopColor="#A4C3B2" stopOpacity={0} /></linearGradient>
              <linearGradient id="resistGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#6B9080" stopOpacity={0.3} /><stop offset="95%" stopColor="#6B9080" stopOpacity={0} /></linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#E8E6E1" vertical={false} />
            <XAxis dataKey={period === 'weekly' ? 'label' : 'date'} tick={{ fontSize: 12, fill: '#A3B1AA' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 12, fill: '#A3B1AA' }} axisLine={false} tickLine={false} allowDecimals={false} />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="urges" stroke="#A4C3B2" fill="url(#urgeGradient)" strokeWidth={2} />
            <Area type="monotone" dataKey="resisted" stroke="#6B9080" fill="url(#resistGradient)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      ) : (
        <div className="h-48 flex items-center justify-center"><p className="text-sm" style={{ color: '#A3B1AA' }}>{t('no_data_yet')}</p></div>
      )}
    </div>
  );
}

export default function Progress() {
  const { t } = useLanguage();
  const [stats, setStats] = useState(null);
  const [triggerStats, setTriggerStats] = useState(null);
  const [urges, setUrges] = useState([]);
  const [period, setPeriod] = useState('weekly');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [statsRes, triggersRes, urgesRes] = await Promise.all([
          axios.get(`${API}/stats`, { withCredentials: true }),
          axios.get(`${API}/stats/triggers`, { withCredentials: true }),
          axios.get(`${API}/urges`, { withCredentials: true }),
        ]);
        setStats(statsRes.data);
        setTriggerStats(triggersRes.data);
        setUrges(urgesRes.data);
      } catch (error) {
        console.error('Failed to load progress data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return <AppLayout><div className="flex items-center justify-center py-20"><div className="w-10 h-10 rounded-full animate-pulse" style={{ background: '#A4C3B2' }} /></div></AppLayout>;
  }

  return (
    <AppLayout>
      <div data-testid="progress-page" className="space-y-6">
        <div>
          <h1 className="font-heading text-4xl sm:text-5xl font-light tracking-tight" style={{ color: '#2A3A35' }}>{t('your_progress')}</h1>
          <p className="mt-2" style={{ color: '#7A8B85', fontFamily: 'Figtree, sans-serif' }}>{t('progress_subtitle')}</p>
        </div>
        <StatsCards t={t} stats={stats} />
        <UrgeActivityChart t={t} stats={stats} period={period} setPeriod={setPeriod} />
        <div className="grid md:grid-cols-2 gap-4">
          <TriggerInsights t={t} triggerStats={triggerStats} />
          <PeakTimes t={t} triggerStats={triggerStats} />
        </div>
        <RecentUrges t={t} urges={urges} />
      </div>
    </AppLayout>
  );
}
