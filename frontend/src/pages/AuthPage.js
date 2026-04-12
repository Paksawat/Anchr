import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Anchor, Mail, Lock, User, ArrowRight, Globe } from 'lucide-react';

const API = `${process.env.REACT_APP_API_URL}/api`;

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { setUser } = useAuth();
  const { t, lang, setLang } = useLanguage();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const endpoint = isLogin ? '/auth/login' : '/auth/register';
      const payload = isLogin ? { email, password } : { email, password, name };
      const res = await axios.post(`${API}${endpoint}`, payload, {
        withCredentials: true,
      });
      setUser(res.data);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.detail || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
    const redirectUrl = window.location.origin + '/dashboard';
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
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
            {lang === 'en' ? 'Dansk' : 'English'}
          </button>
        </div>

        <div className="text-center mb-10">
          <div
            className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-5"
            style={{ background: '#A4C3B2' }}
          >
            <Anchor
              className="w-8 h-8"
              style={{ color: '#2A3A35' }}
              strokeWidth={1.5}
            />
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
            <Button
              data-testid="auth-submit-btn"
              type="submit"
              disabled={loading}
              className="w-full h-12 rounded-full text-white font-medium transition-colors duration-300 flex items-center justify-center gap-2"
              style={{ background: '#6B9080' }}
            >
              {loading
                ? t('please_wait')
                : isLogin
                  ? t('sign_in')
                  : t('create_account')}
              {!loading && <ArrowRight className="w-4 h-4" strokeWidth={1.5} />}
            </Button>
          </form>

          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px" style={{ background: '#E8E6E1' }} />
            <span className="text-xs" style={{ color: '#A3B1AA' }}>
              {t('or')}
            </span>
            <div className="flex-1 h-px" style={{ background: '#E8E6E1' }} />
          </div>

          <Button
            data-testid="google-login-btn"
            onClick={handleGoogleLogin}
            variant="outline"
            className="w-full h-12 rounded-full font-medium transition-colors duration-300"
            style={{ border: '1px solid #E8E6E1', color: '#2A3A35' }}
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            {t('continue_google')}
          </Button>
        </div>
      </div>
    </div>
  );
}
