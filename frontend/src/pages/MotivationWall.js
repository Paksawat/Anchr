import React, { useState, useEffect } from 'react';
import AppLayout from '../components/AppLayout';
import { useLanguage } from '../contexts/LanguageContext';
import axios from 'axios';
import { Plus, Trash2, Quote, Sparkles } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Textarea } from '../components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../components/ui/dialog';
import { motion, AnimatePresence } from 'framer-motion';

const API = `/api`;
const CATEGORIES = [
  'general',
  'why_i_quit',
  'self_love',
  'future_self',
  'gratitude',
];

const categoryColor = (cat) =>
  ({
    general: '#6B9080',
    why_i_quit: '#E5989B',
    self_love: '#A8DADC',
    future_self: '#E2D4C8',
    gratitude: '#A4C3B2',
  })[cat] || '#6B9080';

export default function MotivationWall() {
  const { t } = useLanguage();
  const [motivations, setMotivations] = useState([]);
  const [message, setMessage] = useState('');
  const [category, setCategory] = useState('general');
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    (async () => {
      try {
        const res = await axios.get(`${API}/motivations`, {
          withCredentials: true,
        });
        setMotivations(res.data);
      } catch (error) {
        console.error('Failed to load motivations:', error);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleAdd = async () => {
    if (!message.trim()) return;
    try {
      const res = await axios.post(
        `${API}/motivations`,
        { message, category },
        { withCredentials: true },
      );
      setMotivations([res.data, ...motivations]);
      setMessage('');
      setCategory('general');
      setDialogOpen(false);
    } catch (error) {
      console.error('Failed to save motivation:', error);
    }
  };

  const handleDelete = async (motId) => {
    try {
      await axios.delete(`${API}/motivations/${motId}`, {
        withCredentials: true,
      });
      setMotivations(motivations.filter((m) => m.motivation_id !== motId));
    } catch (error) {
      console.error('Failed to delete motivation:', error);
    }
  };

  const filtered =
    filter === 'all'
      ? motivations
      : motivations.filter((m) => m.category === filter);

  return (
    <AppLayout>
      <div data-testid="motivation-page" className="space-y-6">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1
              className="font-heading text-4xl sm:text-5xl font-light tracking-tight"
              style={{ color: '#2A3A35' }}
            >
              {t('motivation_wall')}
            </h1>
            <p
              className="mt-2"
              style={{ color: '#7A8B85', fontFamily: 'Figtree, sans-serif' }}
            >
              {t('motivation_subtitle')}
            </p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button
                data-testid="add-motivation-dialog-btn"
                className="rounded-full text-white font-medium shrink-0"
                style={{ background: '#6B9080' }}
              >
                <Plus className="w-4 h-4 sm:mr-2" strokeWidth={1.5} />
                <span className="hidden sm:inline">{t('add_message')}</span>
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
                  {t('new_motivation')}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <label
                    className="text-sm mb-2 block"
                    style={{ color: '#7A8B85' }}
                  >
                    {t('category')}
                  </label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger
                      data-testid="motivation-category-select"
                      className="rounded-xl"
                      style={{ border: '1px solid #E8E6E1' }}
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((c) => (
                        <SelectItem key={c} value={c}>
                          {t(c)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Textarea
                  data-testid="motivation-message-input"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={t('write_motivation_placeholder')}
                  className="rounded-xl resize-none min-h-[120px]"
                  style={{ border: '1px solid #E8E6E1' }}
                />
                <Button
                  data-testid="save-motivation-btn"
                  onClick={handleAdd}
                  disabled={!message.trim()}
                  className="w-full rounded-full text-white font-medium h-11"
                  style={{ background: '#6B9080' }}
                >
                  {t('save_message')}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="flex gap-2 flex-wrap">
          <button
            data-testid="filter-all"
            onClick={() => setFilter('all')}
            className="px-4 py-2 rounded-full text-sm font-medium transition-all duration-200"
            style={{
              background: filter === 'all' ? '#6B9080' : '#F0EFEB',
              color: filter === 'all' ? '#FFFFFF' : '#7A8B85',
            }}
          >
            {t('all')}
          </button>
          {CATEGORIES.map((c) => (
            <button
              key={c}
              data-testid={`filter-${c}`}
              onClick={() => setFilter(c)}
              className="px-4 py-2 rounded-full text-sm font-medium transition-all duration-200"
              style={{
                background: filter === c ? categoryColor(c) : '#F0EFEB',
                color: filter === c ? '#FFFFFF' : '#7A8B85',
              }}
            >
              {t(c)}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div
              className="w-10 h-10 rounded-full animate-pulse"
              style={{ background: '#A4C3B2' }}
            />
          </div>
        ) : filtered.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence>
              {filtered.map((mot, i) => (
                <motion.div
                  key={mot.motivation_id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: i * 0.05 }}
                  className="rounded-2xl p-6 shadow-sm group relative transition-all duration-200 hover:-translate-y-1 hover:shadow-md"
                  style={{ background: '#FFFFFF', border: '1px solid #E8E6E1' }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <span
                      className="text-xs px-3 py-1 rounded-full font-medium"
                      style={{
                        background: `${categoryColor(mot.category)}22`,
                        color: categoryColor(mot.category),
                      }}
                    >
                      {t(mot.category) || mot.category}
                    </span>
                    <button
                      data-testid={`delete-motivation-${mot.motivation_id}`}
                      onClick={() => handleDelete(mot.motivation_id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-lg"
                      style={{ color: '#A3B1AA' }}
                    >
                      <Trash2 className="w-4 h-4" strokeWidth={1.5} />
                    </button>
                  </div>
                  <Quote
                    className="w-6 h-6 mb-2 opacity-20"
                    style={{ color: categoryColor(mot.category) }}
                    strokeWidth={1.5}
                  />
                  <p
                    className="text-base leading-relaxed"
                    style={{
                      color: '#2A3A35',
                      fontFamily: 'Figtree, sans-serif',
                    }}
                  >
                    {mot.message}
                  </p>
                  <p className="text-xs mt-3" style={{ color: '#A3B1AA' }}>
                    {new Date(mot.created_at).toLocaleDateString()}
                  </p>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div className="text-center py-16">
            <div
              className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
              style={{ background: '#F0EFEB' }}
            >
              <Sparkles
                className="w-8 h-8"
                style={{ color: '#A3B1AA' }}
                strokeWidth={1.5}
              />
            </div>
            <h3 className="font-heading text-xl" style={{ color: '#2A3A35' }}>
              {t('no_messages_yet')}
            </h3>
            <p className="mt-2 text-sm" style={{ color: '#A3B1AA' }}>
              {t('write_encouragement')}
            </p>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
