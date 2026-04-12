import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import AppLayout from '../components/AppLayout';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Flame, Clock, Wind, Shield, Droplets, Phone, Footprints,
  ChevronRight, Check, X, ArrowLeft, Play, Pause, RotateCcw
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '../components/ui/select';
import { Textarea } from '../components/ui/textarea';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const TRIGGERS = ['Stress', 'Boredom', 'Loneliness', 'Location', 'Social', 'Tiredness', 'Habit Loop', 'Other'];
const EMOTIONS = ['Anxious', 'Sad', 'Angry', 'Frustrated', 'Lonely', 'Restless', 'Numb', 'Overwhelmed'];
const TIMER_OPTIONS = [
  { label: '5 min', seconds: 300 },
  { label: '10 min', seconds: 600 },
  { label: '15 min', seconds: 900 },
];

const encouragements = [
  "This will pass. You are stronger than this moment.",
  "Breathe. You've made it through urges before.",
  "Every second you wait is a victory.",
  "The urge is a wave. Ride it out.",
  "You are choosing yourself right now.",
  "This feeling is temporary. Your strength is permanent.",
];

const GROUNDING_STEPS = [
  { count: 5, sense: 'SEE', instruction: 'Name 5 things you can see right now' },
  { count: 4, sense: 'TOUCH', instruction: 'Name 4 things you can touch' },
  { count: 3, sense: 'HEAR', instruction: 'Name 3 things you can hear' },
  { count: 2, sense: 'SMELL', instruction: 'Name 2 things you can smell' },
  { count: 1, sense: 'TASTE', instruction: 'Name 1 thing you can taste' },
];

const COPING_SUGGESTIONS = [
  { icon: Footprints, label: 'Go for a walk', desc: 'Move your body, change your scenery' },
  { icon: Droplets, label: 'Drink water', desc: 'Hydrate and reset' },
  { icon: Phone, label: 'Call someone', desc: 'Reach out to a trusted person' },
  { icon: Wind, label: 'Step outside', desc: 'Fresh air can shift your state' },
];

export default function UrgeTimer() {
  const location = useLocation();
  const navigate = useNavigate();
  const initialTab = location.state?.tab || 'timer';

  const [phase, setPhase] = useState('setup'); // setup, logging, active, complete
  const [activeTab, setActiveTab] = useState(initialTab);
  const [timerDuration, setTimerDuration] = useState(300);
  const [timeLeft, setTimeLeft] = useState(300);
  const [isRunning, setIsRunning] = useState(false);
  const [trigger, setTrigger] = useState('');
  const [emotion, setEmotion] = useState('');
  const [notes, setNotes] = useState('');
  const [intensity, setIntensity] = useState(5);
  const [currentUrgeId, setCurrentUrgeId] = useState(null);
  const [encouragement, setEncouragement] = useState(encouragements[0]);
  const [groundingStep, setGroundingStep] = useState(0);
  const [breathPhase, setBreathPhase] = useState('inhale');
  const [motivations, setMotivations] = useState([]);
  const intervalRef = useRef(null);

  useEffect(() => {
    axios.get(`${API}/motivations`, { withCredentials: true })
      .then(res => setMotivations(res.data))
      .catch(() => {});
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
    if (isRunning) {
      const msgInterval = setInterval(() => {
        setEncouragement(encouragements[Math.floor(Math.random() * encouragements.length)]);
      }, 8000);
      return () => clearInterval(msgInterval);
    }
  }, [isRunning]);

  // Breathing cycle
  useEffect(() => {
    if (activeTab !== 'breathing') return;
    const cycle = () => {
      setBreathPhase('inhale');
      setTimeout(() => setBreathPhase('hold'), 4000);
      setTimeout(() => setBreathPhase('exhale'), 8000);
    };
    cycle();
    const interval = setInterval(cycle, 14000);
    return () => clearInterval(interval);
  }, [activeTab]);

  const startUrge = async () => {
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
    } catch (err) {
      console.error(err);
    }
  };

  const handleOutcome = async (outcome) => {
    if (currentUrgeId) {
      try {
        await axios.put(`${API}/urges/${currentUrgeId}`, {
          outcome,
          duration_seconds: timerDuration - timeLeft,
          coping_used: activeTab
        }, { withCredentials: true });
      } catch {}
    }
    if (outcome === 'relapsed') {
      try {
        await axios.post(`${API}/relapses`, {
          trigger: trigger || null,
          emotion: emotion || null,
          notes: 'Logged from urge timer'
        }, { withCredentials: true });
      } catch {}
    }
    setPhase('setup');
    setIsRunning(false);
    setTimeLeft(timerDuration);
    setCurrentUrgeId(null);
    setTrigger('');
    setEmotion('');
    setNotes('');
  };

  const formatTime = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const progress = ((timerDuration - timeLeft) / timerDuration) * 100;

  return (
    <AppLayout>
      <div data-testid="urge-timer-page" className="max-w-2xl mx-auto">
        <AnimatePresence mode="wait">
          {/* SETUP PHASE */}
          {phase === 'setup' && (
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

              {/* Timer Selection */}
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

              {/* Quick Log */}
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
                    {[...Array(10)].map((_, i) => (
                      <button
                        key={i}
                        data-testid={`intensity-${i+1}`}
                        onClick={() => setIntensity(i + 1)}
                        className="flex-1 py-2 rounded-lg text-xs font-medium transition-all duration-200"
                        style={{
                          background: intensity >= i + 1 ? (i < 4 ? '#A4C3B2' : i < 7 ? '#E2D4C8' : '#E5989B') : '#F0EFEB',
                          color: intensity >= i + 1 ? '#FFFFFF' : '#A3B1AA'
                        }}
                      >
                        {i + 1}
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
                onClick={startUrge}
                className="w-full h-14 rounded-full text-white text-lg font-medium transition-all duration-300 hover:-translate-y-0.5"
                style={{ background: '#E5989B' }}
              >
                <Flame className="w-5 h-5 mr-2" strokeWidth={1.5} />
                Start Timer - I Can Do This
              </Button>
            </motion.div>
          )}

          {/* ACTIVE PHASE */}
          {phase === 'active' && (
            <motion.div
              key="active"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              {/* Timer Display */}
              <div className="text-center py-8">
                <div className="relative w-48 h-48 mx-auto mb-6">
                  <svg className="w-48 h-48 -rotate-90" viewBox="0 0 200 200">
                    <circle cx="100" cy="100" r="90" fill="none" stroke="#E8E6E1" strokeWidth="4" />
                    <circle
                      cx="100" cy="100" r="90" fill="none" stroke="#6B9080" strokeWidth="4"
                      strokeDasharray={`${2 * Math.PI * 90}`}
                      strokeDashoffset={`${2 * Math.PI * 90 * (1 - progress / 100)}`}
                      strokeLinecap="round"
                      className="transition-all duration-1000"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="font-heading text-4xl font-light" style={{ color: '#2A3A35' }}>
                      {formatTime(timeLeft)}
                    </span>
                    <span className="text-xs mt-1" style={{ color: '#A3B1AA' }}>remaining</span>
                  </div>
                </div>

                <p className="text-lg italic max-w-sm mx-auto" style={{ color: '#7A8B85', fontFamily: 'Figtree, sans-serif' }}>
                  "{encouragement}"
                </p>

                <div className="flex justify-center gap-3 mt-6">
                  <Button
                    data-testid="pause-timer-btn"
                    onClick={() => setIsRunning(!isRunning)}
                    variant="outline"
                    className="rounded-full px-6"
                    style={{ border: '1px solid #E8E6E1' }}
                  >
                    {isRunning ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
                    {isRunning ? 'Pause' : 'Resume'}
                  </Button>
                </div>
              </div>

              {/* Tabs for coping tools */}
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
                          "{motivations[Math.floor(Math.random() * motivations.length)]?.message}"
                        </p>
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="breathing" className="mt-4">
                  <div className="rounded-2xl p-8 text-center" style={{ background: '#FFFFFF', border: '1px solid #E8E6E1' }}>
                    <motion.div
                      className="w-32 h-32 rounded-full mx-auto mb-6"
                      style={{ background: '#A8DADC' }}
                      animate={{
                        scale: breathPhase === 'inhale' ? 1.5 : breathPhase === 'hold' ? 1.5 : 1,
                        opacity: breathPhase === 'exhale' ? 0.6 : 1,
                      }}
                      transition={{ duration: breathPhase === 'exhale' ? 6 : 4, ease: 'easeInOut' }}
                    />
                    <p className="text-xl font-heading font-medium capitalize" style={{ color: '#2A3A35' }}>
                      {breathPhase}
                    </p>
                    <p className="text-sm mt-1" style={{ color: '#A3B1AA' }}>
                      {breathPhase === 'inhale' ? 'Breathe in slowly... 4 seconds' :
                       breathPhase === 'hold' ? 'Hold gently... 4 seconds' :
                       'Release slowly... 6 seconds'}
                    </p>
                  </div>
                </TabsContent>

                <TabsContent value="grounding" className="mt-4">
                  <div className="rounded-2xl p-6" style={{ background: '#FFFFFF', border: '1px solid #E8E6E1' }}>
                    <h3 className="text-sm font-medium uppercase tracking-wider mb-2" style={{ color: '#A3B1AA' }}>
                      5-4-3-2-1 Grounding
                    </h3>
                    <div className="space-y-3">
                      {GROUNDING_STEPS.map((step, i) => (
                        <button
                          key={i}
                          data-testid={`grounding-step-${i}`}
                          onClick={() => setGroundingStep(i)}
                          className="w-full text-left p-4 rounded-xl transition-all duration-200"
                          style={{
                            background: groundingStep === i ? '#A4C3B222' : '#F9F8F6',
                            border: groundingStep === i ? '1px solid #A4C3B2' : '1px solid transparent'
                          }}
                        >
                          <div className="flex items-center gap-3">
                            <span className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium"
                              style={{ background: groundingStep >= i ? '#6B9080' : '#E8E6E1', color: groundingStep >= i ? '#FFF' : '#A3B1AA' }}
                            >
                              {step.count}
                            </span>
                            <div>
                              <p className="text-sm font-medium" style={{ color: '#2A3A35' }}>{step.sense}</p>
                              <p className="text-xs" style={{ color: '#7A8B85' }}>{step.instruction}</p>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="coping" className="mt-4">
                  <div className="rounded-2xl p-6 space-y-3" style={{ background: '#FFFFFF', border: '1px solid #E8E6E1' }}>
                    <h3 className="text-sm font-medium uppercase tracking-wider mb-2" style={{ color: '#A3B1AA' }}>
                      Do this instead
                    </h3>
                    {COPING_SUGGESTIONS.map((item, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-4 p-4 rounded-xl transition-all duration-200 hover:-translate-y-px cursor-pointer"
                        style={{ background: '#F9F8F6' }}
                      >
                        <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: '#A4C3B244' }}>
                          <item.icon className="w-5 h-5" style={{ color: '#6B9080' }} strokeWidth={1.5} />
                        </div>
                        <div>
                          <p className="text-sm font-medium" style={{ color: '#2A3A35' }}>{item.label}</p>
                          <p className="text-xs" style={{ color: '#A3B1AA' }}>{item.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>

              {/* Outcome Buttons */}
              <div className="flex gap-3">
                <Button
                  data-testid="resisted-btn"
                  onClick={() => handleOutcome('resisted')}
                  className="flex-1 h-12 rounded-full text-white font-medium"
                  style={{ background: '#6B9080' }}
                >
                  <Check className="w-4 h-4 mr-2" strokeWidth={2} />
                  I Resisted
                </Button>
                <Button
                  data-testid="relapsed-btn"
                  onClick={() => handleOutcome('relapsed')}
                  variant="outline"
                  className="flex-1 h-12 rounded-full font-medium"
                  style={{ border: '1px solid #E8E6E1', color: '#7A8B85' }}
                >
                  I Slipped
                </Button>
              </div>
            </motion.div>
          )}

          {/* COMPLETE PHASE */}
          {phase === 'complete' && (
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
                  onClick={() => handleOutcome('resisted')}
                  className="flex-1 h-12 rounded-full text-white font-medium"
                  style={{ background: '#6B9080' }}
                >
                  I Resisted!
                </Button>
                <Button
                  data-testid="complete-slipped-btn"
                  onClick={() => handleOutcome('relapsed')}
                  variant="outline"
                  className="flex-1 h-12 rounded-full font-medium"
                  style={{ border: '1px solid #E8E6E1', color: '#7A8B85' }}
                >
                  I Slipped
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AppLayout>
  );
}
