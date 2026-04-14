import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Mail, Lock, User, ArrowRight, Globe, ChevronDown, ChevronUp } from 'lucide-react';


const API = `${process.env.REACT_APP_API_URL}/api`;

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [consentChecked, setConsentChecked] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const { setUser, user, loading: authLoading } = useAuth();
  const { t, lang, setLang } = useLanguage();
  const navigate = useNavigate();

  // Redirect already-authenticated users, and handle post-login/register navigation
  // data-driven: new users (no urge_type) → onboarding, returning users → dashboard
  React.useEffect(() => {
    if (!authLoading && user) {
      navigate(user.disclaimer_accepted === false ? '/onboarding' : '/dashboard', { replace: true });
    }
  }, [user, authLoading, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    if (!isLogin && (!consentChecked || !privacyAccepted)) {
      setError(t('consent_required'));
      setLoading(false);
      return;
    }
    try {
      const endpoint = isLogin ? '/auth/login' : '/auth/register';
      const payload = isLogin ? { email, password } : { email, password, name };
      const res = await axios.post(`${API}${endpoint}`, payload, {
        withCredentials: true,
      });
      setUser(res.data);
      // navigation is handled by the useEffect watching user + urge_type
    } catch (err) {
      setError(err.response?.data?.detail || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: '#F9F8F6' }}
    >
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
          <h1
            className="font-heading text-4xl sm:text-5xl font-light tracking-tight"
            style={{ color: '#2A3A35' }}
          >
            {t('auth_title')}
          </h1>
          <p
            className="mt-3 text-base"
            style={{ color: '#7A8B85', fontFamily: 'Figtree, sans-serif' }}
          >
            {t('auth_subtitle')}
          </p>
        </div>

        <div
          className="rounded-3xl p-8 shadow-sm"
          style={{ background: '#FFFFFF', border: '1px solid #E8E6E1' }}
        >
          <div
            className="flex gap-2 mb-8 p-1 rounded-full"
            style={{ background: '#F0EFEB' }}
          >
            <button
              data-testid="login-tab"
              onClick={() => {
                setIsLogin(true);
                setError('');
              }}
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
              onClick={() => {
                setIsLogin(false);
                setError('');
              }}
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
              style={{
                background: '#FDF2F2',
                color: '#E5989B',
                border: '1px solid #E5989B33',
              }}
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {!isLogin && (
              <div>
                <Label
                  className="text-sm mb-2 block"
                  style={{ color: '#7A8B85' }}
                >
                  {t('name')}
                </Label>
                <div className="relative">
                  <User
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
                    style={{ color: '#A3B1AA' }}
                    strokeWidth={1.5}
                  />
                  <Input
                    data-testid="name-input"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={t('name_placeholder')}
                    className="pl-10 rounded-xl h-12"
                    style={{
                      border: '1px solid #E8E6E1',
                      background: '#FFFFFF',
                    }}
                    required={!isLogin}
                  />
                </div>
              </div>
            )}
            <div>
              <Label
                className="text-sm mb-2 block"
                style={{ color: '#7A8B85' }}
              >
                {t('email')}
              </Label>
              <div className="relative">
                <Mail
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
                  style={{ color: '#A3B1AA' }}
                  strokeWidth={1.5}
                />
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
            <div>
              <Label
                className="text-sm mb-2 block"
                style={{ color: '#7A8B85' }}
              >
                {t('password')}
              </Label>
              <div className="relative">
                <Lock
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
                  style={{ color: '#A3B1AA' }}
                  strokeWidth={1.5}
                />
                <Input
                  data-testid="password-input"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t('password_placeholder')}
                  className="pl-10 rounded-xl h-12"
                  style={{ border: '1px solid #E8E6E1', background: '#FFFFFF' }}
                  required
                />
              </div>
            </div>
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
                {/* Privacy policy acceptance */}
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={privacyAccepted}
                    onChange={(e) => setPrivacyAccepted(e.target.checked)}
                    className="mt-0.5 shrink-0 w-4 h-4"
                    style={{ accentColor: '#6B9080' }}
                  />
                  <span className="text-xs leading-relaxed" style={{ color: '#7A8B85' }}>
                    {t('privacy_accept_text')}
                  </span>
                </label>
                {/* Data consent checkbox */}
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={consentChecked}
                    onChange={(e) => setConsentChecked(e.target.checked)}
                    className="mt-0.5 shrink-0 w-4 h-4"
                    style={{ accentColor: '#6B9080' }}
                  />
                  <span className="text-xs leading-relaxed" style={{ color: '#7A8B85' }}>
                    {t('consent_text')}
                  </span>
                </label>
              </div>
            )}
            <Button
              data-testid="auth-submit-btn"
              type="submit"
              disabled={loading || (!isLogin && (!consentChecked || !privacyAccepted))}
              className="w-full h-12 rounded-full text-white font-medium transition-colors duration-300 flex items-center justify-center gap-2"
              style={{ background: (!isLogin && (!consentChecked || !privacyAccepted)) ? '#A3B1AA' : '#6B9080' }}
            >
              {loading
                ? t('please_wait')
                : isLogin
                  ? t('sign_in')
                  : t('create_account')}
              {!loading && <ArrowRight className="w-4 h-4" strokeWidth={1.5} />}
            </Button>
          </form>

        </div>
      </div>
    </div>
  );
}
