import React, { useState, useEffect } from 'react';
import AppLayout from '../components/AppLayout';
import axios from 'axios';
import { TrendingUp, Target, Clock, BarChart3, ArrowUp, ArrowDown } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell
} from 'recharts';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function Progress() {
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
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  const chartData = period === 'weekly' ? stats?.weekly : stats?.monthly;

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-xl p-3 shadow-md" style={{ background: '#FFFFFF', border: '1px solid #E8E6E1' }}>
          <p className="text-xs font-medium" style={{ color: '#2A3A35' }}>{payload[0]?.payload?.label || label}</p>
          <p className="text-xs" style={{ color: '#6B9080' }}>Urges: {payload[0]?.value}</p>
          {payload[1] && <p className="text-xs" style={{ color: '#A4C3B2' }}>Resisted: {payload[1]?.value}</p>}
        </div>
      );
    }
    return null;
  };

  const formatHour = (h) => {
    if (h === 0) return '12am';
    if (h < 12) return `${h}am`;
    if (h === 12) return '12pm';
    return `${h-12}pm`;
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-20">
          <div className="w-10 h-10 rounded-full animate-pulse" style={{ background: '#A4C3B2' }} />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div data-testid="progress-page" className="space-y-6">
        <div>
          <h1 className="font-heading text-4xl sm:text-5xl font-light tracking-tight" style={{ color: '#2A3A35' }}>
            Your Progress
          </h1>
          <p className="mt-2" style={{ color: '#7A8B85', fontFamily: 'Figtree, sans-serif' }}>
            Every step forward matters, even the small ones
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="rounded-2xl p-5 shadow-sm" style={{ background: '#FFFFFF', border: '1px solid #E8E6E1' }}>
            <span className="text-sm" style={{ color: '#A3B1AA' }}>Streak</span>
            <p data-testid="progress-streak" className="text-2xl font-heading font-light mt-1" style={{ color: '#2A3A35' }}>{stats?.streak_days || 0} days</p>
          </div>
          <div className="rounded-2xl p-5 shadow-sm" style={{ background: '#FFFFFF', border: '1px solid #E8E6E1' }}>
            <span className="text-sm" style={{ color: '#A3B1AA' }}>Resisted</span>
            <p className="text-2xl font-heading font-light mt-1" style={{ color: '#2A3A35' }}>{stats?.urges_resisted || 0}</p>
          </div>
          <div className="rounded-2xl p-5 shadow-sm" style={{ background: '#FFFFFF', border: '1px solid #E8E6E1' }}>
            <span className="text-sm" style={{ color: '#A3B1AA' }}>Resist Rate</span>
            <p className="text-2xl font-heading font-light mt-1" style={{ color: '#2A3A35' }}>{stats?.resist_rate || 0}%</p>
          </div>
          <div className="rounded-2xl p-5 shadow-sm" style={{ background: '#FFFFFF', border: '1px solid #E8E6E1' }}>
            <span className="text-sm" style={{ color: '#A3B1AA' }}>Best Streak</span>
            <p className="text-2xl font-heading font-light mt-1" style={{ color: '#2A3A35' }}>{stats?.best_streak || 0} days</p>
          </div>
        </div>

        {/* Urge Chart */}
        <div className="rounded-2xl p-6 shadow-sm" style={{ background: '#FFFFFF', border: '1px solid #E8E6E1' }}>
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-heading text-lg font-medium" style={{ color: '#2A3A35' }}>Urge Activity</h3>
            <Tabs value={period} onValueChange={setPeriod}>
              <TabsList className="rounded-lg p-1" style={{ background: '#F0EFEB' }}>
                <TabsTrigger data-testid="tab-weekly" value="weekly" className="rounded-md px-3 py-1 text-xs data-[state=active]:bg-white data-[state=active]:shadow-sm">Week</TabsTrigger>
                <TabsTrigger data-testid="tab-monthly" value="monthly" className="rounded-md px-3 py-1 text-xs data-[state=active]:bg-white data-[state=active]:shadow-sm">Month</TabsTrigger>
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
                <CartesianGrid strokeDasharray="3 3" stroke="#E8E6E1" vertical={false} />
                <XAxis dataKey={period === 'weekly' ? 'label' : 'date'} tick={{ fontSize: 12, fill: '#A3B1AA' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#A3B1AA' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="urges" stroke="#A4C3B2" fill="url(#urgeGradient)" strokeWidth={2} />
                <Area type="monotone" dataKey="resisted" stroke="#6B9080" fill="url(#resistGradient)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center">
              <p className="text-sm" style={{ color: '#A3B1AA' }}>No data yet. Start tracking your urges.</p>
            </div>
          )}
        </div>

        {/* Trigger Insights */}
        <div className="grid md:grid-cols-2 gap-4">
          <div className="rounded-2xl p-6 shadow-sm" style={{ background: '#FFFFFF', border: '1px solid #E8E6E1' }}>
            <h3 className="font-heading text-lg font-medium mb-4" style={{ color: '#2A3A35' }}>Top Triggers</h3>
            {triggerStats?.top_trigger && (
              <div className="mb-4 p-3 rounded-xl" style={{ background: '#A4C3B222' }}>
                <p className="text-sm font-medium" style={{ color: '#6B9080' }}>
                  <Target className="w-4 h-4 inline mr-1" strokeWidth={1.5} />
                  {triggerStats.top_trigger} is your #1 trigger
                </p>
              </div>
            )}
            <div className="space-y-3">
              {triggerStats?.triggers?.slice(0, 5).map((t, i) => {
                const maxCount = triggerStats.triggers[0]?.count || 1;
                return (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-sm w-24 truncate" style={{ color: '#7A8B85' }}>{t.name}</span>
                    <div className="flex-1 h-3 rounded-full overflow-hidden" style={{ background: '#F0EFEB' }}>
                      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${(t.count / maxCount) * 100}%`, background: '#6B9080' }} />
                    </div>
                    <span className="text-xs w-6 text-right" style={{ color: '#A3B1AA' }}>{t.count}</span>
                  </div>
                );
              })}
              {(!triggerStats?.triggers || triggerStats.triggers.length === 0) && (
                <p className="text-sm" style={{ color: '#A3B1AA' }}>No trigger data yet</p>
              )}
            </div>
          </div>

          <div className="rounded-2xl p-6 shadow-sm" style={{ background: '#FFFFFF', border: '1px solid #E8E6E1' }}>
            <h3 className="font-heading text-lg font-medium mb-4" style={{ color: '#2A3A35' }}>Peak Times</h3>
            {triggerStats?.peak_hour !== null && triggerStats?.peak_hour !== undefined && (
              <div className="mb-4 p-3 rounded-xl" style={{ background: '#E2D4C844' }}>
                <p className="text-sm font-medium" style={{ color: '#7A8B85' }}>
                  <Clock className="w-4 h-4 inline mr-1" strokeWidth={1.5} />
                  Most urges happen around {formatHour(triggerStats.peak_hour)}
                </p>
              </div>
            )}
            {triggerStats?.hours && triggerStats.hours.length > 0 ? (
              <ResponsiveContainer width="100%" height={150}>
                <BarChart data={triggerStats.hours}>
                  <XAxis dataKey="hour" tick={{ fontSize: 10, fill: '#A3B1AA' }} tickFormatter={formatHour} axisLine={false} tickLine={false} />
                  <Tooltip content={({ active, payload }) => active && payload?.length ? (
                    <div className="rounded-lg p-2 shadow" style={{ background: '#FFF', border: '1px solid #E8E6E1' }}>
                      <p className="text-xs" style={{ color: '#2A3A35' }}>{formatHour(payload[0]?.payload?.hour)}: {payload[0]?.value} urges</p>
                    </div>
                  ) : null} />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {triggerStats.hours.map((entry, i) => (
                      <Cell key={i} fill={entry.hour === triggerStats.peak_hour ? '#E5989B' : '#A4C3B2'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm" style={{ color: '#A3B1AA' }}>No time data yet</p>
            )}
          </div>
        </div>

        {/* Recent Urges */}
        <div className="rounded-2xl p-6 shadow-sm" style={{ background: '#FFFFFF', border: '1px solid #E8E6E1' }}>
          <h3 className="font-heading text-lg font-medium mb-4" style={{ color: '#2A3A35' }}>Recent Urges</h3>
          {urges.length > 0 ? (
            <div className="space-y-3">
              {urges.slice(0, 10).map((u, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-xl" style={{ background: '#F9F8F6' }}>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{
                      background: u.outcome === 'resisted' ? '#6B908033' : u.outcome === 'relapsed' ? '#E5989B33' : '#E2D4C844'
                    }}>
                      {u.outcome === 'resisted' ? <ArrowUp className="w-4 h-4" style={{ color: '#6B9080' }} strokeWidth={1.5} /> :
                       u.outcome === 'relapsed' ? <ArrowDown className="w-4 h-4" style={{ color: '#E5989B' }} strokeWidth={1.5} /> :
                       <Clock className="w-4 h-4" style={{ color: '#7A8B85' }} strokeWidth={1.5} />}
                    </div>
                    <div>
                      <p className="text-sm font-medium" style={{ color: '#2A3A35' }}>
                        {u.trigger || 'No trigger'} - {u.emotion || 'No emotion'}
                      </p>
                      <p className="text-xs" style={{ color: '#A3B1AA' }}>
                        {new Date(u.created_at).toLocaleDateString()} at {new Date(u.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs px-3 py-1 rounded-full font-medium" style={{
                    background: u.outcome === 'resisted' ? '#6B908022' : u.outcome === 'relapsed' ? '#E5989B22' : '#E2D4C844',
                    color: u.outcome === 'resisted' ? '#6B9080' : u.outcome === 'relapsed' ? '#E5989B' : '#7A8B85'
                  }}>
                    {u.outcome === 'resisted' ? 'Resisted' : u.outcome === 'relapsed' ? 'Slipped' : 'In Progress'}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-center py-8" style={{ color: '#A3B1AA' }}>No urges tracked yet. That's okay.</p>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
