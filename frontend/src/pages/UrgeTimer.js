import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import AppLayout from '../components/AppLayout';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Flame, Check } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '../components/ui/select';
import { Textarea } from '../components/ui/textarea';
import TimerDisplay from '../components/urge/TimerDisplay';
import BreathingExercise from '../components/urge/BreathingExercise';
import GroundingExercise from '../components/urge/GroundingExercise';
import CopingTools from '../components/urge/CopingTools';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const TRIGGERS = ['Stress', 'Boredom', 'Loneliness', 'Location', 'Social', 'Tiredness', 'Habit Loop', 'Other'];
const EMOTIONS = ['Anxious', 'Sad', 'Angry', 'Frustrated', 'Lonely', 'Restless', 'Numb', 'Overwhelmed'];
const TIMER_OPTIONS = [
  { label: '5 min', seconds: 300 },
  { label: '10 min', seconds: 600 },
  { label: '15 min', seconds: 900 },
];

const ENCOURAGEMENTS = [
  "This will pass. You are stronger than this moment.",
  "Breathe. You've made it through urges before.",
  "Every second you wait is a victory.",
  "The urge is a wave. Ride it out.",
  "You are choosing yourself right now.",
  "This feeling is temporary. Your strength is permanent.",
];

const formatTime = (s) => {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, '0')}`;
};

// ─── Setup Phase ───
function SetupPhase({ timerDuration, setTimerDuration, setTimeLeft, trigger, setTrigger, emotion, setEmotion, intensity, setIntensity, notes, setNotes, onStart }) {
  return (
    <motion.div
      key="setup"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-6"
    >
      <div className="text-center">
        <h1 className="font-heading text-4xl sm:text-5xl font-light tracking-tight" style={{ color: '#2A3A35' }}>
          Ride the Wave
        </h1>
        <p className="mt-2" style={{ color: '#7A8B85', fontFamily: 'Figtree, sans-serif' }}>
          Urges are temporary. Let's get through this together.
        </p>
      </div>

      <div className="rounded-2xl p-6 shadow-sm" style={{ background: '#FFFFFF', border: '1px solid #E8E6E1' }}>
        <h3 className="text-sm font-medium mb-3 uppercase tracking-wider" style={{ color: '#A3B1AA' }}>Timer Duration</h3>
        <div className="flex gap-3">
          {TIMER_OPTIONS.map(opt => (
            <button
              key={opt.seconds}
              data-testid={`timer-${opt.seconds}`}
              onClick={() => { setTimerDuration(opt.seconds); setTimeLeft(opt.seconds); }}
              className="flex-1 py-3 rounded-xl text-sm font-medium transition-all duration-200"
              style={{
                background: timerDuration === opt.seconds ? '#6B9080' : '#F0EFEB',
                color: timerDuration === opt.seconds ? '#FFFFFF' : '#2A3A35',
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-2xl p-6 shadow-sm space-y-4" style={{ background: '#FFFFFF', border: '1px solid #E8E6E1' }}>
        <h3 className="text-sm font-medium uppercase tracking-wider" style={{ color: '#A3B1AA' }}>
          What's happening? (optional)
        </h3>
        <div>
          <label className="text-sm mb-2 block" style={{ color: '#7A8B85' }}>Trigger</label>
          <Select value={trigger} onValueChange={setTrigger}>
            <SelectTrigger data-testid="trigger-select" className="rounded-xl" style={{ border: '1px solid #E8E6E1' }}>
              <SelectValue placeholder="What triggered this?" />
            </SelectTrigger>
            <SelectContent>
              {TRIGGERS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-sm mb-2 block" style={{ color: '#7A8B85' }}>Emotion</label>
          <Select value={emotion} onValueChange={setEmotion}>
            <SelectTrigger data-testid="emotion-select" className="rounded-xl" style={{ border: '1px solid #E8E6E1' }}>
              <SelectValue placeholder="How are you feeling?" />
            </SelectTrigger>
            <SelectContent>
              {EMOTIONS.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-sm mb-2 block" style={{ color: '#7A8B85' }}>Intensity (1-10)</label>
          <div className="flex gap-1">
            {Array.from({ length: 10 }, (_, i) => i + 1).map((level) => (
              <button
                key={`intensity-${level}`}
                data-testid={`intensity-${level}`}
                onClick={() => setIntensity(level)}
                className="flex-1 py-2 rounded-lg text-xs font-medium transition-all duration-200"
                style={{
                  background: intensity >= level ? (level <= 4 ? '#A4C3B2' : level <= 7 ? '#E2D4C8' : '#E5989B') : '#F0EFEB',
                  color: intensity >= level ? '#FFFFFF' : '#A3B1AA'
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
          onChange={e => setNotes(e.target.value)}
          placeholder="Any notes..."
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
        Start Timer - I Can Do This
      </Button>
    </motion.div>
  );
}

// ─── Active Phase ───
function ActivePhase({ timeLeft, timerDuration, isRunning, encouragement, motivations, activeTab, setActiveTab, onTogglePause, onOutcome }) {
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
        <TabsList className="w-full rounded-xl p-1" style={{ background: '#F0EFEB' }}>
          <TabsTrigger data-testid="tab-timer" value="timer" className="flex-1 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">Timer</TabsTrigger>
          <TabsTrigger data-testid="tab-breathing" value="breathing" className="flex-1 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">Breathing</TabsTrigger>
          <TabsTrigger data-testid="tab-grounding" value="grounding" className="flex-1 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">Grounding</TabsTrigger>
          <TabsTrigger data-testid="tab-coping" value="coping" className="flex-1 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">Coping</TabsTrigger>
        </TabsList>
        <TabsContent value="timer" className="mt-4">
          <div className="rounded-2xl p-6 text-center" style={{ background: '#FFFFFF', border: '1px solid #E8E6E1' }}>
            <p className="text-sm" style={{ color: '#7A8B85' }}>Focus on the countdown. Each second is progress.</p>
            {motivations.length > 0 && (
              <div className="mt-4 p-4 rounded-xl" style={{ background: '#F0EFEB' }}>
                <p className="text-sm italic" style={{ color: '#7A8B85' }}>
                  "{motivations[0]?.message}"
                </p>
              </div>
            )}
          </div>
        </TabsContent>
        <TabsContent value="breathing" className="mt-4"><BreathingExercise /></TabsContent>
        <TabsContent value="grounding" className="mt-4"><GroundingExercise /></TabsContent>
        <TabsContent value="coping" className="mt-4"><CopingTools /></TabsContent>
      </Tabs>

      <div className="flex gap-3">
        <Button
          data-testid="resisted-btn"
          onClick={() => onOutcome('resisted')}
          className="flex-1 h-12 rounded-full text-white font-medium"
          style={{ background: '#6B9080' }}
        >
          <Check className="w-4 h-4 mr-2" strokeWidth={2} />
          I Resisted
        </Button>
        <Button
          data-testid="relapsed-btn"
          onClick={() => onOutcome('relapsed')}
          variant="outline"
          className="flex-1 h-12 rounded-full font-medium"
          style={{ border: '1px solid #E8E6E1', color: '#7A8B85' }}
        >
          I Slipped
        </Button>
      </div>
    </motion.div>
  );
}

// ─── Complete Phase ───
function CompletePhase({ onOutcome }) {
  return (
    <motion.div
      key="complete"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="text-center py-12 space-y-6"
    >
      <div className="w-20 h-20 rounded-full mx-auto flex items-center justify-center" style={{ background: '#A4C3B2' }}>
        <Check className="w-10 h-10 text-white" strokeWidth={1.5} />
      </div>
      <h2 className="font-heading text-3xl font-light" style={{ color: '#2A3A35' }}>
        You made it through
      </h2>
      <p style={{ color: '#7A8B85', fontFamily: 'Figtree, sans-serif' }}>
        The timer is up. You stayed strong. How did it go?
      </p>
      <div className="flex gap-3 max-w-sm mx-auto">
        <Button
          data-testid="complete-resisted-btn"
          onClick={() => onOutcome('resisted')}
          className="flex-1 h-12 rounded-full text-white font-medium"
          style={{ background: '#6B9080' }}
        >
          I Resisted!
        </Button>
        <Button
          data-testid="complete-slipped-btn"
          onClick={() => onOutcome('relapsed')}
          variant="outline"
          className="flex-1 h-12 rounded-full font-medium"
          style={{ border: '1px solid #E8E6E1', color: '#7A8B85' }}
        >
          I Slipped
        </Button>
      </div>
    </motion.div>
  );
}

// ─── Main UrgeTimer ───
export default function UrgeTimer() {
  const location = useLocation();
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
  const [currentUrgeId, setCurrentUrgeId] = useState(null);
  const [encouragement, setEncouragement] = useState(ENCOURAGEMENTS[0]);
  const [motivations, setMotivations] = useState([]);
  const intervalRef = useRef(null);

  useEffect(() => {
    axios.get(`${API}/motivations`, { withCredentials: true })
      .then(res => setMotivations(res.data))
      .catch((error) => {
        console.error('Failed to load motivations:', error);
      });
  }, []);

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(t => t - 1);
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
      setEncouragement(ENCOURAGEMENTS[Math.floor(Math.random() * ENCOURAGEMENTS.length)]);
    }, 8000);
    return () => clearInterval(msgInterval);
  }, [isRunning]);

  const startUrge = useCallback(async () => {
    try {
      const res = await axios.post(`${API}/urges`, {
        trigger: trigger || null,
        emotion: emotion || null,
        notes: notes || null,
        intensity
      }, { withCredentials: true });
      setCurrentUrgeId(res.data.urge_id);
      setTimeLeft(timerDuration);
      setIsRunning(true);
      setPhase('active');
    } catch (error) {
      console.error('Failed to create urge:', error);
    }
  }, [trigger, emotion, notes, intensity, timerDuration]);

  const handleOutcome = useCallback(async (outcome) => {
    if (currentUrgeId) {
      try {
        await axios.put(`${API}/urges/${currentUrgeId}`, {
          outcome,
          duration_seconds: timerDuration - timeLeft,
          coping_used: activeTab
        }, { withCredentials: true });
      } catch (error) {
        console.error('Failed to update urge outcome:', error);
      }
    }
    if (outcome === 'relapsed') {
      try {
        await axios.post(`${API}/relapses`, {
          trigger: trigger || null,
          emotion: emotion || null,
          notes: 'Logged from urge timer'
        }, { withCredentials: true });
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
  }, [currentUrgeId, timerDuration, timeLeft, activeTab, trigger, emotion]);

  return (
    <AppLayout>
      <div data-testid="urge-timer-page" className="max-w-2xl mx-auto">
        <AnimatePresence mode="wait">
          {phase === 'setup' && (
            <SetupPhase
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
              onStart={startUrge}
            />
          )}
          {phase === 'active' && (
            <ActivePhase
              timeLeft={timeLeft}
              timerDuration={timerDuration}
              isRunning={isRunning}
              encouragement={encouragement}
              motivations={motivations}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              onTogglePause={() => setIsRunning(prev => !prev)}
              onOutcome={handleOutcome}
            />
          )}
          {phase === 'complete' && (
            <CompletePhase onOutcome={handleOutcome} />
          )}
        </AnimatePresence>
      </div>
    </AppLayout>
  );
}
