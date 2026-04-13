import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import AppLayout from '../components/AppLayout';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Flame, Check, ChevronDown } from 'lucide-react';
import { Button } from '../components/ui/button';
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from '../components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { Textarea } from '../components/ui/textarea';
import TimerDisplay from '../components/urge/TimerDisplay';
import BreathingExercise from '../components/urge/BreathingExercise';
import GroundingExercise from '../components/urge/GroundingExercise';
import CopingTools from '../components/urge/CopingTools';

const API = `${process.env.REACT_APP_API_URL}/api`;

const TIMER_OPTIONS = [
  { label: '5 min', seconds: 300 },
  { label: '10 min', seconds: 600 },
  { label: '15 min', seconds: 900 },
];

const formatTime = (s) => {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, '0')}`;
};

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

function SetupPhase({
  t,
  timerDuration,
  setTimerDuration,
  setTimeLeft,
  trigger,
  setTrigger,
  emotion,
  setEmotion,
  intensity,
  setIntensity,
  notes,
  setNotes,
  urgeType,
  setUrgeType,
  customUrgeType,
  setCustomUrgeType,
  savedCustomUrge,
  onStart,
}) {
  const TRIGGERS_KEYS = [
    'stress',
    'boredom',
    'loneliness',
    'location',
    'social',
    'tiredness',
    'habit_loop',
    'other',
  ];
  const EMOTIONS_KEYS = [
    'anxious',
    'sad',
    'angry',
    'frustrated',
    'lonely',
    'restless',
    'numb',
    'overwhelmed',
  ];

  return (
    <motion.div
      key="setup"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-6"
    >
      <div className="text-center">
        <h1
          className="font-heading text-4xl sm:text-5xl font-light tracking-tight"
          style={{ color: '#2A3A35' }}
        >
          {t('ride_the_wave')}
        </h1>
        <p
          className="mt-2"
          style={{ color: '#7A8B85', fontFamily: 'Figtree, sans-serif' }}
        >
          {t('urge_timer_subtitle')}
        </p>
      </div>
      <div
        className="rounded-2xl p-6 shadow-sm"
        style={{ background: '#FFFFFF', border: '1px solid #E8E6E1' }}
      >
        <h3
          className="text-sm font-medium mb-3 uppercase tracking-wider"
          style={{ color: '#A3B1AA' }}
        >
          {t('urge_type_label')}
        </h3>
        <div className="flex flex-wrap gap-2 mb-2">
          {PRESET_URGE_TYPES.filter((o) => o.id !== 'other').map((opt) => (
            <button
              key={opt.id}
              onClick={() => { setUrgeType(opt.id); setCustomUrgeType(''); }}
              className="px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200"
              style={{
                background: urgeType === opt.id ? '#6B9080' : '#F0EFEB',
                color: urgeType === opt.id ? '#FFFFFF' : '#7A8B85',
              }}
            >
              {t('urge_' + opt.id)}
            </button>
          ))}
          {/* Saved user custom urge as its own pill */}
          {savedCustomUrge && (
            <button
              onClick={() => { setUrgeType('other'); setCustomUrgeType(savedCustomUrge); }}
              className="px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200"
              style={{
                background: urgeType === 'other' && customUrgeType === savedCustomUrge ? '#6B9080' : '#E2D4C8',
                color: urgeType === 'other' && customUrgeType === savedCustomUrge ? '#FFFFFF' : '#7A8B85',
              }}
            >
              {savedCustomUrge}
            </button>
          )}
          {/* Add / type a new custom one */}
          <button
            onClick={() => { setUrgeType('other'); setCustomUrgeType(''); }}
            className="px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200"
            style={{
              background: urgeType === 'other' && !customUrgeType ? '#6B9080' : '#F0EFEB',
              color: urgeType === 'other' && !customUrgeType ? '#FFFFFF' : '#A3B1AA',
            }}
          >
            + {t('urge_other')}
          </button>
        </div>
        {urgeType === 'other' && (
          <input
            type="text"
            value={customUrgeType}
            onChange={(e) => setCustomUrgeType(e.target.value)}
            placeholder={t('custom_urge_placeholder')}
            className="w-full mt-2 px-3 py-2 rounded-xl text-sm"
            style={{ border: '1px solid #E8E6E1', color: '#2A3A35', outline: 'none' }}
          />
        )}
      </div>
      <div
        className="rounded-2xl p-6 shadow-sm"
        style={{ background: '#FFFFFF', border: '1px solid #E8E6E1' }}
      >
        <h3
          className="text-sm font-medium mb-3 uppercase tracking-wider"
          style={{ color: '#A3B1AA' }}
        >
          {t('timer_duration')}
        </h3>
        <div className="flex gap-3">
          {TIMER_OPTIONS.map((opt) => (
            <button
              key={opt.seconds}
              data-testid={`timer-${opt.seconds}`}
              onClick={() => {
                setTimerDuration(opt.seconds);
                setTimeLeft(opt.seconds);
              }}
              className="flex-1 py-3 rounded-xl text-sm font-medium transition-all duration-200"
              style={{
                background:
                  timerDuration === opt.seconds ? '#6B9080' : '#F0EFEB',
                color: timerDuration === opt.seconds ? '#FFFFFF' : '#2A3A35',
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
      <div
        className="rounded-2xl p-6 shadow-sm space-y-4"
        style={{ background: '#FFFFFF', border: '1px solid #E8E6E1' }}
      >
        <h3
          className="text-sm font-medium uppercase tracking-wider"
          style={{ color: '#A3B1AA' }}
        >
          {t('whats_happening')}
        </h3>
        <div>
          <label className="text-sm mb-2 block" style={{ color: '#7A8B85' }}>
            {t('trigger')}
          </label>
          <Select value={trigger} onValueChange={setTrigger}>
            <SelectTrigger
              data-testid="trigger-select"
              className="rounded-xl"
              style={{ border: '1px solid #E8E6E1' }}
            >
              <SelectValue placeholder={t('trigger_placeholder')} />
            </SelectTrigger>
            <SelectContent>
              {TRIGGERS_KEYS.map((k) => (
                <SelectItem key={k} value={k}>
                  {t(k)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-sm mb-2 block" style={{ color: '#7A8B85' }}>
            {t('emotion_label')}
          </label>
          <Select value={emotion} onValueChange={setEmotion}>
            <SelectTrigger
              data-testid="emotion-select"
              className="rounded-xl"
              style={{ border: '1px solid #E8E6E1' }}
            >
              <SelectValue placeholder={t('emotion_placeholder')} />
            </SelectTrigger>
            <SelectContent>
              {EMOTIONS_KEYS.map((k) => (
                <SelectItem key={k} value={k}>
                  {t(k)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-sm mb-2 block" style={{ color: '#7A8B85' }}>
            {t('intensity')}
          </label>
          <div className="flex gap-1">
            {Array.from({ length: 10 }, (_, i) => i + 1).map((level) => (
              <button
                key={`intensity-${level}`}
                data-testid={`intensity-${level}`}
                onClick={() => setIntensity(level)}
                className="flex-1 py-2 rounded-lg text-xs font-medium transition-all duration-200"
                style={{
                  background:
                    intensity >= level
                      ? level <= 4
                        ? '#A4C3B2'
                        : level <= 7
                          ? '#E2D4C8'
                          : '#E5989B'
                      : '#F0EFEB',
                  color: intensity >= level ? '#FFFFFF' : '#A3B1AA',
                }}
              >
                {level}
              </button>
            ))}
          </div>
        </div>
        <Textarea
          data-testid="urge-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder={t('any_notes')}
          className="rounded-xl resize-none"
          style={{ border: '1px solid #E8E6E1' }}
          rows={2}
        />
      </div>
      <Button
        data-testid="start-timer-btn"
        onClick={onStart}
        className="w-full h-14 rounded-full text-white text-lg font-medium transition-all duration-300 hover:-translate-y-0.5"
        style={{ background: '#E5989B' }}
      >
        <Flame className="w-5 h-5 mr-2" strokeWidth={1.5} />
        {t('start_timer')}
      </Button>
    </motion.div>
  );
}

function ActivePhase({
  t,
  timeLeft,
  timerDuration,
  isRunning,
  encouragement,
  motivations,
  activeTab,
  setActiveTab,
  onTogglePause,
  onOutcome,
}) {
  return (
    <motion.div
      key="active"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-6"
    >
      <TimerDisplay
        timeLeft={timeLeft}
        timerDuration={timerDuration}
        isRunning={isRunning}
        encouragement={encouragement}
        onTogglePause={onTogglePause}
        formatTime={formatTime}
      />
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList
          className="w-full rounded-xl p-1"
          style={{ background: '#F0EFEB' }}
        >
          <TabsTrigger
            data-testid="tab-timer"
            value="timer"
            className="flex-1 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm"
          >
            {t('timer_tab')}
          </TabsTrigger>
          <TabsTrigger
            data-testid="tab-breathing"
            value="breathing"
            className="flex-1 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm"
          >
            {t('breathing_tab')}
          </TabsTrigger>
          <TabsTrigger
            data-testid="tab-grounding"
            value="grounding"
            className="flex-1 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm"
          >
            {t('grounding_tab')}
          </TabsTrigger>
          <TabsTrigger
            data-testid="tab-coping"
            value="coping"
            className="flex-1 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm"
          >
            {t('coping_tab')}
          </TabsTrigger>
        </TabsList>
        <TabsContent value="timer" className="mt-4">
          <div
            className="rounded-2xl p-6 text-center"
            style={{ background: '#FFFFFF', border: '1px solid #E8E6E1' }}
          >
            <p className="text-sm" style={{ color: '#7A8B85' }}>
              {t('focus_countdown')}
            </p>
            {motivations.length > 0 && (
              <div
                className="mt-4 p-4 rounded-xl"
                style={{ background: '#F0EFEB' }}
              >
                <p className="text-sm italic" style={{ color: '#7A8B85' }}>
                  "{motivations[0]?.message}"
                </p>
              </div>
            )}
          </div>
        </TabsContent>
        <TabsContent value="breathing" className="mt-4">
          <BreathingExercise />
        </TabsContent>
        <TabsContent value="grounding" className="mt-4">
          <GroundingExercise />
        </TabsContent>
        <TabsContent value="coping" className="mt-4">
          <CopingTools />
        </TabsContent>
      </Tabs>
      <div className="flex gap-3">
        <Button
          data-testid="resisted-btn"
          onClick={() => onOutcome('resisted')}
          className="flex-1 h-12 rounded-full text-white font-medium"
          style={{ background: '#6B9080' }}
        >
          <Check className="w-4 h-4 mr-2" strokeWidth={2} />
          {t('i_resisted')}
        </Button>
        <Button
          data-testid="relapsed-btn"
          onClick={() => onOutcome('relapsed')}
          variant="outline"
          className="flex-1 h-12 rounded-full font-medium"
          style={{ border: '1px solid #E8E6E1', color: '#7A8B85' }}
        >
          {t('i_slipped')}
        </Button>
      </div>
    </motion.div>
  );
}

function CompletePhase({ t, onOutcome }) {
  return (
    <motion.div
      key="complete"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="text-center py-12 space-y-6"
    >
      <div
        className="w-20 h-20 rounded-full mx-auto flex items-center justify-center"
        style={{ background: '#A4C3B2' }}
      >
        <Check className="w-10 h-10 text-white" strokeWidth={1.5} />
      </div>
      <h2
        className="font-heading text-3xl font-light"
        style={{ color: '#2A3A35' }}
      >
        {t('you_made_it')}
      </h2>
      <p style={{ color: '#7A8B85', fontFamily: 'Figtree, sans-serif' }}>
        {t('timer_complete_desc')}
      </p>
      <div className="flex gap-3 max-w-sm mx-auto">
        <Button
          data-testid="complete-resisted-btn"
          onClick={() => onOutcome('resisted')}
          className="flex-1 h-12 rounded-full text-white font-medium"
          style={{ background: '#6B9080' }}
        >
          {t('i_resisted_excl')}
        </Button>
        <Button
          data-testid="complete-slipped-btn"
          onClick={() => onOutcome('relapsed')}
          variant="outline"
          className="flex-1 h-12 rounded-full font-medium"
          style={{ border: '1px solid #E8E6E1', color: '#7A8B85' }}
        >
          {t('i_slipped')}
        </Button>
      </div>
    </motion.div>
  );
}

export default function UrgeTimer() {
  const location = useLocation();
  const { t } = useLanguage();
  const { user } = useAuth();
  const initialTab = location.state?.tab || 'timer';

  const [phase, setPhase] = useState('setup');
  const [activeTab, setActiveTab] = useState(initialTab);
  const [timerDuration, setTimerDuration] = useState(300);
  const [timeLeft, setTimeLeft] = useState(300);
  const [isRunning, setIsRunning] = useState(false);
  const [trigger, setTrigger] = useState('');
  const [emotion, setEmotion] = useState('');
  const [notes, setNotes] = useState('');
  const [intensity, setIntensity] = useState(5);
  const [urgeType, setUrgeType] = useState(user?.urge_type || '');
  const [customUrgeType, setCustomUrgeType] = useState(user?.custom_urge_type || '');
  const [currentUrgeId, setCurrentUrgeId] = useState(null);
  const [encouragement, setEncouragement] = useState(t('encouragement_1'));
  const [motivations, setMotivations] = useState([]);
  const intervalRef = useRef(null);

  const ENCOURAGEMENT_KEYS = [
    'encouragement_1',
    'encouragement_2',
    'encouragement_3',
    'encouragement_4',
    'encouragement_5',
    'encouragement_6',
  ];

  useEffect(() => {
    axios
      .get(`${API}/motivations`, { withCredentials: true })
      .then((res) => setMotivations(res.data))
      .catch((error) => {
        console.error('Failed to load motivations:', error);
      });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(intervalRef.current);
    }
    if (timeLeft === 0 && isRunning) {
      setIsRunning(false);
      setPhase('complete');
    }
  }, [isRunning, timeLeft]);

  useEffect(() => {
    if (!isRunning) return;
    const msgInterval = setInterval(() => {
      const key =
        ENCOURAGEMENT_KEYS[
          Math.floor(Math.random() * ENCOURAGEMENT_KEYS.length)
        ];
      setEncouragement(t(key));
    }, 8000);
    return () => clearInterval(msgInterval);
  }, [isRunning, t]); // eslint-disable-line react-hooks/exhaustive-deps

  const startUrge = useCallback(async () => {
    try {
      const res = await axios.post(
        `${API}/urges`,
        {
          trigger: trigger || null,
          emotion: emotion || null,
          notes: notes || null,
          intensity,
          urge_type: urgeType || null,
          custom_urge_type: urgeType === 'other' ? (customUrgeType || null) : null,
        },
        { withCredentials: true },
      );
      setCurrentUrgeId(res.data.urge_id);
      setTimeLeft(timerDuration);
      setIsRunning(true);
      setPhase('active');
    } catch (error) {
      console.error('Failed to create urge:', error);
    }
  }, [trigger, emotion, notes, intensity, urgeType, customUrgeType, timerDuration]);

  const handleOutcome = useCallback(
    async (outcome) => {
      if (currentUrgeId) {
        try {
          await axios.put(
            `${API}/urges/${currentUrgeId}`,
            {
              outcome,
              duration_seconds: timerDuration - timeLeft,
              coping_used: activeTab,
            },
            { withCredentials: true },
          );
        } catch (error) {
          console.error('Failed to update urge:', error);
        }
      }
      if (outcome === 'relapsed') {
        try {
          await axios.post(
            `${API}/relapses`,
            {
              trigger: trigger || null,
              emotion: emotion || null,
              notes: 'Logged from urge timer',
            },
            { withCredentials: true },
          );
        } catch (error) {
          console.error('Failed to log relapse:', error);
        }
      }
      setPhase('setup');
      setIsRunning(false);
      setTimeLeft(timerDuration);
      setCurrentUrgeId(null);
      setTrigger('');
      setEmotion('');
      setNotes('');
      setUrgeType(user?.urge_type || '');
      setCustomUrgeType(user?.custom_urge_type || '');
    },
    [currentUrgeId, timerDuration, timeLeft, activeTab, trigger, emotion, user],
  );

  return (
    <AppLayout>
      <div data-testid="urge-timer-page" className="max-w-2xl mx-auto">
        <AnimatePresence mode="wait">
          {phase === 'setup' && (
            <SetupPhase
              t={t}
              timerDuration={timerDuration}
              setTimerDuration={setTimerDuration}
              setTimeLeft={setTimeLeft}
              trigger={trigger}
              setTrigger={setTrigger}
              emotion={emotion}
              setEmotion={setEmotion}
              intensity={intensity}
              setIntensity={setIntensity}
              notes={notes}
              setNotes={setNotes}
              urgeType={urgeType}
              setUrgeType={setUrgeType}
              customUrgeType={customUrgeType}
              setCustomUrgeType={setCustomUrgeType}
              savedCustomUrge={user?.custom_urge_type || ''}
              onStart={startUrge}
            />
          )}
          {phase === 'active' && (
            <ActivePhase
              t={t}
              timeLeft={timeLeft}
              timerDuration={timerDuration}
              isRunning={isRunning}
              encouragement={encouragement}
              motivations={motivations}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              onTogglePause={() => setIsRunning((prev) => !prev)}
              onOutcome={handleOutcome}
            />
          )}
          {phase === 'complete' && (
            <CompletePhase t={t} onOutcome={handleOutcome} />
          )}
        </AnimatePresence>
      </div>
    </AppLayout>
  );
}
