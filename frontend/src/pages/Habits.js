import React, { useState, useEffect } from 'react';
import AppLayout from '../components/AppLayout';
import UpgradePrompt from '../components/UpgradePrompt';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import {
  Check,
  Plus,
  Trash2,
  Droplets,
  Footprints,
  BookOpen,
  Brain,
  Phone,
  Wind,
  Moon,
  Dumbbell,
  Heart,
  Smartphone,
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../components/ui/dialog';

const API = `${process.env.REACT_APP_API_URL}/api`;

const ICON_MAP = {
  droplets: Droplets,
  footprints: Footprints,
  'book-open': BookOpen,
  brain: Brain,
  phone: Phone,
  wind: Wind,
  moon: Moon,
  dumbbell: Dumbbell,
  heart: Heart,
  'smartphone-off': Smartphone,
  check: Check,
};

function HabitRow({ habit, completed, onToggle, onDelete }) {
  const Icon = ICON_MAP[habit.icon] || Check;
  const today = new Date().toISOString().slice(0, 10);
  const isCompletedToday = completed.some(
    (c) => c.habit_id === habit.habit_id && c.date === today,
  );

  return (
    <div
      className="flex items-center gap-3 p-4 rounded-xl transition-all duration-200"
      style={{
        background: isCompletedToday ? '#6B908010' : '#FFFFFF',
        border: `1px solid ${isCompletedToday ? '#6B908044' : '#E8E6E1'}`,
      }}
    >
      <button
        data-testid={`habit-toggle-${habit.habit_id}`}
        onClick={() => onToggle(habit.habit_id, today)}
        className="w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 shrink-0"
        style={{ background: isCompletedToday ? '#6B9080' : '#F0EFEB' }}
      >
        {isCompletedToday ? (
          <Check className="w-5 h-5 text-white" strokeWidth={2} />
        ) : (
          <Icon
            className="w-5 h-5"
            style={{ color: '#A3B1AA' }}
            strokeWidth={1.5}
          />
        )}
      </button>
      <div className="flex-1 min-w-0">
        <p
          className="text-sm font-medium"
          style={{
            color: isCompletedToday ? '#6B9080' : '#2A3A35',
            textDecoration: isCompletedToday ? 'line-through' : 'none',
          }}
        >
          {habit.name}
        </p>
        <p className="text-xs" style={{ color: '#A3B1AA' }}>
          {habit.category}
        </p>
      </div>
      <button
        onClick={() => onDelete(habit.habit_id)}
        className="p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
        style={{ color: '#A3B1AA' }}
      >
        <Trash2 className="w-4 h-4" strokeWidth={1.5} />
      </button>
    </div>
  );
}

export default function Habits() {
  const { user } = useAuth();
  const [habits, setHabits] = useState([]);
  const [presets, setPresets] = useState([]);
  const [completions, setCompletions] = useState([]);
  const [customName, setCustomName] = useState('');
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const isPaid = user?.tier === 'paid';

  useEffect(() => {
    Promise.all([
      axios.get(`${API}/habits`, { withCredentials: true }),
      axios.get(`${API}/habits/presets`, { withCredentials: true }),
      axios.get(`${API}/habits/completions`, { withCredentials: true }),
    ])
      .then(([hRes, pRes, cRes]) => {
        setHabits(hRes.data);
        setPresets(pRes.data);
        setCompletions(cRes.data);
      })
      .catch((err) => console.error('Failed to load habits:', err))
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const addPresetHabit = async (preset) => {
    try {
      const res = await axios.post(
        `${API}/habits`,
        {
          name: preset.name,
          icon: preset.icon,
          category: preset.category,
          habit_id: preset.habit_id,
        },
        { withCredentials: true },
      );
      if (!habits.find((h) => h.habit_id === res.data.habit_id)) {
        setHabits([...habits, res.data]);
      }
    } catch (error) {
      console.error('Failed to add habit:', error);
    }
  };

  const addCustomHabit = async () => {
    if (!customName.trim()) return;
    try {
      const res = await axios.post(
        `${API}/habits`,
        { name: customName, icon: 'check', category: 'custom' },
        { withCredentials: true },
      );
      setHabits([...habits, res.data]);
      setCustomName('');
      setAddDialogOpen(false);
    } catch (error) {
      console.error('Failed to add custom habit:', error);
    }
  };

  const toggleHabit = async (habitId, date) => {
    try {
      const res = await axios.post(
        `${API}/habits/${habitId}/toggle`,
        { date },
        { withCredentials: true },
      );
      if (res.data.completed) {
        setCompletions([...completions, { habit_id: habitId, date }]);
      } else {
        setCompletions(
          completions.filter(
            (c) => !(c.habit_id === habitId && c.date === date),
          ),
        );
      }
    } catch (error) {
      console.error('Failed to toggle habit:', error);
    }
  };

  const deleteHabit = async (habitId) => {
    try {
      await axios.delete(`${API}/habits/${habitId}`, { withCredentials: true });
      setHabits(habits.filter((h) => h.habit_id !== habitId));
    } catch (error) {
      console.error('Failed to delete habit:', error);
    }
  };

  const today = new Date().toISOString().slice(0, 10);
  const todayCompleted = completions.filter((c) => c.date === today).length;
  const todayTotal = habits.length;
  const streak = (() => {
    let s = 0;
    for (let i = 0; i < 365; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      const dayCompletions = completions.filter((c) => c.date === dateStr);
      if (dayCompletions.length >= habits.length && habits.length > 0) s++;
      else if (i > 0) break;
    }
    return s;
  })();

  const content = (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1
            className="font-heading text-4xl sm:text-5xl font-light tracking-tight"
            style={{ color: '#2A3A35' }}
          >
            Daily Habits
          </h1>
          <p
            className="mt-2"
            style={{ color: '#7A8B85', fontFamily: 'Figtree, sans-serif' }}
          >
            Build routines that replace old patterns
          </p>
        </div>
        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogTrigger asChild>
            <Button
              data-testid="add-habit-btn"
              className="rounded-full text-white font-medium"
              style={{ background: '#6B9080' }}
            >
              <Plus className="w-4 h-4 mr-2" strokeWidth={1.5} /> Add Habit
            </Button>
          </DialogTrigger>
          <DialogContent
            className="rounded-2xl max-h-[80vh] overflow-y-auto"
            style={{ border: '1px solid #E8E6E1' }}
          >
            <DialogHeader>
              <DialogTitle
                className="font-heading text-xl"
                style={{ color: '#2A3A35' }}
              >
                Add a Habit
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <p
                  className="text-sm font-medium mb-3"
                  style={{ color: '#7A8B85' }}
                >
                  Suggested habits
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {presets
                    .filter(
                      (p) => !habits.find((h) => h.habit_id === p.habit_id),
                    )
                    .map((p) => {
                      const Icon = ICON_MAP[p.icon] || Check;
                      return (
                        <button
                          key={p.habit_id}
                          data-testid={`preset-${p.habit_id}`}
                          onClick={() => addPresetHabit(p)}
                          className="flex items-center gap-2 p-3 rounded-xl text-left transition-all duration-200 hover:-translate-y-px"
                          style={{
                            background: '#F9F8F6',
                            border: '1px solid #E8E6E1',
                          }}
                        >
                          <Icon
                            className="w-4 h-4 shrink-0"
                            style={{ color: '#6B9080' }}
                            strokeWidth={1.5}
                          />
                          <span
                            className="text-sm"
                            style={{ color: '#2A3A35' }}
                          >
                            {p.name}
                          </span>
                        </button>
                      );
                    })}
                </div>
              </div>
              <div className="pt-3 border-t" style={{ borderColor: '#E8E6E1' }}>
                <p
                  className="text-sm font-medium mb-2"
                  style={{ color: '#7A8B85' }}
                >
                  Or create your own
                </p>
                <div className="flex gap-2">
                  <Input
                    data-testid="custom-habit-input"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    placeholder="Habit name..."
                    className="rounded-xl flex-1"
                    style={{ border: '1px solid #E8E6E1' }}
                  />
                  <Button
                    data-testid="save-custom-habit"
                    onClick={addCustomHabit}
                    disabled={!customName.trim()}
                    className="rounded-xl text-white"
                    style={{ background: '#6B9080' }}
                  >
                    Add
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Today's progress */}
      <div
        className="rounded-2xl p-6 shadow-sm"
        style={{ background: '#FFFFFF', border: '1px solid #E8E6E1' }}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm" style={{ color: '#A3B1AA' }}>
              Today
            </p>
            <p
              className="font-heading text-2xl font-light"
              style={{ color: '#2A3A35' }}
            >
              {todayCompleted}/{todayTotal} completed
            </p>
          </div>
          {streak > 0 && (
            <div className="text-right">
              <p className="text-sm" style={{ color: '#A3B1AA' }}>
                Streak
              </p>
              <p
                className="font-heading text-2xl font-light"
                style={{ color: '#6B9080' }}
              >
                {streak} days
              </p>
            </div>
          )}
        </div>
        {todayTotal > 0 && (
          <div className="h-3 rounded-full" style={{ background: '#F0EFEB' }}>
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${(todayCompleted / todayTotal) * 100}%`,
                background: '#6B9080',
              }}
            />
          </div>
        )}
      </div>

      {/* Habit list */}
      {habits.length > 0 ? (
        <div className="space-y-3">
          {habits.map((h) => (
            <HabitRow
              key={h.habit_id}
              habit={h}
              completed={completions}
              onToggle={toggleHabit}
              onDelete={deleteHabit}
            />
          ))}
        </div>
      ) : (
        <div
          className="rounded-2xl p-8 text-center shadow-sm"
          style={{ background: '#FFFFFF', border: '1px solid #E8E6E1' }}
        >
          <p className="text-sm" style={{ color: '#A3B1AA' }}>
            No habits yet. Add some to start building your routine.
          </p>
        </div>
      )}
    </div>
  );

  return (
    <AppLayout>
      <div data-testid="habits-page">
        {isPaid ? (
          content
        ) : (
          <UpgradePrompt feature="Habit System">{content}</UpgradePrompt>
        )}
      </div>
    </AppLayout>
  );
}
