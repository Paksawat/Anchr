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
      setTimeLeft(timerDuration);
      setIsRunning(true);
      setPhase('active');
    } catch (error) {
      console.error('Failed to create urge:', error);
    }
  }, [trigger, emotion, notes, intensity, urgeType, customUrgeType, timerDuration]);

  const togglePause = useCallback(() => {
    setIsRunning((prev) => !prev);
  }, []);

  const handleOutcome = useCallback(
    async (outcome, userObj) => {
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
            { trigger: trigger || null, emotion: emotion || null, notes: 'Logged from urge timer' },
            { withCredentials: true },
          );
        } catch (error) {
          console.error('Failed to log relapse:', error);
        }
      }
      setPhase('setup');
      setIsRunning(false);
      setCurrentUrgeId(null);
      setTrigger('');
      setEmotion('');
      setNotes('');
      setUrgeType(userObj?.urge_type || '');
      setCustomUrgeType(userObj?.custom_urge_type || '');
    },
    [currentUrgeId, timerDuration, timeLeft, activeTab, trigger, emotion],
  );

  const resetTimer = useCallback((userObj) => {
    clearInterval(intervalRef.current);
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
