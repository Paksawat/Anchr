import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';

const API = `${process.env.REACT_APP_API_URL}/api`;

const UrgeTimerContext = createContext(null);

export function UrgeTimerProvider({ children }) {
  const [phase, setPhase] = useState('setup'); // 'setup' | 'active' | 'complete'
  const [timerDuration, setTimerDuration] = useState(300);
  const [timeLeft, setTimeLeft] = useState(300);
  const [isRunning, setIsRunning] = useState(false);
  const [trigger, setTrigger] = useState('');
  const [emotion, setEmotion] = useState('');
  const [notes, setNotes] = useState('');
  const [intensity, setIntensity] = useState(5);
  const [urgeType, setUrgeType] = useState('');
  const [customUrgeType, setCustomUrgeType] = useState('');
  const [currentUrgeId, setCurrentUrgeId] = useState(null);
  const [activeTab, setActiveTab] = useState('timer');
  const intervalRef = useRef(null);
  // Guards to prevent duplicate submissions from rapid taps
  const startingRef = useRef(false);
  const submittingRef = useRef(false);

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

  const startUrge = useCallback(async () => {
    // Guard: ignore if already starting or not in setup phase
    if (startingRef.current || phase !== 'setup') return;
    startingRef.current = true;

    // Transition immediately — feels instant, no waiting for the API
    setTimeLeft(timerDuration);
    setIsRunning(true);
    setPhase('active');

    // Create the urge record in background
    try {
      const res = await axios.post(
        `${API}/urges`,
        {
          trigger: trigger || null,
          emotion: emotion || null,
          notes: notes || null,
          intensity,
          urge_type: urgeType || null,
          custom_urge_type: urgeType === 'other' ? customUrgeType || null : null,
        },
        { withCredentials: true },
      );
      setCurrentUrgeId(res.data.urge_id);
    } catch (error) {
      console.error('Failed to create urge:', error);
    } finally {
      startingRef.current = false;
    }
  }, [trigger, emotion, notes, intensity, urgeType, customUrgeType, timerDuration, phase]);

  const togglePause = useCallback(() => {
    setIsRunning((prev) => !prev);
  }, []);

  const handleOutcome = useCallback(
    async (outcome, userObj) => {
      // Guard: ignore rapid double-taps
      if (submittingRef.current) return;
      submittingRef.current = true;

      // Snapshot values before resetting state
      const urgeId = currentUrgeId;
      const elapsed = timerDuration - timeLeft;
      const tab = activeTab;
      const trig = trigger;
      const emo = emotion;

      // Transition immediately — don't wait for API
      setPhase('setup');
      setIsRunning(false);
      clearInterval(intervalRef.current);
      setCurrentUrgeId(null);
      setTrigger('');
      setEmotion('');
      setNotes('');
      setUrgeType(userObj?.urge_type || '');
      setCustomUrgeType(userObj?.custom_urge_type || '');

      // Persist in background
      try {
        if (urgeId) {
          await axios.put(
            `${API}/urges/${urgeId}`,
            { outcome, duration_seconds: elapsed, coping_used: tab },
            { withCredentials: true },
          );
        }
        if (outcome === 'relapsed') {
          await axios.post(
            `${API}/relapses`,
            { trigger: trig || null, emotion: emo || null, notes: 'Logged from urge timer' },
            { withCredentials: true },
          );
        }
      } catch (error) {
        console.error('Failed to save outcome:', error);
      } finally {
        submittingRef.current = false;
      }
    },
    [currentUrgeId, timerDuration, timeLeft, activeTab, trigger, emotion],
  );

  const resetTimer = useCallback((userObj) => {
    clearInterval(intervalRef.current);
    startingRef.current = false;
    submittingRef.current = false;
    setPhase('setup');
    setIsRunning(false);
    setCurrentUrgeId(null);
    setTrigger('');
    setEmotion('');
    setNotes('');
    setUrgeType(userObj?.urge_type || '');
    setCustomUrgeType(userObj?.custom_urge_type || '');
  }, []);

  return (
    <UrgeTimerContext.Provider
      value={{
        phase,
        setPhase,
        timerDuration,
        setTimerDuration,
        timeLeft,
        setTimeLeft,
        isRunning,
        togglePause,
        trigger,
        setTrigger,
        emotion,
        setEmotion,
        notes,
        setNotes,
        intensity,
        setIntensity,
        urgeType,
        setUrgeType,
        customUrgeType,
        setCustomUrgeType,
        currentUrgeId,
        activeTab,
        setActiveTab,
        startUrge,
        handleOutcome,
        resetTimer,
      }}
    >
      {children}
    </UrgeTimerContext.Provider>
  );
}

export const useUrgeTimer = () => useContext(UrgeTimerContext);
