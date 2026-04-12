import React, { useState, useEffect } from 'react';
import AppLayout from '../components/AppLayout';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { Settings as SettingsIcon, Bell, User, Clock, Trash2, RefreshCw } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Switch } from '../components/ui/switch';
import { Label } from '../components/ui/label';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter
} from '../components/ui/dialog';
import { Textarea } from '../components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '../components/ui/select';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function Settings() {
  const { user } = useAuth();
  const [reminders, setReminders] = useState({ enabled: true, times: ['09:00', '21:00'], days: DAYS });
  const [relapseDialogOpen, setRelapseDialogOpen] = useState(false);
  const [relapseTrigger, setRelapseTrigger] = useState('');
  const [relapseEmotion, setRelapseEmotion] = useState('');
  const [relapseNotes, setRelapseNotes] = useState('');
  const [relapses, setRelapses] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([
      axios.get(`${API}/reminders`, { withCredentials: true }),
      axios.get(`${API}/relapses`, { withCredentials: true }),
    ]).then(([remRes, relRes]) => {
      setReminders(remRes.data);
      setRelapses(relRes.data);
    }).catch(() => {});
  }, []);

  const saveReminders = async () => {
    setSaving(true);
    try {
      await axios.put(`${API}/reminders`, reminders, { withCredentials: true });
    } catch {} finally {
      setSaving(false);
    }
  };

  const toggleDay = (day) => {
    setReminders(prev => ({
      ...prev,
      days: prev.days.includes(day) ? prev.days.filter(d => d !== day) : [...prev.days, day]
    }));
  };

  const addTime = () => {
    setReminders(prev => ({ ...prev, times: [...prev.times, '12:00'] }));
  };

  const updateTime = (index, value) => {
    setReminders(prev => {
      const newTimes = [...prev.times];
      newTimes[index] = value;
      return { ...prev, times: newTimes };
    });
  };

  const removeTime = (index) => {
    setReminders(prev => ({ ...prev, times: prev.times.filter((_, i) => i !== index) }));
  };

  const handleLogRelapse = async () => {
    try {
      const res = await axios.post(`${API}/relapses`, {
        trigger: relapseTrigger || null,
        emotion: relapseEmotion || null,
        notes: relapseNotes || null
      }, { withCredentials: true });
      setRelapses([res.data, ...relapses]);
      setRelapseDialogOpen(false);
      setRelapseTrigger('');
      setRelapseEmotion('');
      setRelapseNotes('');
    } catch {}
  };

  return (
    <AppLayout>
      <div data-testid="settings-page" className="space-y-6 max-w-2xl">
        <div>
          <h1 className="font-heading text-4xl sm:text-5xl font-light tracking-tight" style={{ color: '#2A3A35' }}>
            Settings
          </h1>
          <p className="mt-2" style={{ color: '#7A8B85', fontFamily: 'Figtree, sans-serif' }}>
            Manage your preferences and recovery tools
          </p>
        </div>

        {/* Profile */}
        <div className="rounded-2xl p-6 shadow-sm" style={{ background: '#FFFFFF', border: '1px solid #E8E6E1' }}>
          <div className="flex items-center gap-3 mb-4">
            <User className="w-5 h-5" style={{ color: '#6B9080' }} strokeWidth={1.5} />
            <h3 className="font-heading text-lg font-medium" style={{ color: '#2A3A35' }}>Profile</h3>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-medium" style={{ background: '#A4C3B2', color: '#2A3A35' }}>
              {user?.picture ? (
                <img src={user.picture} alt="" className="w-14 h-14 rounded-full object-cover" />
              ) : (
                user?.name?.[0]?.toUpperCase() || 'U'
              )}
            </div>
            <div>
              <p className="font-medium" style={{ color: '#2A3A35' }}>{user?.name}</p>
              <p className="text-sm" style={{ color: '#A3B1AA' }}>{user?.email}</p>
            </div>
          </div>
        </div>

        {/* Reminders */}
        <div className="rounded-2xl p-6 shadow-sm" style={{ background: '#FFFFFF', border: '1px solid #E8E6E1' }}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5" style={{ color: '#6B9080' }} strokeWidth={1.5} />
              <h3 className="font-heading text-lg font-medium" style={{ color: '#2A3A35' }}>Reminders</h3>
            </div>
            <Switch
              data-testid="reminders-toggle"
              checked={reminders.enabled}
              onCheckedChange={(checked) => setReminders(prev => ({ ...prev, enabled: checked }))}
            />
          </div>

          {reminders.enabled && (
            <div className="space-y-4">
              <div>
                <label className="text-sm mb-2 block" style={{ color: '#7A8B85' }}>Check-in Times</label>
                <div className="space-y-2">
                  {reminders.times.map((time, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <Input
                        data-testid={`reminder-time-${i}`}
                        type="time"
                        value={time}
                        onChange={e => updateTime(i, e.target.value)}
                        className="rounded-xl flex-1"
                        style={{ border: '1px solid #E8E6E1' }}
                      />
                      <button onClick={() => removeTime(i)} className="p-2 rounded-lg" style={{ color: '#A3B1AA' }}>
                        <Trash2 className="w-4 h-4" strokeWidth={1.5} />
                      </button>
                    </div>
                  ))}
                  <button
                    data-testid="add-reminder-time"
                    onClick={addTime}
                    className="text-sm font-medium flex items-center gap-1"
                    style={{ color: '#6B9080' }}
                  >
                    + Add time
                  </button>
                </div>
              </div>

              <div>
                <label className="text-sm mb-2 block" style={{ color: '#7A8B85' }}>Active Days</label>
                <div className="flex flex-wrap gap-2">
                  {DAYS.map(day => (
                    <button
                      key={day}
                      data-testid={`day-${day.toLowerCase()}`}
                      onClick={() => toggleDay(day)}
                      className="px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200"
                      style={{
                        background: reminders.days.includes(day) ? '#6B9080' : '#F0EFEB',
                        color: reminders.days.includes(day) ? '#FFFFFF' : '#7A8B85'
                      }}
                    >
                      {day.slice(0, 3)}
                    </button>
                  ))}
                </div>
              </div>

              <Button
                data-testid="save-reminders-btn"
                onClick={saveReminders}
                disabled={saving}
                className="rounded-full text-white font-medium"
                style={{ background: '#6B9080' }}
              >
                {saving ? 'Saving...' : 'Save Reminders'}
              </Button>
            </div>
          )}
        </div>

        {/* Relapse Recovery */}
        <div className="rounded-2xl p-6 shadow-sm" style={{ background: '#FFFFFF', border: '1px solid #E8E6E1' }}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <RefreshCw className="w-5 h-5" style={{ color: '#6B9080' }} strokeWidth={1.5} />
              <h3 className="font-heading text-lg font-medium" style={{ color: '#2A3A35' }}>Recovery Log</h3>
            </div>
            <Dialog open={relapseDialogOpen} onOpenChange={setRelapseDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  data-testid="log-relapse-btn"
                  variant="outline"
                  className="rounded-full text-sm"
                  style={{ border: '1px solid #E8E6E1', color: '#7A8B85' }}
                >
                  Log a Slip
                </Button>
              </DialogTrigger>
              <DialogContent className="rounded-2xl" style={{ border: '1px solid #E8E6E1' }}>
                <DialogHeader>
                  <DialogTitle className="font-heading text-xl" style={{ color: '#2A3A35' }}>
                    You slipped. Let's reset.
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-2">
                  <p className="text-sm" style={{ color: '#7A8B85', fontFamily: 'Figtree, sans-serif' }}>
                    A slip isn't a failure. It's a moment of learning. What happened?
                  </p>
                  <Select value={relapseTrigger} onValueChange={setRelapseTrigger}>
                    <SelectTrigger data-testid="relapse-trigger-select" className="rounded-xl" style={{ border: '1px solid #E8E6E1' }}>
                      <SelectValue placeholder="What triggered it?" />
                    </SelectTrigger>
                    <SelectContent>
                      {['Stress', 'Boredom', 'Loneliness', 'Location', 'Social', 'Tiredness', 'Habit Loop', 'Other'].map(t => (
                        <SelectItem key={t} value={t}>{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={relapseEmotion} onValueChange={setRelapseEmotion}>
                    <SelectTrigger data-testid="relapse-emotion-select" className="rounded-xl" style={{ border: '1px solid #E8E6E1' }}>
                      <SelectValue placeholder="How were you feeling?" />
                    </SelectTrigger>
                    <SelectContent>
                      {['Anxious', 'Sad', 'Angry', 'Frustrated', 'Lonely', 'Restless', 'Numb', 'Overwhelmed'].map(e => (
                        <SelectItem key={e} value={e}>{e}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Textarea
                    data-testid="relapse-notes"
                    value={relapseNotes}
                    onChange={e => setRelapseNotes(e.target.value)}
                    placeholder="Any reflections..."
                    className="rounded-xl resize-none"
                    style={{ border: '1px solid #E8E6E1' }}
                    rows={3}
                  />
                  <Button
                    data-testid="save-relapse-btn"
                    onClick={handleLogRelapse}
                    className="w-full rounded-full text-white font-medium h-11"
                    style={{ background: '#6B9080' }}
                  >
                    Log & Reset My Streak
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {relapses.length > 0 ? (
            <div className="space-y-3">
              {relapses.slice(0, 5).map((r, i) => (
                <div key={i} className="p-3 rounded-xl" style={{ background: '#F9F8F6' }}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium" style={{ color: '#2A3A35' }}>
                        {r.trigger || 'Unknown trigger'} - {r.emotion || 'Unknown emotion'}
                      </p>
                      <p className="text-xs mt-1" style={{ color: '#A3B1AA' }}>
                        {new Date(r.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <span className="text-xs px-3 py-1 rounded-full" style={{ background: '#E2D4C844', color: '#7A8B85' }}>
                      Recovery point
                    </span>
                  </div>
                  {r.notes && <p className="text-xs mt-2 italic" style={{ color: '#7A8B85' }}>{r.notes}</p>}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm" style={{ color: '#A3B1AA' }}>No slips recorded. Keep going strong.</p>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
