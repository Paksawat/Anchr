import React, { useState, useEffect, useCallback } from 'react';
import AppLayout from '../components/AppLayout';
import { useLanguage } from '../contexts/LanguageContext';
import axios from 'axios';
import { Tabs, TabsList, TabsTrigger } from '../components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../components/ui/dialog';
import { Textarea } from '../components/ui/textarea';
import { Button } from '../components/ui/button';
import { RefreshCw } from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  TriggerInsights,
  PeakTimes,
  RecentUrges,
} from '../components/progress/ProgressSections';

const TRIGGER_KEYS = ['stress', 'boredom', 'loneliness', 'location', 'social', 'tiredness', 'habit_loop', 'other'];
const EMOTION_KEYS = ['anxious', 'sad', 'angry', 'frustrated', 'lonely', 'restless', 'numb', 'overwhelmed'];

const API = `/api`;

function StatsCards({ t, stats }) {
  const items = [
    {
      label: t('streak'),
      value: `${stats?.streak_days || 0} ${t('days')}`,
      testId: 'progress-streak',
    },
    { label: t('resisted'), value: stats?.urges_resisted || 0 },
    { label: t('resist_rate'), value: `${stats?.resist_rate || 0}%` },
    {
      label: t('best_streak'),
      value: `${stats?.best_streak || 0} ${t('days')}`,
    },
  ];
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {items.map((item) => (
        <div
          key={item.label}
          className="rounded-2xl p-5 shadow-sm"
          style={{ background: '#FFFFFF', border: '1px solid #E8E6E1' }}
        >
          <span className="text-sm" style={{ color: '#A3B1AA' }}>
            {item.label}
          </span>
          <p
            data-testid={item.testId}
            className="text-2xl font-heading font-light mt-1"
            style={{ color: '#2A3A35' }}
          >
            {item.value}
          </p>
        </div>
      ))}
    </div>
  );
}

function UrgeActivityChart({ t, stats, period, setPeriod }) {
  const chartData = period === 'weekly' ? stats?.weekly : period === 'monthly' ? stats?.monthly : stats?.yearly;

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div
          className="rounded-xl p-3 shadow-md"
          style={{ background: '#FFFFFF', border: '1px solid #E8E6E1' }}
        >
          <p className="text-xs font-medium" style={{ color: '#2A3A35' }}>
            {payload[0]?.payload?.label || label}
          </p>
          <p className="text-xs" style={{ color: '#6B9080' }}>
            {t('urges_resisted').split(' ')[0]}: {payload[0]?.value}
          </p>
          {payload[1] && (
            <p className="text-xs" style={{ color: '#A4C3B2' }}>
              {t('resisted')}: {payload[1]?.value}
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div
      className="rounded-2xl p-6 shadow-sm"
      style={{ background: '#FFFFFF', border: '1px solid #E8E6E1' }}
    >
      <div className="flex items-center justify-between mb-6">
        <h3
          className="font-heading text-lg font-medium"
          style={{ color: '#2A3A35' }}
        >
          {t('urge_activity')}
        </h3>
        <Tabs value={period} onValueChange={setPeriod}>
          <TabsList
            className="rounded-lg p-1"
            style={{ background: '#F0EFEB' }}
          >
            <TabsTrigger
              data-testid="tab-weekly"
              value="weekly"
              className="rounded-md px-3 py-1 text-xs data-[state=active]:bg-white data-[state=active]:shadow-sm"
            >
              {t('week')}
            </TabsTrigger>
            <TabsTrigger
              data-testid="tab-monthly"
              value="monthly"
              className="rounded-md px-3 py-1 text-xs data-[state=active]:bg-white data-[state=active]:shadow-sm"
            >
              {t('month')}
            </TabsTrigger>
            <TabsTrigger
              data-testid="tab-yearly"
              value="yearly"
              className="rounded-md px-3 py-1 text-xs data-[state=active]:bg-white data-[state=active]:shadow-sm"
            >
              {t('year')}
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      {chartData && chartData.length > 0 ? (
        <ResponsiveContainer width="100%" height={250}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="urgeGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#A4C3B2" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#A4C3B2" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="resistGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6B9080" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#6B9080" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#E8E6E1"
              vertical={false}
            />
            <XAxis
              dataKey={period === 'weekly' || period === 'yearly' ? 'label' : 'date'}
              tick={{ fontSize: 12, fill: '#A3B1AA' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 12, fill: '#A3B1AA' }}
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="urges"
              stroke="#A4C3B2"
              fill="url(#urgeGradient)"
              strokeWidth={2}
            />
            <Area
              type="monotone"
              dataKey="resisted"
              stroke="#6B9080"
              fill="url(#resistGradient)"
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      ) : (
        <div className="h-48 flex items-center justify-center">
          <p className="text-sm" style={{ color: '#A3B1AA' }}>
            {t('no_data_yet')}
          </p>
        </div>
      )}
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

export default function Progress() {
  const { t } = useLanguage();
  const [stats, setStats] = useState(null);
  const [triggerStats, setTriggerStats] = useState(null);
  const [urges, setUrges] = useState([]);
  const [relapses, setRelapses] = useState([]);
  const [period, setPeriod] = useState('weekly');
  const [loading, setLoading] = useState(true);
  const [urgeTypeFilter, setUrgeTypeFilter] = useState('all');
  const [availableUrgeTypes, setAvailableUrgeTypes] = useState([]);
  const [relapseDialogOpen, setRelapseDialogOpen] = useState(false);
  const [relapseTrigger, setRelapseTrigger] = useState('');
  const [relapseEmotion, setRelapseEmotion] = useState('');
  const [relapseNotes, setRelapseNotes] = useState('');

  const fetchData = useCallback(async (filter) => {
    try {
      const params = filter && filter !== 'all' ? { urge_type: filter } : {};
      const [statsRes, triggersRes, urgesRes, relapsesRes] = await Promise.all([
        axios.get(`${API}/stats`, { params, withCredentials: true }),
        axios.get(`${API}/stats/triggers`, { params, withCredentials: true }),
        axios.get(`${API}/urges`, { withCredentials: true }),
        axios.get(`${API}/relapses`, { withCredentials: true }),
      ]);
      setStats(statsRes.data);
      setTriggerStats(triggersRes.data);
      const allUrges = urgesRes.data;
      setUrges(allUrges);
      setRelapses(relapsesRes.data);
      const types = [...new Set(allUrges.map((u) => u.urge_type).filter(Boolean))];
      setAvailableUrgeTypes(types);
    } catch (error) {
      console.error('Failed to load progress data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleLogRelapse = async () => {
    try {
      const res = await axios.post(
        `${API}/relapses`,
        { trigger: relapseTrigger || null, emotion: relapseEmotion || null, notes: relapseNotes || null },
        { withCredentials: true },
      );
      setRelapses([res.data, ...relapses]);
      setRelapseDialogOpen(false);
      setRelapseTrigger('');
      setRelapseEmotion('');
      setRelapseNotes('');
      // Refresh stats since streak changed
      fetchData(urgeTypeFilter);
    } catch (error) {
      console.error('Failed to log relapse:', error);
    }
  };

  useEffect(() => {
    fetchData(urgeTypeFilter);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleFilterChange = (val) => {
    setUrgeTypeFilter(val);
    fetchData(val);
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-20">
          <div
            className="w-10 h-10 rounded-full animate-pulse"
            style={{ background: '#A4C3B2' }}
          />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div data-testid="progress-page" className="space-y-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1
              className="font-heading text-4xl sm:text-5xl font-light tracking-tight"
              style={{ color: '#2A3A35' }}
            >
              {t('your_progress')}
            </h1>
            <p
              className="mt-2"
              style={{ color: '#7A8B85', fontFamily: 'Figtree, sans-serif' }}
            >
              {t('progress_subtitle')}
            </p>
          </div>
          {availableUrgeTypes.length > 1 && (
            <div className="shrink-0 mt-1">
              <Select value={urgeTypeFilter} onValueChange={handleFilterChange}>
                <SelectTrigger
                  className="rounded-xl text-sm h-9 min-w-[140px]"
                  style={{ border: '1px solid #E8E6E1', color: '#2A3A35' }}
                >
                  <SelectValue placeholder={t('filter_by_urge')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('all_urges')}</SelectItem>
                  {availableUrgeTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type === 'other'
                        ? t('urge_other')
                        : t('urge_' + type) || type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
        <StatsCards t={t} stats={stats} />
        <UrgeActivityChart
          t={t}
          stats={stats}
          period={period}
          setPeriod={setPeriod}
        />
        <div className="grid md:grid-cols-2 gap-4">
          <TriggerInsights t={t} triggerStats={triggerStats} />
          <PeakTimes t={t} triggerStats={triggerStats} />
        </div>
        <RecentUrges
          t={t}
          urges={urgeTypeFilter === 'all' ? urges : urges.filter((u) => u.urge_type === urgeTypeFilter)}
        />

        {/* Recovery Log */}
        <div className="rounded-2xl p-6 shadow-sm" style={{ background: '#FFFFFF', border: '1px solid #E8E6E1' }}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <RefreshCw className="w-5 h-5" style={{ color: '#6B9080' }} strokeWidth={1.5} />
              <h3 className="font-heading text-lg font-medium" style={{ color: '#2A3A35' }}>{t('recovery_log')}</h3>
            </div>
            <Dialog open={relapseDialogOpen} onOpenChange={setRelapseDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="rounded-full text-sm" style={{ border: '1px solid #E8E6E1', color: '#7A8B85' }}>
                  {t('log_a_slip')}
                </Button>
              </DialogTrigger>
              <DialogContent className="rounded-2xl" style={{ border: '1px solid #E8E6E1' }}>
                <DialogHeader>
                  <DialogTitle className="font-heading text-xl" style={{ color: '#2A3A35' }}>{t('slip_title')}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-2">
                  <p className="text-sm" style={{ color: '#7A8B85' }}>{t('slip_desc')}</p>
                  <Select value={relapseTrigger} onValueChange={setRelapseTrigger}>
                    <SelectTrigger className="rounded-xl" style={{ border: '1px solid #E8E6E1' }}>
                      <SelectValue placeholder={t('what_triggered')} />
                    </SelectTrigger>
                    <SelectContent>
                      {TRIGGER_KEYS.map((k) => <SelectItem key={k} value={k}>{t(k)}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Select value={relapseEmotion} onValueChange={setRelapseEmotion}>
                    <SelectTrigger className="rounded-xl" style={{ border: '1px solid #E8E6E1' }}>
                      <SelectValue placeholder={t('how_feeling')} />
                    </SelectTrigger>
                    <SelectContent>
                      {EMOTION_KEYS.map((k) => <SelectItem key={k} value={k}>{t(k)}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Textarea
                    value={relapseNotes}
                    onChange={(e) => setRelapseNotes(e.target.value)}
                    placeholder={t('any_reflections')}
                    className="rounded-xl resize-none"
                    style={{ border: '1px solid #E8E6E1' }}
                    rows={3}
                  />
                  <Button onClick={handleLogRelapse} className="w-full rounded-full text-white font-medium h-11" style={{ background: '#6B9080' }}>
                    {t('log_reset_streak')}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          {relapses.length > 0 ? (
            <div className="space-y-3">
              {relapses.slice(0, 10).map((r) => (
                <div key={r.relapse_id} className="p-3 rounded-xl" style={{ background: '#F9F8F6' }}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium" style={{ color: '#2A3A35' }}>
                        {r.trigger ? (t(r.trigger) !== r.trigger ? t(r.trigger) : r.trigger) : t('unknown_trigger')}
                        {' · '}
                        {r.emotion ? (t(r.emotion) !== r.emotion ? t(r.emotion) : r.emotion) : t('unknown_emotion')}
                      </p>
                      {r.notes && <p className="text-xs mt-1" style={{ color: '#7A8B85' }}>{r.notes}</p>}
                      <p className="text-xs mt-1" style={{ color: '#A3B1AA' }}>{new Date(r.created_at).toLocaleDateString()}</p>
                    </div>
                    <span className="text-xs px-3 py-1 rounded-full shrink-0" style={{ background: '#E2D4C844', color: '#7A8B85' }}>
                      {t('recovery_point')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm" style={{ color: '#A3B1AA' }}>{t('no_slips')}</p>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
