import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Lock, Mail, ArrowRight, Eye, EyeOff, Check, X } from 'lucide-react';

const API = `${import.meta.env.VITE_API_URL}/api`;

function PasswordInput({ value, onChange, placeholder, label, showStrength = false }) {
  const [show, setShow] = useState(false);
  return (
    <div>
      {label && <Label className="text-sm mb-2 block" style={{ color: '#7A8B85' }}>{label}</Label>}
      <div className="relative">
        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#A3B1AA' }} strokeWidth={1.5} />
        <Input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="pl-10 pr-10 rounded-xl h-12"
          style={{ border: '1px solid #E8E6E1', background: '#FFFFFF' }}
          required
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          className="absolute right-3 top-1/2 -translate-y-1/2"
          style={{ color: '#A3B1AA' }}
          tabIndex={-1}
        >
          {show ? <EyeOff className="w-4 h-4" strokeWidth={1.5} /> : <Eye className="w-4 h-4" strokeWidth={1.5} />}
        </button>
      </div>
      {showStrength && value.length > 0 && (
        <div className="mt-2 space-y-1">
          <StrengthRule ok={value.length >= 6} label="At least 6 characters" />
          <StrengthRule ok={/\d/.test(value)} label="At least 1 number" />
        </div>
      )}
    </div>
  );
}

function StrengthRule({ ok, label }) {
  return (
    <div className="flex items-center gap-1.5 text-xs" style={{ color: ok ? '#6B9080' : '#A3B1AA' }}>
      {ok ? <Check className="w-3 h-3" strokeWidth={2.5} /> : <X className="w-3 h-3" strokeWidth={2.5} />}
      {label}
    </div>
  );
}

function isPasswordValid(pw) {
  return pw.length >= 6 && /\d/.test(pw);
}

export default function ResetPasswordPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [expired, setExpired] = useState(false);
  const [resendEmail, setResendEmail] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  const [resendDone, setResendDone] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Count down the resend cooldown
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const id = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(id);
  }, [resendCooldown]);

  // No token in URL — treat as invalid
  useEffect(() => {
    if (!token) setExpired(true);
  }, [token]);

  const passwordsMatch = confirm.length === 0 || password === confirm;
  const canSubmit = isPasswordValid(password) && password === confirm;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    setError('');
    setLoading(true);
    try {
      await axios.post(`${API}/auth/reset-password`, { token, password });
      setDone(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      const detail = err.response?.data?.detail || '';
      if (detail.toLowerCase().includes('expir') || detail.toLowerCase().includes('invalid')) {
        setExpired(true);
      } else {
        setError(detail || 'Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async (e) => {
    e.preventDefault();
    if (!resendEmail.trim() || resendCooldown > 0) return;
    setResendLoading(true);
    try {
      await axios.post(`${API}/auth/forgot-password`, { email: resendEmail });
    } catch {
      // swallow — always show generic success
    } finally {
      setResendLoading(false);
      setResendDone(true);
      setResendCooldown(60);
    }
  };

  // ── Success state ──
  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: '#F9F8F6' }}>
        <div className="w-full max-w-md text-center">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5" style={{ background: '#6B908020' }}>
            <Check className="w-8 h-8" style={{ color: '#6B9080' }} strokeWidth={2} />
          </div>
          <h1 className="font-heading text-2xl font-light tracking-tight mb-3" style={{ color: '#2A3A35' }}>
            {t('reset_success_title')}
          </h1>
          <p className="text-sm mb-6" style={{ color: '#7A8B85' }}>{t('reset_success_desc')}</p>
          <Button
            onClick={() => navigate('/login')}
            className="h-12 px-8 rounded-full text-white font-medium"
            style={{ background: '#6B9080' }}
          >
            {t('sign_in')} <ArrowRight className="w-4 h-4 ml-2" strokeWidth={1.5} />
          </Button>
        </div>
      </div>
    );
  }

  // ── Expired / invalid link ──
  if (expired) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: '#F9F8F6' }}>
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: '#FDF2F2' }}>
              <X className="w-7 h-7" style={{ color: '#E5989B' }} strokeWidth={2} />
            </div>
            <h1 className="font-heading text-2xl font-light tracking-tight mb-2" style={{ color: '#2A3A35' }}>
              {t('reset_expired_title')}
            </h1>
            <p className="text-sm" style={{ color: '#7A8B85' }}>{t('reset_expired_desc')}</p>
          </div>

          {!resendDone ? (
            <div className="rounded-3xl p-8 shadow-sm" style={{ background: '#FFFFFF', border: '1px solid #E8E6E1' }}>
              <p className="text-sm font-medium mb-4" style={{ color: '#7A8B85' }}>{t('reset_resend_prompt')}</p>
              <form onSubmit={handleResend} className="space-y-4">
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#A3B1AA' }} strokeWidth={1.5} />
                  <Input
                    type="email"
                    value={resendEmail}
                    onChange={(e) => setResendEmail(e.target.value)}
                    placeholder={t('email_placeholder')}
                    className="pl-10 rounded-xl h-12"
                    style={{ border: '1px solid #E8E6E1', background: '#FFFFFF' }}
                    required
                  />
                </div>
                <Button
                  type="submit"
                  disabled={resendLoading || resendCooldown > 0 || !resendEmail.trim()}
                  className="w-full h-12 rounded-full text-white font-medium flex items-center justify-center gap-2"
                  style={{ background: '#6B9080' }}
                >
                  {resendCooldown > 0
                    ? `${t('resend_wait')} ${resendCooldown}s`
                    : resendLoading
                      ? t('please_wait')
                      : t('send_reset_link')}
                  {!resendLoading && resendCooldown === 0 && <ArrowRight className="w-4 h-4" strokeWidth={1.5} />}
                </Button>
              </form>
            </div>
          ) : (
            <div className="text-center">
              <p className="text-sm mb-4" style={{ color: '#6B9080' }}>{t('reset_resend_sent')}</p>
              {resendCooldown > 0 && (
                <p className="text-xs" style={{ color: '#A3B1AA' }}>
                  {t('resend_wait')} {resendCooldown}s
                </p>
              )}
            </div>
          )}

          <div className="mt-6 text-center">
            <button onClick={() => navigate('/login')} className="text-sm" style={{ color: '#A3B1AA' }}>
              {t('back_to_login')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Main reset form ──
  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: '#F9F8F6' }}>
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <img src="/anchr-circle-small.svg" alt="Anchr" className="w-14 h-14 mx-auto mb-5" />
          <h1 className="font-heading text-3xl font-light tracking-tight" style={{ color: '#2A3A35' }}>
            {t('reset_title')}
          </h1>
          <p className="mt-2 text-sm" style={{ color: '#7A8B85' }}>{t('reset_subtitle')}</p>
        </div>

        <div className="rounded-3xl p-8 shadow-sm" style={{ background: '#FFFFFF', border: '1px solid #E8E6E1' }}>
          {error && (
            <div className="mb-4 p-3 rounded-xl text-sm" style={{ background: '#FDF2F2', color: '#E5989B', border: '1px solid #E5989B33' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <PasswordInput
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t('password_create_placeholder')}
              label={t('new_password')}
              showStrength
            />

            <div>
              <Label className="text-sm mb-2 block" style={{ color: '#7A8B85' }}>{t('confirm_password')}</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#A3B1AA' }} strokeWidth={1.5} />
                <Input
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder={t('confirm_password_placeholder')}
                  className="pl-10 pr-10 rounded-xl h-12"
                  style={{
                    border: `1px solid ${confirm.length > 0 ? (passwordsMatch ? '#6B9080' : '#E5989B') : '#E8E6E1'}`,
                    background: '#FFFFFF',
                  }}
                  required
                />
                {confirm.length > 0 && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {passwordsMatch
                      ? <Check className="w-4 h-4" style={{ color: '#6B9080' }} strokeWidth={2.5} />
                      : <X className="w-4 h-4" style={{ color: '#E5989B' }} strokeWidth={2.5} />}
                  </div>
                )}
              </div>
              {confirm.length > 0 && !passwordsMatch && (
                <p className="text-xs mt-1" style={{ color: '#E5989B' }}>{t('passwords_no_match')}</p>
              )}
            </div>

            <Button
              type="submit"
              disabled={loading || !canSubmit}
              className="w-full h-12 rounded-full text-white font-medium flex items-center justify-center gap-2"
              style={{ background: canSubmit ? '#6B9080' : '#A3B1AA' }}
            >
              {loading ? t('please_wait') : t('set_new_password')}
              {!loading && <ArrowRight className="w-4 h-4" strokeWidth={1.5} />}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
