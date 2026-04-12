import React, { useState, useEffect } from 'react';
import AppLayout from '../components/AppLayout';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import axios from 'axios';
import { Bell, User, Trash2, RefreshCw, Globe } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Switch } from '../components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const DAYS_KEYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const DAY_SHORT_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
const TRIGGER_KEYS = ['stress', 'boredom', 'loneliness', 'location', 'social', 'tiredness', 'habit_loop', 'other'];
const EMOTION_KEYS = ['anxious', 'sad', 'angry', 'frustrated', 'lonely', 'restless', 'numb', 'overwhelmed'];

export default function Settings() {
  const { user } = useAuth();
  const { t, lang, setLang } = useLanguage();
  const [reminders, setReminders] = useState({ enabled: true, times: ['09:00', '21:00'], days: DAYS_KEYS });
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
    }).catch((error) => { console.error('Failed to load settings:', error); });
  }, []);

  const saveReminders = async () => {
    setSaving(true);
    try { await axios.put(`${API}/reminders`, reminders, { withCredentials: true }); }
    catch (error) { console.error('Failed to save reminders:', error); }
    finally { setSaving(false); }
  };

  const toggleDay = (day) => {
    setReminders(prev => ({ ...prev, days: prev.days.includes(day) ? prev.days.filter(d => d !== day) : [...prev.days, day] }));
  };

  const addTime = () => setReminders(prev => ({ ...prev, times: [...prev.times, '12:00'] }));
  const updateTime = (index, value) => setReminders(prev => { const nt = [...prev.times]; nt[index] = value; return { ...prev, times: nt }; });
  const removeTime = (index) => setReminders(prev => ({ ...prev, times: prev.times.filter((_, i) => i !== index) }));

  const handleLogRelapse = async () => {
    try {
      const res = await axios.post(`${API}/relapses`, { trigger: relapseTrigger || null, emotion: relapseEmotion || null, notes: relapseNotes || null }, { withCredentials: true });
      setRelapses([res.data, ...relapses]);
      setRelapseDialogOpen(false); setRelapseTrigger(''); setRelapseEmotion(''); setRelapseNotes('');
    } catch (error) { console.error('Failed to log relapse:', error); }
  };

  return (
    <AppLayout>
      <div data-testid="settings-page" className="space-y-6 max-w-2xl">
        <div>
          <h1 className="font-heading text-4xl sm:text-5xl font-light tracking-tight" style={{ color: '#2A3A35' }}>{t('settings')}</h1>
          <p className="mt-2" style={{ color: '#7A8B85', fontFamily: 'Figtree, sans-serif' }}>{t('settings_subtitle')}</p>
        </div>

        {/* Language */}
        <div className="rounded-2xl p-6 shadow-sm" style={{ background: '#FFFFFF', border: '1px solid #E8E6E1' }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Globe className="w-5 h-5" style={{ color: '#6B9080' }} strokeWidth={1.5} />
              <h3 className="font-heading text-lg font-medium" style={{ color: '#2A3A35' }}>{t('language')}</h3>
            </div>
            <div className="flex gap-2">
              <button data-testid="lang-en" onClick={() => setLang('en')} className="px-4 py-2 rounded-full text-sm font-medium transition-all duration-200" style={{ background: lang === 'en' ? '#6B9080' : '#F0EFEB', color: lang === 'en' ? '#FFF' : '#7A8B85' }}>English</button>
              <button data-testid="lang-da" onClick={() => setLang('da')} className="px-4 py-2 rounded-full text-sm font-medium transition-all duration-200" style={{ background: lang === 'da' ? '#6B9080' : '#F0EFEB', color: lang === 'da' ? '#FFF' : '#7A8B85' }}>Dansk</button>
            </div>
          </div>
        </div>

        {/* Profile */}
        <div className="rounded-2xl p-6 shadow-sm" style={{ background: '#FFFFFF', border: '1px solid #E8E6E1' }}>
          <div className="flex items-center gap-3 mb-4">
            <User className="w-5 h-5" style={{ color: '#6B9080' }} strokeWidth={1.5} />
            <h3 className="font-heading text-lg font-medium" style={{ color: '#2A3A35' }}>{t('profile')}</h3>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-medium" style={{ background: '#A4C3B2', color: '#2A3A35' }}>
              {user?.picture ? <img src={user.picture} alt="" className="w-14 h-14 rounded-full object-cover" /> : user?.name?.[0]?.toUpperCase() || 'U'}
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
              <h3 className="font-heading text-lg font-medium" style={{ color: '#2A3A35' }}>{t('reminders')}</h3>
            </div>
            <Switch data-testid="reminders-toggle" checked={reminders.enabled} onCheckedChange={(checked) => setReminders(prev => ({ ...prev, enabled: checked }))} />
          </div>
          {reminders.enabled && (
            <div className="space-y-4">
              <div>
                <label className="text-sm mb-2 block" style={{ color: '#7A8B85' }}>{t('check_in_times')}</label>
                <div className="space-y-2">
                  {reminders.times.map((time, i) => (
                    <div key={`time-${i}-${time}`} className="flex items-center gap-2">
                      <Input data-testid={`reminder-time-${i}`} type="time" value={time} onChange={e => updateTime(i, e.target.value)} className="rounded-xl flex-1" style={{ border: '1px solid #E8E6E1' }} />
                      <button onClick={() => removeTime(i)} className="p-2 rounded-lg" style={{ color: '#A3B1AA' }}><Trash2 className="w-4 h-4" strokeWidth={1.5} /></button>
                    </div>
                  ))}
                  <button data-testid="add-reminder-time" onClick={addTime} className="text-sm font-medium flex items-center gap-1" style={{ color: '#6B9080' }}>{t('add_time')}</button>
                </div>
              </div>
              <div>
                <label className="text-sm mb-2 block" style={{ color: '#7A8B85' }}>{t('active_days')}</label>
                <div className="flex flex-wrap gap-2">
                  {DAYS_KEYS.map((day, i) => (
                    <button key={day} data-testid={`day-${day.toLowerCase()}`} onClick={() => toggleDay(day)}
                      className="px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200"
                      style={{ background: reminders.days.includes(day) ? '#6B9080' : '#F0EFEB', color: reminders.days.includes(day) ? '#FFFFFF' : '#7A8B85' }}>
                      {t(DAY_SHORT_KEYS[i])}
                    </button>
                  ))}
                </div>
              </div>
              <Button data-testid="save-reminders-btn" onClick={saveReminders} disabled={saving} className="rounded-full text-white font-medium" style={{ background: '#6B9080' }}>{saving ? t('saving') : t('save_reminders')}</Button>
            </div>
          )}
        </div>

        {/* Relapse Recovery */}
        <div className="rounded-2xl p-6 shadow-sm" style={{ background: '#FFFFFF', border: '1px solid #E8E6E1' }}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <RefreshCw className="w-5 h-5" style={{ color: '#6B9080' }} strokeWidth={1.5} />
              <h3 className="font-heading text-lg font-medium" style={{ color: '#2A3A35' }}>{t('recovery_log')}</h3>
            </div>
            <Dialog open={relapseDialogOpen} onOpenChange={setRelapseDialogOpen}>
              <DialogTrigger asChild>
                <Button data-testid="log-relapse-btn" variant="outline" className="rounded-full text-sm" style={{ border: '1px solid #E8E6E1', color: '#7A8B85' }}>{t('log_a_slip')}</Button>
              </DialogTrigger>
              <DialogContent className="rounded-2xl" style={{ border: '1px solid #E8E6E1' }}>
                <DialogHeader><DialogTitle className="font-heading text-xl" style={{ color: '#2A3A35' }}>{t('slip_title')}</DialogTitle></DialogHeader>
                <div className="space-y-4 mt-2">
                  <p className="text-sm" style={{ color: '#7A8B85', fontFamily: 'Figtree, sans-serif' }}>{t('slip_desc')}</p>
                  <Select value={relapseTrigger} onValueChange={setRelapseTrigger}>
                    <SelectTrigger data-testid="relapse-trigger-select" className="rounded-xl" style={{ border: '1px solid #E8E6E1' }}><SelectValue placeholder={t('what_triggered')} /></SelectTrigger>
                    <SelectContent>{TRIGGER_KEYS.map(k => <SelectItem key={k} value={t(k)}>{t(k)}</SelectItem>)}</SelectContent>
                  </Select>
                  <Select value={relapseEmotion} onValueChange={setRelapseEmotion}>
                    <SelectTrigger data-testid="relapse-emotion-select" className="rounded-xl" style={{ border: '1px solid #E8E6E1' }}><SelectValue placeholder={t('how_feeling')} /></SelectTrigger>
                    <SelectContent>{EMOTION_KEYS.map(k => <SelectItem key={k} value={t(k)}>{t(k)}</SelectItem>)}</SelectContent>
                  </Select>
                  <Textarea data-testid="relapse-notes" value={relapseNotes} onChange={e => setRelapseNotes(e.target.value)} placeholder={t('any_reflections')} className="rounded-xl resize-none" style={{ border: '1px solid #E8E6E1' }} rows={3} />
                  <Button data-testid="save-relapse-btn" onClick={handleLogRelapse} className="w-full rounded-full text-white font-medium h-11" style={{ background: '#6B9080' }}>{t('log_reset_streak')}</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          {relapses.length > 0 ? (
            <div className="space-y-3">
              {relapses.slice(0, 5).map((r) => (
                <div key={r.relapse_id} className="p-3 rounded-xl" style={{ background: '#F9F8F6' }}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium" style={{ color: '#2A3A35' }}>{r.trigger || t('unknown_trigger')} - {r.emotion || t('unknown_emotion')}</p>
                      <p className="text-xs mt-1" style={{ color: '#A3B1AA' }}>{new Date(r.created_at).toLocaleDateString()}</p>
                    </div>
                    <span className="text-xs px-3 py-1 rounded-full" style={{ background: '#E2D4C844', color: '#7A8B85' }}>{t('recovery_point')}</span>
                  </div>
                  {r.notes && <p className="text-xs mt-2 italic" style={{ color: '#7A8B85' }}>{r.notes}</p>}
                </div>
              ))}
            </div>
          ) : <p className="text-sm" style={{ color: '#A3B1AA' }}>{t('no_slips')}</p>}
        </div>
      </div>
    </AppLayout>
  );
}
