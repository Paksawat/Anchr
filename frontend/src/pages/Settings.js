import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '../components/AppLayout';
import UpgradePrompt from '../components/UpgradePrompt';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import axios from 'axios';
import {
  Bell,
  User,
  Trash2,
  Globe,
  Users,
  AlertCircle,
  Shield,
  Download,
  ChevronDown,
  ChevronUp,
  Lock,
  Eye,
  EyeOff,
  Check,
  X,
  Smartphone,
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Switch } from '../components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../components/ui/dialog';
import { scheduleReminderNotifications } from '../hooks/useNotifications';
import { useInstallPrompt } from '../hooks/useInstallPrompt';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';

const API = `/api`;
const DAYS_KEYS = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];
const DAY_SHORT_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

export default function Settings() {
  const { user, setUser } = useAuth();
  const { t, lang, setLang } = useLanguage();
  const navigate = useNavigate();
  const { showBanner, isIOS, isAndroid, install, dismiss: dismissInstall } = useInstallPrompt();
  const [reminders, setReminders] = useState({
    enabled: true,
    times: ['09:00', '21:00'],
    days: DAYS_KEYS,
  });
  const [saving, setSaving] = useState(false);
  const [reminderSaved, setReminderSaved] = useState(false);
  const [urgeSaving, setUrgeSaving] = useState(false);
  const [urgeSaved, setUrgeSaved] = useState(false);
  const [urgeTypes, setUrgeTypes] = useState([]);
  const [selectedUrgeType, setSelectedUrgeType] = useState(
    user?.urge_type || '',
  );
  const [customUrge, setCustomUrge] = useState(user?.custom_urge_type || '');
  const [buddies, setBuddies] = useState([]);
  const [buddyDialogOpen, setBuddyDialogOpen] = useState(false);
  const [buddyName, setBuddyName] = useState('');
  const [buddyEmail, setBuddyEmail] = useState('');
  const [buddyPhone, setBuddyPhone] = useState('');
  const [buddyRelation, setBuddyRelation] = useState('');
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [deleteDataDialogOpen, setDeleteDataDialogOpen] = useState(false);
  const [deleteAccountDialogOpen, setDeleteAccountDialogOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [exporting, setExporting] = useState(false);
  // Change password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [changePwLoading, setChangePwLoading] = useState(false);
  const [changePwError, setChangePwError] = useState('');
  const [changePwDone, setChangePwDone] = useState(false);
  // Notification permission state — re-evaluated on mount and after permission request
  const [notifPermission, setNotifPermission] = useState(
    'Notification' in window ? Notification.permission : 'unsupported',
  );
  const isPaid = user?.tier === 'paid';

  useEffect(() => {
    Promise.all([
      axios.get(`${API}/reminders`, { withCredentials: true }),
      axios.get(`${API}/urge-types`, { withCredentials: true }),
      axios.get(`${API}/buddies`, { withCredentials: true }),
    ])
      .then(([remRes, utRes, bRes]) => {
        setReminders(remRes.data);
        setUrgeTypes(utRes.data);
        setBuddies(bRes.data);
        // Re-schedule on every page open — keeps SW timers fresh
        scheduleReminderNotifications(remRes.data);
      })
      .catch((error) => {
        console.error('Failed to load settings:', error);
      });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const saveReminders = async () => {
    setSaving(true);
    setReminderSaved(false);
    try {
      await axios.put(`${API}/reminders`, reminders, { withCredentials: true });
      setReminderSaved(true);
      setTimeout(() => setReminderSaved(false), 3000);
      // Schedule OS notifications for today's remaining reminder times
      scheduleReminderNotifications(reminders);
    } catch (error) {
      console.error('Failed to save reminders:', error);
    } finally {
      setSaving(false);
    }
  };

  const requestNotificationPermission = useCallback(async () => {
    if (!('Notification' in window)) return;
    const result = await Notification.requestPermission();
    setNotifPermission(result);
    // If just granted, schedule today's reminders immediately
    if (result === 'granted') scheduleReminderNotifications(reminders);
  }, [reminders]);

  const saveUrgeType = async () => {
    setUrgeSaving(true);
    setUrgeSaved(false);
    try {
      const res = await axios.put(
        `${API}/profile`,
        {
          urge_type: selectedUrgeType,
          custom_urge_type: selectedUrgeType === 'other' ? customUrge : null,
        },
        { withCredentials: true },
      );
      setUser((prev) => ({ ...prev, ...res.data }));
      setUrgeSaved(true);
      setTimeout(() => setUrgeSaved(false), 3000);
    } catch (error) {
      console.error('Failed to save urge type:', error);
    } finally {
      setUrgeSaving(false);
    }
  };

  const toggleDay = (day) =>
    setReminders((prev) => ({
      ...prev,
      days: prev.days.includes(day)
        ? prev.days.filter((d) => d !== day)
        : [...prev.days, day],
    }));
  const addTime = () =>
    setReminders((prev) => ({ ...prev, times: [...prev.times, '12:00'] }));
  const updateTime = (index, value) =>
    setReminders((prev) => {
      const nt = [...prev.times];
      nt[index] = value;
      return { ...prev, times: nt };
    });
  const removeTime = (index) =>
    setReminders((prev) => ({
      ...prev,
      times: prev.times.filter((_, i) => i !== index),
    }));

  const addBuddy = async () => {
    if (!buddyName.trim()) return;
    try {
      const res = await axios.post(
        `${API}/buddies`,
        {
          name: buddyName,
          email: buddyEmail || null,
          phone: buddyPhone || null,
          relationship: buddyRelation || null,
        },
        { withCredentials: true },
      );
      setBuddies([...buddies, res.data]);
      setBuddyDialogOpen(false);
      setBuddyName('');
      setBuddyEmail('');
      setBuddyPhone('');
      setBuddyRelation('');
    } catch (error) {
      console.error('Failed to add buddy:', error);
    }
  };

  const alertBuddy = async (buddyId) => {
    try {
      const res = await axios.post(
        `${API}/buddies/${buddyId}/alert`,
        {},
        { withCredentials: true },
      );
      alert(res.data.message);
    } catch (error) {
      console.error('Failed to alert buddy:', error);
    }
  };

  const deleteBuddy = async (buddyId) => {
    try {
      await axios.delete(`${API}/buddies/${buddyId}`, {
        withCredentials: true,
      });
      setBuddies(buddies.filter((b) => b.buddy_id !== buddyId));
    } catch (error) {
      console.error('Failed to delete buddy:', error);
    }
  };

  const handleExportData = async () => {
    setExporting(true);
    try {
      const res = await axios.get(`${API}/export`, { withCredentials: true, responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/json' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = 'anchr_data.json';
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export data:', error);
    } finally {
      setExporting(false);
    }
  };

  const handleDeleteData = async () => {
    setDeleting(true);
    try {
      await axios.delete(`${API}/data`, { withCredentials: true });
      setDeleteDataDialogOpen(false);
      setDeleteConfirmText('');
      setRelapses([]);
    } catch (error) {
      console.error('Failed to delete data:', error);
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      await axios.delete(`${API}/account`, { withCredentials: true });
      setUser(null);
      navigate('/');
    } catch (error) {
      console.error('Failed to delete account:', error);
      setDeleting(false);
    }
  };

  const isNewPasswordValid = (pw) => pw.length >= 6 && /\d/.test(pw);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setChangePwError('');
    if (!isNewPasswordValid(newPassword)) {
      setChangePwError(t('password_invalid'));
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setChangePwError(t('passwords_no_match'));
      return;
    }
    setChangePwLoading(true);
    try {
      await axios.put(`${API}/auth/change-password`, { current_password: currentPassword, new_password: newPassword }, { withCredentials: true });
      setChangePwDone(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      setTimeout(() => setChangePwDone(false), 4000);
    } catch (err) {
      setChangePwError(err.response?.data?.detail || 'Something went wrong');
    } finally {
      setChangePwLoading(false);
    }
  };

  return (
    <AppLayout>
      <div data-testid="settings-page" className="space-y-6 max-w-2xl">
        <div>
          <h1
            className="font-heading text-4xl sm:text-5xl font-light tracking-tight"
            style={{ color: '#2A3A35' }}
          >
            {t('settings')}
          </h1>
          <p
            className="mt-2"
            style={{ color: '#7A8B85', fontFamily: 'Figtree, sans-serif' }}
          >
            {t('settings_subtitle')}
          </p>
        </div>

        {/* Install banner — only shown when app is not already installed */}
        {showBanner && (
          <div
            className="rounded-2xl p-5 flex items-center gap-4"
            style={{ background: '#2A3A35', border: '1px solid #2A3A3533' }}
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: '#6B9080' }}
            >
              <Smartphone className="w-5 h-5 text-white" strokeWidth={1.5} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium" style={{ color: '#FFFFFF' }}>
                Install Anchr
              </p>
              <p className="text-xs mt-0.5 leading-relaxed" style={{ color: '#A4C3B2' }}>
                {isIOS
                  ? 'Tap Share → "Add to Home Screen" in Safari for reliable notifications'
                  : 'Install to your home screen for reliable notifications'}
              </p>
            </div>
            {isAndroid && (
              <button
                onClick={async () => { const ok = await install(); if (ok) dismissInstall(); }}
                className="shrink-0 px-4 py-2 rounded-full text-xs font-semibold transition-opacity active:opacity-75"
                style={{ background: '#6B9080', color: '#FFFFFF' }}
              >
                Install
              </button>
            )}
            {isIOS && (
              <button
                onClick={dismissInstall}
                className="shrink-0 p-1.5 rounded-lg transition-opacity active:opacity-75"
                style={{ color: '#A4C3B2' }}
                aria-label="Dismiss"
              >
                <X className="w-4 h-4" strokeWidth={2} />
              </button>
            )}
          </div>
        )}

        {/* Disclaimer */}
        <div className="rounded-2xl p-5 flex items-start gap-3" style={{ background: '#FDF2F2', border: '1px solid #E5989B33' }}>
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" style={{ color: '#E5989B' }} strokeWidth={1.5} />
          <p className="text-sm leading-relaxed" style={{ color: '#7A8B85' }}>
            {t('disclaimer_text')}
          </p>
        </div>

        {/* Language */}
        <div
          className="rounded-2xl p-6 shadow-sm"
          style={{ background: '#FFFFFF', border: '1px solid #E8E6E1' }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Globe
                className="w-5 h-5"
                style={{ color: '#6B9080' }}
                strokeWidth={1.5}
              />
              <h3
                className="font-heading text-lg font-medium"
                style={{ color: '#2A3A35' }}
              >
                {t('language')}
              </h3>
            </div>
            <div className="flex gap-2">
              <button
                data-testid="lang-en"
                onClick={() => setLang('en')}
                className="px-4 py-2 rounded-full text-sm font-medium transition-all"
                style={{
                  background: lang === 'en' ? '#6B9080' : '#F0EFEB',
                  color: lang === 'en' ? '#FFF' : '#7A8B85',
                }}
              >
                English
              </button>
              <button
                data-testid="lang-da"
                onClick={() => setLang('da')}
                className="px-4 py-2 rounded-full text-sm font-medium transition-all"
                style={{
                  background: lang === 'da' ? '#6B9080' : '#F0EFEB',
                  color: lang === 'da' ? '#FFF' : '#7A8B85',
                }}
              >
                Dansk
              </button>
            </div>
          </div>
        </div>

        {/* Urge Type */}
        <div
          className="rounded-2xl p-6 shadow-sm"
          style={{ background: '#FFFFFF', border: '1px solid #E8E6E1' }}
        >
          <div className="flex items-center gap-3 mb-4">
            <Shield
              className="w-5 h-5"
              style={{ color: '#6B9080' }}
              strokeWidth={1.5}
            />
            <h3
              className="font-heading text-lg font-medium"
              style={{ color: '#2A3A35' }}
            >
              {t('what_im_working_on')}
            </h3>
          </div>
          <div className="grid grid-cols-3 gap-2 mb-3">
            {urgeTypes.filter((ut) => ut.id !== 'other').map((ut) => (
              <button
                key={ut.id}
                data-testid={`setting-urge-${ut.id}`}
                onClick={() => { setSelectedUrgeType(ut.id); setCustomUrge(''); }}
                className="p-3 rounded-xl text-xs font-medium text-center transition-all"
                style={{
                  background: selectedUrgeType === ut.id ? '#6B908015' : '#F9F8F6',
                  border: selectedUrgeType === ut.id ? '2px solid #6B9080' : '1px solid #E8E6E1',
                  color: selectedUrgeType === ut.id ? '#6B9080' : '#7A8B85',
                }}
              >
                {t('urge_' + ut.id)}
              </button>
            ))}
            {/* Saved custom urge as its own pill */}
            {user?.custom_urge_type && (
              <button
                data-testid="setting-urge-custom"
                onClick={() => { setSelectedUrgeType('other'); setCustomUrge(user.custom_urge_type); }}
                className="p-3 rounded-xl text-xs font-medium text-center transition-all"
                style={{
                  background: selectedUrgeType === 'other' && customUrge === user.custom_urge_type ? '#E2D4C833' : '#F9F8F6',
                  border: selectedUrgeType === 'other' && customUrge === user.custom_urge_type ? '2px solid #C9A87C' : '1px solid #E8E6E1',
                  color: selectedUrgeType === 'other' && customUrge === user.custom_urge_type ? '#C9A87C' : '#7A8B85',
                }}
              >
                {user.custom_urge_type}
              </button>
            )}
            {/* Add new custom */}
            <button
              data-testid="setting-urge-other"
              onClick={() => { setSelectedUrgeType('other'); setCustomUrge(''); }}
              className="p-3 rounded-xl text-xs font-medium text-center transition-all"
              style={{
                background: selectedUrgeType === 'other' && !customUrge ? '#6B908015' : '#F9F8F6',
                border: selectedUrgeType === 'other' && !customUrge ? '2px solid #6B9080' : '1px dashed #C8D5CF',
                color: selectedUrgeType === 'other' && !customUrge ? '#6B9080' : '#A3B1AA',
              }}
            >
              + {t('urge_other')}
            </button>
          </div>
          {selectedUrgeType === 'other' && (
            <Input
              data-testid="custom-urge-settings"
              value={customUrge}
              onChange={(e) => setCustomUrge(e.target.value)}
              placeholder="Describe your urge..."
              className="rounded-xl mb-3"
              style={{ border: '1px solid #E8E6E1' }}
            />
          )}
          <div className="flex items-center gap-3">
            <Button
              data-testid="save-urge-type"
              onClick={saveUrgeType}
              disabled={urgeSaving}
              className="rounded-full text-white font-medium text-sm"
              style={{ background: urgeSaved ? '#4A7A6A' : '#6B9080' }}
            >
              {urgeSaving ? t('saving') : urgeSaved ? t('saved') : t('save')}
            </Button>
            {urgeSaved && (
              <span className="text-sm font-medium" style={{ color: '#6B9080' }}>
                ✓ {t('changes_saved')}
              </span>
            )}
          </div>
        </div>

        {/* Profile */}
        <div
          className="rounded-2xl p-6 shadow-sm"
          style={{ background: '#FFFFFF', border: '1px solid #E8E6E1' }}
        >
          <div className="flex items-center gap-3 mb-4">
            <User
              className="w-5 h-5"
              style={{ color: '#6B9080' }}
              strokeWidth={1.5}
            />
            <h3
              className="font-heading text-lg font-medium"
              style={{ color: '#2A3A35' }}
            >
              {t('profile')}
            </h3>
          </div>
          <div className="flex items-center gap-4">
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-medium"
              style={{ background: '#A4C3B2', color: '#2A3A35' }}
            >
              {user?.picture ? (
                <img
                  src={user.picture}
                  alt=""
                  className="w-14 h-14 rounded-full object-cover"
                />
              ) : (
                user?.name?.[0]?.toUpperCase() || 'U'
              )}
            </div>
            <div>
              <p className="font-medium" style={{ color: '#2A3A35' }}>
                {user?.name}
              </p>
              <p className="text-sm" style={{ color: '#A3B1AA' }}>
                {user?.email}
              </p>
              <span
                className="text-xs px-2 py-0.5 rounded-full mt-1 inline-block"
                style={{
                  background: isPaid ? '#6B908022' : '#F0EFEB',
                  color: isPaid ? '#6B9080' : '#A3B1AA',
                }}
              >
                {isPaid ? 'Pro' : 'Free'}
              </span>
            </div>
          </div>
        </div>

        {/* Buddy System (Paid) */}
        <div
          className="rounded-2xl p-6 shadow-sm"
          style={{ background: '#FFFFFF', border: '1px solid #E8E6E1' }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Users
                className="w-5 h-5"
                style={{ color: '#6B9080' }}
                strokeWidth={1.5}
              />
              <h3
                className="font-heading text-lg font-medium"
                style={{ color: '#2A3A35' }}
              >
                Accountability Buddy
              </h3>
            </div>
            {isPaid && (
              <Dialog open={buddyDialogOpen} onOpenChange={setBuddyDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    data-testid="add-buddy-btn"
                    variant="outline"
                    className="rounded-full text-sm"
                    style={{ border: '1px solid #E8E6E1', color: '#7A8B85' }}
                  >
                    Add Buddy
                  </Button>
                </DialogTrigger>
                <DialogContent
                  className="rounded-2xl"
                  style={{ border: '1px solid #E8E6E1' }}
                >
                  <DialogHeader>
                    <DialogTitle
                      className="font-heading text-xl"
                      style={{ color: '#2A3A35' }}
                    >
                      Add a Buddy
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-3 mt-4">
                    <p className="text-sm" style={{ color: '#7A8B85' }}>
                      Add someone you trust. They can be notified if you're
                      struggling.
                    </p>
                    <Input
                      data-testid="buddy-name"
                      value={buddyName}
                      onChange={(e) => setBuddyName(e.target.value)}
                      placeholder="Name"
                      className="rounded-xl"
                      style={{ border: '1px solid #E8E6E1' }}
                    />
                    <Input
                      data-testid="buddy-email"
                      value={buddyEmail}
                      onChange={(e) => setBuddyEmail(e.target.value)}
                      placeholder="Email (optional)"
                      className="rounded-xl"
                      style={{ border: '1px solid #E8E6E1' }}
                    />
                    <Input
                      data-testid="buddy-phone"
                      value={buddyPhone}
                      onChange={(e) => setBuddyPhone(e.target.value)}
                      placeholder="Phone (optional)"
                      className="rounded-xl"
                      style={{ border: '1px solid #E8E6E1' }}
                    />
                    <Input
                      data-testid="buddy-relation"
                      value={buddyRelation}
                      onChange={(e) => setBuddyRelation(e.target.value)}
                      placeholder="Relationship (friend, partner, sponsor...)"
                      className="rounded-xl"
                      style={{ border: '1px solid #E8E6E1' }}
                    />
                    <Button
                      data-testid="save-buddy"
                      onClick={addBuddy}
                      disabled={!buddyName.trim()}
                      className="w-full rounded-full text-white font-medium h-11"
                      style={{ background: '#6B9080' }}
                    >
                      Add Buddy
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
          {isPaid ? (
            buddies.length > 0 ? (
              <div className="space-y-3">
                {buddies.map((b) => (
                  <div
                    key={b.buddy_id}
                    className="flex items-center justify-between p-4 rounded-xl"
                    style={{ background: '#F9F8F6' }}
                  >
                    <div>
                      <p
                        className="text-sm font-medium"
                        style={{ color: '#2A3A35' }}
                      >
                        {b.name}
                      </p>
                      <p className="text-xs" style={{ color: '#A3B1AA' }}>
                        {b.relationship || 'Contact'}{' '}
                        {b.email && `- ${b.email}`}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        data-testid={`alert-buddy-${b.buddy_id}`}
                        onClick={() => alertBuddy(b.buddy_id)}
                        variant="outline"
                        className="rounded-full text-xs px-3 h-8"
                        style={{
                          border: '1px solid #E5989B44',
                          color: '#E5989B',
                        }}
                      >
                        <AlertCircle
                          className="w-3 h-3 mr-1"
                          strokeWidth={1.5}
                        />{' '}
                        Alert
                      </Button>
                      <button
                        onClick={() => deleteBuddy(b.buddy_id)}
                        className="p-1.5 rounded-lg"
                        style={{ color: '#A3B1AA' }}
                      >
                        <Trash2 className="w-3.5 h-3.5" strokeWidth={1.5} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm" style={{ color: '#A3B1AA' }}>
                No buddies added yet. Add someone you trust for accountability.
              </p>
            )
          ) : (
            <UpgradePrompt feature="Accountability Buddy">
              <div className="p-4 rounded-xl" style={{ background: '#F9F8F6' }}>
                <p className="text-sm" style={{ color: '#7A8B85' }}>
                  Connect with someone who can support you when things get
                  tough.
                </p>
              </div>
            </UpgradePrompt>
          )}
        </div>

        {/* Reminders */}
        <div
          className="rounded-2xl p-6 shadow-sm"
          style={{ background: '#FFFFFF', border: '1px solid #E8E6E1' }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Bell
                className="w-5 h-5"
                style={{ color: '#6B9080' }}
                strokeWidth={1.5}
              />
              <h3
                className="font-heading text-lg font-medium"
                style={{ color: '#2A3A35' }}
              >
                {t('reminders')}
              </h3>
            </div>
            <Switch
              data-testid="reminders-toggle"
              checked={reminders.enabled}
              onCheckedChange={(checked) =>
                setReminders((prev) => ({ ...prev, enabled: checked }))
              }
            />
          </div>
          {reminders.enabled && (
            <div className="space-y-4">
              <div>
                <label
                  className="text-sm mb-2 block"
                  style={{ color: '#7A8B85' }}
                >
                  {t('check_in_times')}
                </label>
                <div className="space-y-2">
                  {reminders.times.map((time, i) => (
                    <div
                      key={`time-${i}-${time}`}
                      className="flex items-center gap-2"
                    >
                      <Input
                        data-testid={`reminder-time-${i}`}
                        type="time"
                        value={time}
                        onChange={(e) => updateTime(i, e.target.value)}
                        className="rounded-xl flex-1"
                        style={{ border: '1px solid #E8E6E1' }}
                      />
                      <button
                        onClick={() => removeTime(i)}
                        className="p-2 rounded-lg"
                        style={{ color: '#A3B1AA' }}
                      >
                        <Trash2 className="w-4 h-4" strokeWidth={1.5} />
                      </button>
                    </div>
                  ))}
                  <button
                    data-testid="add-reminder-time"
                    onClick={addTime}
                    className="text-sm font-medium"
                    style={{ color: '#6B9080' }}
                  >
                    {t('add_time')}
                  </button>
                </div>
              </div>
              <div>
                <label
                  className="text-sm mb-2 block"
                  style={{ color: '#7A8B85' }}
                >
                  {t('active_days')}
                </label>
                <div className="flex flex-wrap gap-2">
                  {DAYS_KEYS.map((day, i) => (
                    <button
                      key={day}
                      data-testid={`day-${day.toLowerCase()}`}
                      onClick={() => toggleDay(day)}
                      className="px-3 py-2 rounded-lg text-xs font-medium transition-all"
                      style={{
                        background: reminders.days.includes(day)
                          ? '#6B9080'
                          : '#F0EFEB',
                        color: reminders.days.includes(day)
                          ? '#FFF'
                          : '#7A8B85',
                      }}
                    >
                      {t(DAY_SHORT_KEYS[i])}
                    </button>
                  ))}
                </div>
              </div>
              {/* Platform install note */}
              <div
                className="flex items-start gap-2.5 p-3 rounded-xl"
                style={{ background: '#F9F8F6', border: '1px solid #E8E6E1' }}
              >
                <Smartphone className="w-4 h-4 shrink-0 mt-0.5" style={{ color: '#A3B1AA' }} strokeWidth={1.5} />
                <p className="text-xs leading-relaxed" style={{ color: '#7A8B85' }}>
                  {isIOS
                    ? 'For reliable reminders on iPhone, add Anchr to your Home Screen via Safari (Share → Add to Home Screen).'
                    : 'For reliable reminders on Android, install Anchr to your home screen so notifications work when the browser is closed.'}
                </p>
              </div>

              {/* Notification permission */}
              {notifPermission !== 'unsupported' && (
                <div
                  className="flex items-center justify-between p-3 rounded-xl"
                  style={{ background: '#F9F8F6', border: '1px solid #E8E6E1' }}
                >
                  <div>
                    <p className="text-sm font-medium" style={{ color: '#2A3A35' }}>
                      Push notifications
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: '#A3B1AA' }}>
                      {notifPermission === 'granted'
                        ? 'Notifications enabled — you\'ll be reminded at your set times'
                        : notifPermission === 'denied'
                          ? 'Blocked in browser settings — re-enable to get reminders'
                          : 'Allow notifications to receive reminders'}
                    </p>
                  </div>
                  {notifPermission === 'default' && (
                    <Button
                      onClick={requestNotificationPermission}
                      className="rounded-full text-white text-xs font-medium shrink-0 ml-3"
                      style={{ background: '#6B9080' }}
                    >
                      Enable
                    </Button>
                  )}
                  {notifPermission === 'granted' && (
                    <span className="text-xs font-medium shrink-0 ml-3" style={{ color: '#6B9080' }}>
                      ✓ On
                    </span>
                  )}
                </div>
              )}

              <div className="flex items-center gap-3">
                <Button
                  data-testid="save-reminders-btn"
                  onClick={saveReminders}
                  disabled={saving}
                  className="rounded-full text-white font-medium"
                  style={{ background: reminderSaved ? '#4A7A6A' : '#6B9080' }}
                >
                  {saving ? t('saving') : reminderSaved ? t('saved') : t('save_reminders')}
                </Button>
                {reminderSaved && (
                  <span className="text-sm font-medium" style={{ color: '#6B9080' }}>
                    ✓ {t('changes_saved')}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Change Password — only shown for email accounts */}
        {user?.auth_provider === 'email' && (
          <div className="rounded-2xl p-6 shadow-sm" style={{ background: '#FFFFFF', border: '1px solid #E8E6E1' }}>
            <div className="flex items-center gap-3 mb-5">
              <Lock className="w-5 h-5" style={{ color: '#6B9080' }} strokeWidth={1.5} />
              <h2 className="font-heading text-xl font-medium" style={{ color: '#2A3A35' }}>{t('change_password')}</h2>
            </div>

            {changePwDone && (
              <div className="mb-4 p-3 rounded-xl text-sm flex items-center gap-2" style={{ background: '#6B908015', color: '#6B9080', border: '1px solid #6B908033' }}>
                <Check className="w-4 h-4 shrink-0" strokeWidth={2} />
                {t('password_changed')}
              </div>
            )}
            {changePwError && (
              <div className="mb-4 p-3 rounded-xl text-sm" style={{ background: '#FDF2F2', color: '#E5989B', border: '1px solid #E5989B33' }}>
                {changePwError}
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-4">
              {/* Current password */}
              <div>
                <label className="text-sm mb-2 block" style={{ color: '#7A8B85' }}>{t('current_password')}</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#A3B1AA' }} strokeWidth={1.5} />
                  <input
                    type={showCurrentPw ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 h-12 rounded-xl text-sm outline-none"
                    style={{ border: '1px solid #E8E6E1', background: '#FFFFFF' }}
                    required
                  />
                  <button type="button" onClick={() => setShowCurrentPw((s) => !s)} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: '#A3B1AA' }} tabIndex={-1}>
                    {showCurrentPw ? <EyeOff className="w-4 h-4" strokeWidth={1.5} /> : <Eye className="w-4 h-4" strokeWidth={1.5} />}
                  </button>
                </div>
              </div>

              {/* New password */}
              <div>
                <label className="text-sm mb-2 block" style={{ color: '#7A8B85' }}>{t('new_password')}</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#A3B1AA' }} strokeWidth={1.5} />
                  <input
                    type={showNewPw ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder={t('password_create_placeholder')}
                    className="w-full pl-10 pr-10 h-12 rounded-xl text-sm outline-none"
                    style={{ border: '1px solid #E8E6E1', background: '#FFFFFF' }}
                    required
                  />
                  <button type="button" onClick={() => setShowNewPw((s) => !s)} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: '#A3B1AA' }} tabIndex={-1}>
                    {showNewPw ? <EyeOff className="w-4 h-4" strokeWidth={1.5} /> : <Eye className="w-4 h-4" strokeWidth={1.5} />}
                  </button>
                </div>
                {newPassword.length > 0 && (
                  <div className="mt-2 space-y-1">
                    <div className="flex items-center gap-1.5 text-xs" style={{ color: newPassword.length >= 6 ? '#6B9080' : '#A3B1AA' }}>
                      {newPassword.length >= 6 ? <Check className="w-3 h-3" strokeWidth={2.5} /> : <X className="w-3 h-3" strokeWidth={2.5} />}
                      At least 6 characters
                    </div>
                    <div className="flex items-center gap-1.5 text-xs" style={{ color: /\d/.test(newPassword) ? '#6B9080' : '#A3B1AA' }}>
                      {/\d/.test(newPassword) ? <Check className="w-3 h-3" strokeWidth={2.5} /> : <X className="w-3 h-3" strokeWidth={2.5} />}
                      At least 1 number
                    </div>
                  </div>
                )}
              </div>

              {/* Confirm new password */}
              <div>
                <label className="text-sm mb-2 block" style={{ color: '#7A8B85' }}>{t('confirm_password')}</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#A3B1AA' }} strokeWidth={1.5} />
                  <input
                    type="password"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    placeholder={t('confirm_password_placeholder')}
                    className="w-full pl-10 pr-10 h-12 rounded-xl text-sm outline-none"
                    style={{ border: `1px solid ${confirmNewPassword.length > 0 ? (newPassword === confirmNewPassword ? '#6B9080' : '#E5989B') : '#E8E6E1'}`, background: '#FFFFFF' }}
                    required
                  />
                  {confirmNewPassword.length > 0 && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      {newPassword === confirmNewPassword
                        ? <Check className="w-4 h-4" style={{ color: '#6B9080' }} strokeWidth={2.5} />
                        : <X className="w-4 h-4" style={{ color: '#E5989B' }} strokeWidth={2.5} />}
                    </div>
                  )}
                </div>
              </div>

              <Button
                type="submit"
                disabled={changePwLoading || !currentPassword || !isNewPasswordValid(newPassword) || newPassword !== confirmNewPassword}
                className="rounded-full text-white font-medium h-11 px-6"
                style={{ background: '#6B9080' }}
              >
                {changePwLoading ? t('saving') : t('change_password')}
              </Button>
            </form>
          </div>
        )}

        {/* Data & Privacy */}
        <div className="rounded-2xl p-6 shadow-sm" style={{ background: '#FFFFFF', border: '1px solid #E8E6E1' }}>
          <div className="flex items-center gap-2 mb-5">
            <Shield className="w-5 h-5" style={{ color: '#6B9080' }} strokeWidth={1.5} />
            <h2 className="font-heading text-xl font-medium" style={{ color: '#2A3A35' }}>{t('data_privacy')}</h2>
          </div>

          {/* Privacy policy expandable */}
          <div className="rounded-xl overflow-hidden mb-4" style={{ border: '1px solid #E8E6E1' }}>
            <button
              type="button"
              onClick={() => setPrivacyOpen(!privacyOpen)}
              className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium"
              style={{ background: '#F9F8F6', color: '#6B9080' }}
            >
              <span>{t('privacy_policy')}</span>
              {privacyOpen ? <ChevronUp className="w-4 h-4" strokeWidth={1.5} /> : <ChevronDown className="w-4 h-4" strokeWidth={1.5} />}
            </button>
            {privacyOpen && (
              <div className="px-4 py-3 text-xs leading-relaxed whitespace-pre-line max-h-48 overflow-y-auto" style={{ color: '#7A8B85', background: '#FFFFFF', borderTop: '1px solid #E8E6E1' }}>
                {t('privacy_policy_content')}
              </div>
            )}
          </div>

          {/* Export */}
          <div className="flex items-start justify-between gap-4 py-4" style={{ borderBottom: '1px solid #F0EFEB' }}>
            <div>
              <p className="text-sm font-medium" style={{ color: '#2A3A35' }}>{t('export_data')}</p>
              <p className="text-xs mt-0.5" style={{ color: '#A3B1AA' }}>{t('export_data_desc')}</p>
            </div>
            <Button
              onClick={handleExportData}
              disabled={exporting}
              className="shrink-0 rounded-full text-sm h-9 px-4 flex items-center gap-2"
              style={{ background: '#6B9080', color: '#fff' }}
            >
              <Download className="w-3.5 h-3.5" strokeWidth={1.5} />
              {exporting ? t('exporting') : t('export_data')}
            </Button>
          </div>

          {/* Delete data */}
          <div className="flex items-start justify-between gap-4 py-4" style={{ borderBottom: '1px solid #F0EFEB' }}>
            <div>
              <p className="text-sm font-medium" style={{ color: '#2A3A35' }}>{t('delete_data')}</p>
              <p className="text-xs mt-0.5" style={{ color: '#A3B1AA' }}>{t('delete_data_desc')}</p>
            </div>
            <Dialog open={deleteDataDialogOpen} onOpenChange={(o) => { setDeleteDataDialogOpen(o); if (!o) setDeleteConfirmText(''); }}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  className="shrink-0 rounded-full text-sm h-9 px-4"
                  style={{ border: '1px solid #E5989B', color: '#E5989B' }}
                >
                  {t('delete_data')}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle style={{ color: '#2A3A35' }}>{t('delete_data')}</DialogTitle>
                </DialogHeader>
                <p className="text-sm mt-2" style={{ color: '#7A8B85' }}>{t('confirm_delete_data')}</p>
                <p className="text-xs mt-3 font-medium" style={{ color: '#7A8B85' }}>{t('type_delete_to_confirm')}</p>
                <input
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  className="w-full mt-1 px-3 py-2 rounded-xl text-sm"
                  style={{ border: '1px solid #E8E6E1', background: '#F9F8F6', color: '#2A3A35' }}
                  placeholder={lang === 'en' ? 'DELETE' : 'SLET'}
                />
                <div className="flex gap-3 mt-4">
                  <Button variant="outline" className="flex-1 rounded-full" onClick={() => { setDeleteDataDialogOpen(false); setDeleteConfirmText(''); }}>{t('cancel')}</Button>
                  <Button
                    className="flex-1 rounded-full text-white"
                    style={{ background: (deleteConfirmText === 'DELETE' || deleteConfirmText === 'SLET') ? '#E5989B' : '#A3B1AA' }}
                    disabled={deleting || (deleteConfirmText !== 'DELETE' && deleteConfirmText !== 'SLET')}
                    onClick={handleDeleteData}
                  >
                    {deleting ? t('deleting') : t('delete')}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Delete account */}
          <div className="flex items-start justify-between gap-4 pt-4">
            <div>
              <p className="text-sm font-medium" style={{ color: '#E5989B' }}>{t('delete_account')}</p>
              <p className="text-xs mt-0.5" style={{ color: '#A3B1AA' }}>{t('delete_account_desc')}</p>
            </div>
            <Dialog open={deleteAccountDialogOpen} onOpenChange={(o) => { setDeleteAccountDialogOpen(o); if (!o) setDeleteConfirmText(''); }}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  className="shrink-0 rounded-full text-sm h-9 px-4"
                  style={{ border: '1px solid #E5989B', color: '#E5989B' }}
                >
                  {t('delete_account')}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle style={{ color: '#E5989B' }}>{t('delete_account')}</DialogTitle>
                </DialogHeader>
                <p className="text-sm mt-2" style={{ color: '#7A8B85' }}>{t('confirm_delete_account')}</p>
                <p className="text-xs mt-3 font-medium" style={{ color: '#7A8B85' }}>{t('type_delete_to_confirm')}</p>
                <input
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  className="w-full mt-1 px-3 py-2 rounded-xl text-sm"
                  style={{ border: '1px solid #E8E6E1', background: '#F9F8F6', color: '#2A3A35' }}
                  placeholder={lang === 'en' ? 'DELETE' : 'SLET'}
                />
                <div className="flex gap-3 mt-4">
                  <Button variant="outline" className="flex-1 rounded-full" onClick={() => { setDeleteAccountDialogOpen(false); setDeleteConfirmText(''); }}>{t('cancel')}</Button>
                  <Button
                    className="flex-1 rounded-full text-white"
                    style={{ background: (deleteConfirmText === 'DELETE' || deleteConfirmText === 'SLET') ? '#E5989B' : '#A3B1AA' }}
                    disabled={deleting || (deleteConfirmText !== 'DELETE' && deleteConfirmText !== 'SLET')}
                    onClick={handleDeleteAccount}
                  >
                    {deleting ? t('deleting') : t('delete_account')}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

      </div>
    </AppLayout>
  );
}
