import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Mail, Lock, User, ArrowRight, Globe, ChevronDown, ChevronUp, Eye, EyeOff, Check, X } from 'lucide-react';

const API = `${import.meta.env.VITE_API_URL}/api`;

function PasswordInput({ value, onChange, placeholder, testId, label, showStrength = false }) {
  const [show, setShow] = useState(false);
  const strength = showStrength ? getStrength(value) : null;

  return (
    <div>
      {label && (
        <Label className="text-sm mb-2 block" style={{ color: '#7A8B85' }}>{label}</Label>
      )}
      <div className="relative">
        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#A3B1AA' }} strokeWidth={1.5} />
        <Input
          data-testid={testId}
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

function getStrength(pw) {
  const hasLen = pw.length >= 6;
  const hasNum = /\d/.test(pw);
  if (hasLen && hasNum) return 'strong';
  if (hasLen || hasNum) return 'medium';
  return 'weak';
}

function isPasswordValid(pw) {
  return pw.length >= 6 && /\d/.test(pw);
}

// view: 'auth' | 'forgot' | 'forgot_sent'
export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [view, setView] = useState('auth'); // 'auth' | 'forgot' | 'forgot_sent'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [consentChecked, setConsentChecked] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const { setUser, user, loading: authLoading } = useAuth();
  const { t, lang, setLang } = useLanguage();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (!authLoading && user) {
      navigate(user.disclaimer_accepted === false ? '/onboarding' : '/dashboard', { replace: true });
    }
  }, [user, authLoading, navigate]);

  const passwordsMatch = confirmPassword.length === 0 || password === confirmPassword;
  const canSubmitSignup = isPasswordValid(password) && password === confirmPassword && consentChecked && privacyAccepted && name.trim() && email.trim();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!isLogin) {
      if (!consentChecked || !privacyAccepted) {
        setError(t('consent_required'));
        return;
      }
      if (!isPasswordValid(password)) {
        setError(t('password_invalid'));
        return;
      }
      if (password !== confirmPassword) {
        setError(t('passwords_no_match'));
        return;
      }
    }

    setLoading(true);
    try {
      const endpoint = isLogin ? '/auth/login' : '/auth/register';
      const payload = isLogin ? { email, password } : { email, password, name };
      const res = await axios.post(`${API}${endpoint}`, payload, { withCredentials: true });
      setUser(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleForgot = async (e) => {
    e.preventDefault();
    setForgotLoading(true);
    try {
      await axios.post(`${API}/auth/forgot-password`, { email: forgotEmail }, { withCredentials: true });
    } catch {
      // Intentionally swallowed — always show generic success
    } finally {
      setForgotLoading(false);
      setView('forgot_sent');
    }
  };

  // ── Forgot password: email form ──
  if (view === 'forgot') {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: '#F9F8F6' }}>
        <div className="w-full max-w-md">
          <div className="text-center mb-10">
            <img src="/anchr-circle-small.svg" alt="Anchr" className="w-14 h-14 mx-auto mb-5" />
            <h1 className="font-heading text-3xl font-light tracking-tight" style={{ color: '#2A3A35' }}>
              {t('forgot_title')}
            </h1>
            <p className="mt-2 text-sm" style={{ color: '#7A8B85' }}>{t('forgot_subtitle')}</p>
          </div>
          <div className="rounded-3xl p-8 shadow-sm" style={{ background: '#FFFFFF', border: '1px solid #E8E6E1' }}>
            <form onSubmit={handleForgot} className="space-y-5">
              <div>
                <Label className="text-sm mb-2 block" style={{ color: '#7A8B85' }}>{t('email')}</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#A3B1AA' }} strokeWidth={1.5} />
                  <Input
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder={t('email_placeholder')}
                    className="pl-10 rounded-xl h-12"
                    style={{ border: '1px solid #E8E6E1', background: '#FFFFFF' }}
                    required
                  />
                </div>
              </div>
              <Button
                type="submit"
                disabled={forgotLoading || !forgotEmail.trim()}
                className="w-full h-12 rounded-full text-white font-medium flex items-center justify-center gap-2"
                style={{ background: '#6B9080' }}
              >
                {forgotLoading ? t('please_wait') : t('send_reset_link')}
                {!forgotLoading && <ArrowRight className="w-4 h-4" strokeWidth={1.5} />}
              </Button>
            </form>
            <button
              onClick={() => setView('auth')}
              className="mt-5 w-full text-sm text-center"
              style={{ color: '#A3B1AA' }}
            >
              {t('back_to_login')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Forgot password: sent confirmation ──
  if (view === 'forgot_sent') {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: '#F9F8F6' }}>
        <div className="w-full max-w-md text-center">
          <img src="/anchr-circle-small.svg" alt="Anchr" className="w-14 h-14 mx-auto mb-6 opacity-60" />
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-5"
            style={{ background: '#6B908020' }}
          >
            <Mail className="w-7 h-7" style={{ color: '#6B9080' }} strokeWidth={1.5} />
          </div>
          <h1 className="font-heading text-2xl font-light tracking-tight mb-3" style={{ color: '#2A3A35' }}>
            {t('reset_sent_title')}
          </h1>
          <p className="text-sm mb-6" style={{ color: '#7A8B85' }}>{t('reset_sent_desc')}</p>
          <button
            onClick={() => { setView('auth'); setForgotEmail(''); }}
            className="text-sm font-medium"
            style={{ color: '#6B9080' }}
          >
            {t('back_to_login')}
          </button>
        </div>
      </div>
    );
  }

  // ── Main auth page ──
  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: '#F9F8F6' }}>
      <div className="w-full max-w-md" data-testid="auth-page">
        {/* Language toggle */}
        <div className="flex justify-end mb-4">
          <button
            data-testid="auth-lang-toggle"
            onClick={() => setLang(lang === 'en' ? 'da' : 'en')}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200"
            style={{ background: '#F0EFEB', color: '#7A8B85' }}
          >
            <Globe className="w-3.5 h-3.5" strokeWidth={1.5} />
            {lang === 'en' ? 'English' : 'Dansk'}
          </button>
        </div>

        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center mb-5">
            <img src="/anchr-circle-small.svg" alt="Anchr" className="w-16 h-16" />
          </div>
          <h1 className="font-heading text-4xl sm:text-5xl font-light tracking-tight" style={{ color: '#2A3A35' }}>
            {t('auth_title')}
          </h1>
          <p className="mt-3 text-base" style={{ color: '#7A8B85', fontFamily: 'Figtree, sans-serif' }}>
            {t('auth_subtitle')}
          </p>
        </div>

        <div className="rounded-3xl p-8 shadow-sm" style={{ background: '#FFFFFF', border: '1px solid #E8E6E1' }}>
          <div className="flex gap-2 mb-8 p-1 rounded-full" style={{ background: '#F0EFEB' }}>
            <button
              data-testid="login-tab"
              onClick={() => { setIsLogin(true); setError(''); setPassword(''); setConfirmPassword(''); }}
              className="flex-1 py-2.5 rounded-full text-sm font-medium transition-all duration-300"
              style={{
                background: isLogin ? '#FFFFFF' : 'transparent',
                color: isLogin ? '#2A3A35' : '#7A8B85',
                boxShadow: isLogin ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              }}
            >
              {t('sign_in')}
            </button>
            <button
              data-testid="register-tab"
              onClick={() => { setIsLogin(false); setError(''); setPassword(''); setConfirmPassword(''); }}
              className="flex-1 py-2.5 rounded-full text-sm font-medium transition-all duration-300"
              style={{
                background: !isLogin ? '#FFFFFF' : 'transparent',
                color: !isLogin ? '#2A3A35' : '#7A8B85',
                boxShadow: !isLogin ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              }}
            >
              {t('sign_up')}
            </button>
          </div>

          {error && (
            <div
              data-testid="auth-error"
              className="mb-4 p-3 rounded-xl text-sm"
              style={{ background: '#FDF2F2', color: '#E5989B', border: '1px solid #E5989B33' }}
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {!isLogin && (
              <div>
                <Label className="text-sm mb-2 block" style={{ color: '#7A8B85' }}>{t('name')}</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#A3B1AA' }} strokeWidth={1.5} />
                  <Input
                    data-testid="name-input"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={t('name_placeholder')}
                    className="pl-10 rounded-xl h-12"
                    style={{ border: '1px solid #E8E6E1', background: '#FFFFFF' }}
                    required={!isLogin}
                  />
                </div>
              </div>
            )}

            <div>
              <Label className="text-sm mb-2 block" style={{ color: '#7A8B85' }}>{t('email')}</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#A3B1AA' }} strokeWidth={1.5} />
                <Input
                  data-testid="email-input"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t('email_placeholder')}
                  className="pl-10 rounded-xl h-12"
                  style={{ border: '1px solid #E8E6E1', background: '#FFFFFF' }}
                  required
                />
              </div>
            </div>

            <PasswordInput
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={isLogin ? '••••••••' : t('password_create_placeholder')}
              testId="password-input"
              label={t('password')}
              showStrength={!isLogin}
            />

            {!isLogin && (
              <div>
                <Label className="text-sm mb-2 block" style={{ color: '#7A8B85' }}>{t('confirm_password')}</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#A3B1AA' }} strokeWidth={1.5} />
                  <Input
                    data-testid="confirm-password-input"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder={t('confirm_password_placeholder')}
                    className="pl-10 pr-10 rounded-xl h-12"
                    style={{
                      border: `1px solid ${confirmPassword.length > 0 ? (passwordsMatch ? '#6B9080' : '#E5989B') : '#E8E6E1'}`,
                      background: '#FFFFFF',
                    }}
                    required
                  />
                  {confirmPassword.length > 0 && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      {passwordsMatch
                        ? <Check className="w-4 h-4" style={{ color: '#6B9080' }} strokeWidth={2.5} />
                        : <X className="w-4 h-4" style={{ color: '#E5989B' }} strokeWidth={2.5} />}
                    </div>
                  )}
                </div>
                {confirmPassword.length > 0 && !passwordsMatch && (
                  <p className="text-xs mt-1" style={{ color: '#E5989B' }}>{t('passwords_no_match')}</p>
                )}
              </div>
            )}

            {!isLogin && (
              <div className="space-y-3">
                {/* Privacy Policy expandable */}
                <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #E8E6E1' }}>
                  <button
                    type="button"
                    onClick={() => setPrivacyOpen(!privacyOpen)}
                    className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium transition-colors"
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
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={privacyAccepted}
                    onChange={(e) => setPrivacyAccepted(e.target.checked)}
                    className="mt-0.5 shrink-0 w-4 h-4"
                    style={{ accentColor: '#6B9080' }}
                  />
                  <span className="text-xs leading-relaxed" style={{ color: '#7A8B85' }}>{t('privacy_accept_text')}</span>
                </label>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={consentChecked}
                    onChange={(e) => setConsentChecked(e.target.checked)}
                    className="mt-0.5 shrink-0 w-4 h-4"
                    style={{ accentColor: '#6B9080' }}
                  />
                  <span className="text-xs leading-relaxed" style={{ color: '#7A8B85' }}>{t('consent_text')}</span>
                </label>
              </div>
            )}

            <Button
              data-testid="auth-submit-btn"
              type="submit"
              disabled={loading || (!isLogin && !canSubmitSignup)}
              className="w-full h-12 rounded-full text-white font-medium transition-colors duration-300 flex items-center justify-center gap-2"
              style={{ background: (!isLogin && !canSubmitSignup) ? '#A3B1AA' : '#6B9080' }}
            >
              {loading ? t('please_wait') : isLogin ? t('sign_in') : t('create_account')}
              {!loading && <ArrowRight className="w-4 h-4" strokeWidth={1.5} />}
            </Button>
          </form>

          {isLogin && (
            <div className="mt-4 text-center">
              <button
                onClick={() => { setView('forgot'); setForgotEmail(email); setError(''); }}
                className="text-sm"
                style={{ color: '#A3B1AA' }}
              >
                {t('forgot_password')}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
