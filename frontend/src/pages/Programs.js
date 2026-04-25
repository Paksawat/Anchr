import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '../components/AppLayout';
import UpgradePrompt from '../components/UpgradePrompt';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import {
  BookOpen,
  Zap,
  Flame,
  Target,
  Moon,
  Check,
  Lock,
  ChevronRight,
  ArrowLeft,
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Textarea } from '../components/ui/textarea';
import { motion } from 'framer-motion';

const API = `/api`;

const ICONS = { zap: Zap, flame: Flame, target: Target, moon: Moon };

function ProgramCard({ prog, onClick }) {
  const Icon = ICONS[prog.icon] || BookOpen;
  const progress =
    prog.enrolled && prog.duration_days
      ? Math.round((prog.completed_days.length / prog.duration_days) * 100)
      : 0;

  return (
    <button
      data-testid={`program-${prog.program_id}`}
      onClick={onClick}
      className="rounded-2xl p-6 text-left shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md w-full"
      style={{ background: '#FFFFFF', border: '1px solid #E8E6E1' }}
    >
      <div className="flex items-start justify-between mb-4">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center"
          style={{ background: '#6B908015' }}
        >
          <Icon
            className="w-6 h-6"
            style={{ color: '#6B9080' }}
            strokeWidth={1.5}
          />
        </div>
        <span
          className="text-xs px-3 py-1 rounded-full font-medium"
          style={{ background: '#F0EFEB', color: '#7A8B85' }}
        >
          {prog.duration_days} days
        </span>
      </div>
      <h3
        className="font-heading text-lg font-medium mb-1"
        style={{ color: '#2A3A35' }}
      >
        {prog.title}
      </h3>
      <p className="text-sm mb-4" style={{ color: '#7A8B85' }}>
        {prog.description}
      </p>
      {prog.enrolled && (
        <div>
          <div className="flex items-center justify-between text-xs mb-1">
            <span style={{ color: '#6B9080' }}>
              {prog.completed_days.length}/{prog.duration_days} days
            </span>
            <span style={{ color: '#A3B1AA' }}>{progress}%</span>
          </div>
          <div className="h-2 rounded-full" style={{ background: '#F0EFEB' }}>
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${progress}%`, background: '#6B9080' }}
            />
          </div>
        </div>
      )}
      {!prog.enrolled && (
        <div
          className="flex items-center gap-1 text-sm font-medium"
          style={{ color: '#6B9080' }}
        >
          Start program <ChevronRight className="w-4 h-4" strokeWidth={1.5} />
        </div>
      )}
    </button>
  );
}

function ProgramDetail({ program, onBack }) {
  const [reflection, setReflection] = useState('');
  const [completedDays, setCompletedDays] = useState(
    program.completed_days || [],
  );
  const [enrolled, setEnrolled] = useState(program.enrolled);
  const currentDay = completedDays.length + 1;
  const todayData = program.days?.find((d) => d.day === currentDay);

  const handleEnroll = async () => {
    try {
      await axios.post(
        `${API}/programs/${program.program_id}/enroll`,
        {},
        { withCredentials: true },
      );
      setEnrolled(true);
    } catch (error) {
      console.error('Enroll failed:', error);
    }
  };

  const handleCompleteDay = async (day) => {
    try {
      const res = await axios.post(
        `${API}/programs/${program.program_id}/complete-day`,
        { day, reflection: reflection || null },
        { withCredentials: true },
      );
      setCompletedDays(res.data.completed_days);
      setReflection('');
    } catch (error) {
      console.error('Complete day failed:', error);
    }
  };

  const Icon = ICONS[program.icon] || BookOpen;

  return (
    <div className="space-y-6">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-sm font-medium"
        style={{ color: '#7A8B85' }}
      >
        <ArrowLeft className="w-4 h-4" strokeWidth={1.5} /> Back to programs
      </button>

      <div
        className="rounded-2xl p-8 shadow-sm"
        style={{ background: '#FFFFFF', border: '1px solid #E8E6E1' }}
      >
        <div className="flex items-center gap-4 mb-4">
          <div
            className="w-14 h-14 rounded-xl flex items-center justify-center"
            style={{ background: '#6B908015' }}
          >
            <Icon
              className="w-7 h-7"
              style={{ color: '#6B9080' }}
              strokeWidth={1.5}
            />
          </div>
          <div>
            <h1
              className="font-heading text-2xl font-medium"
              style={{ color: '#2A3A35' }}
            >
              {program.title}
            </h1>
            <p className="text-sm" style={{ color: '#7A8B85' }}>
              {program.description}
            </p>
          </div>
        </div>
        {enrolled && (
          <div className="mt-4">
            <div className="flex items-center justify-between text-sm mb-2">
              <span style={{ color: '#6B9080' }}>
                Day {Math.min(currentDay, program.duration_days)} of{' '}
                {program.duration_days}
              </span>
              <span style={{ color: '#A3B1AA' }}>
                {Math.round(
                  (completedDays.length / program.duration_days) * 100,
                )}
                %
              </span>
            </div>
            <div className="h-3 rounded-full" style={{ background: '#F0EFEB' }}>
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${(completedDays.length / program.duration_days) * 100}%`,
                  background: '#6B9080',
                }}
              />
            </div>
          </div>
        )}
        {!enrolled && (
          <Button
            data-testid="enroll-btn"
            onClick={handleEnroll}
            className="mt-4 rounded-full text-white font-medium"
            style={{ background: '#6B9080' }}
          >
            Start this program
          </Button>
        )}
      </div>

      {enrolled && todayData && currentDay <= program.duration_days && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl p-6 shadow-sm"
          style={{ background: '#FFFFFF', border: '1px solid #E8E6E1' }}
        >
          <span
            className="text-xs font-medium uppercase tracking-wider"
            style={{ color: '#A3B1AA' }}
          >
            Day {currentDay}
          </span>
          <h2
            className="font-heading text-xl font-medium mt-1 mb-4"
            style={{ color: '#2A3A35' }}
          >
            {todayData.title}
          </h2>
          <div className="space-y-4">
            <div className="p-4 rounded-xl" style={{ background: '#F9F8F6' }}>
              <span
                className="text-xs font-medium uppercase tracking-wider"
                style={{ color: '#6B9080' }}
              >
                Insight
              </span>
              <p
                className="text-sm mt-1 leading-relaxed"
                style={{ color: '#2A3A35' }}
              >
                {todayData.insight}
              </p>
            </div>
            <div className="p-4 rounded-xl" style={{ background: '#A4C3B215' }}>
              <span
                className="text-xs font-medium uppercase tracking-wider"
                style={{ color: '#6B9080' }}
              >
                Today's Action
              </span>
              <p
                className="text-sm mt-1 leading-relaxed font-medium"
                style={{ color: '#2A3A35' }}
              >
                {todayData.action}
              </p>
            </div>
            <div>
              <span
                className="text-xs font-medium uppercase tracking-wider"
                style={{ color: '#A3B1AA' }}
              >
                Reflection (optional)
              </span>
              <p
                className="text-sm mt-1 mb-2 italic"
                style={{ color: '#7A8B85' }}
              >
                {todayData.reflection}
              </p>
              <Textarea
                data-testid="program-reflection"
                value={reflection}
                onChange={(e) => setReflection(e.target.value)}
                placeholder="Write your thoughts..."
                className="rounded-xl resize-none"
                style={{ border: '1px solid #E8E6E1' }}
                rows={3}
              />
            </div>
            <Button
              data-testid="complete-day-btn"
              onClick={() => handleCompleteDay(currentDay)}
              className="w-full rounded-full text-white font-medium h-11"
              style={{ background: '#6B9080' }}
            >
              <Check className="w-4 h-4 mr-2" strokeWidth={2} /> Complete Day{' '}
              {currentDay}
            </Button>
          </div>
        </motion.div>
      )}

      {enrolled && completedDays.length >= program.duration_days && (
        <div
          className="rounded-2xl p-8 text-center shadow-sm"
          style={{ background: '#FFFFFF', border: '1px solid #E8E6E1' }}
        >
          <div
            className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
            style={{ background: '#A4C3B2' }}
          >
            <Check className="w-8 h-8 text-white" strokeWidth={1.5} />
          </div>
          <h2
            className="font-heading text-2xl font-medium"
            style={{ color: '#2A3A35' }}
          >
            Program Complete!
          </h2>
          <p className="text-sm mt-2" style={{ color: '#7A8B85' }}>
            You have finished all {program.duration_days} days. Well done.
          </p>
        </div>
      )}

      {/* Day timeline */}
      {enrolled && (
        <div
          className="rounded-2xl p-6 shadow-sm"
          style={{ background: '#FFFFFF', border: '1px solid #E8E6E1' }}
        >
          <h3
            className="font-heading text-lg font-medium mb-4"
            style={{ color: '#2A3A35' }}
          >
            Journey
          </h3>
          <div className="grid grid-cols-7 gap-2">
            {program.days?.map((d) => (
              <div key={d.day} className="flex flex-col items-center">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium"
                  style={{
                    background: completedDays.includes(d.day)
                      ? '#6B9080'
                      : d.day === currentDay
                        ? '#E5989B'
                        : '#F0EFEB',
                    color: completedDays.includes(d.day)
                      ? '#FFF'
                      : d.day === currentDay
                        ? '#FFF'
                        : '#A3B1AA',
                  }}
                >
                  {completedDays.includes(d.day) ? (
                    <Check className="w-3.5 h-3.5" strokeWidth={2} />
                  ) : (
                    d.day
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function Programs() {
  const { user } = useAuth();
  const [programs, setPrograms] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [selectedDetail, setSelectedDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const isPaid = user?.tier === 'paid';

  useEffect(() => {
    axios
      .get(`${API}/programs`, { withCredentials: true })
      .then((res) => setPrograms(res.data))
      .catch((err) => console.error('Failed to load programs:', err))
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const openProgram = async (programId) => {
    try {
      const res = await axios.get(`${API}/programs/${programId}`, {
        withCredentials: true,
      });
      setSelectedDetail(res.data);
      setSelectedId(programId);
    } catch (error) {
      console.error('Failed to load program:', error);
    }
  };

  const content = (
    <div className="space-y-6">
      <div>
        <h1
          className="font-heading text-4xl sm:text-5xl font-light tracking-tight"
          style={{ color: '#2A3A35' }}
        >
          Programs
        </h1>
        <p
          className="mt-2"
          style={{ color: '#7A8B85', fontFamily: 'Figtree, sans-serif' }}
        >
          Guided journeys for lasting change
        </p>
      </div>
      {selectedId && selectedDetail ? (
        <ProgramDetail
          program={selectedDetail}
          onBack={() => {
            setSelectedId(null);
            setSelectedDetail(null);
          }}
        />
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {programs.map((p) => (
            <ProgramCard
              key={p.program_id}
              prog={p}
              onClick={() => openProgram(p.program_id)}
            />
          ))}
        </div>
      )}
    </div>
  );

  return (
    <AppLayout>
      <div data-testid="programs-page">
        {isPaid ? (
          content
        ) : (
          <UpgradePrompt feature="Guided Programs">{content}</UpgradePrompt>
        )}
      </div>
    </AppLayout>
  );
}
