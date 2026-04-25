import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import axios from 'axios';

const API = `${import.meta.env.VITE_API_URL}/api`;

export default function AuthCallback() {
  const hasProcessed = useRef(false);
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const { t } = useLanguage();

  useEffect(() => {
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const hash = window.location.hash;
    const sessionId = new URLSearchParams(hash.substring(1)).get('session_id');
    if (!sessionId) {
      navigate('/login');
      return;
    }

    (async () => {
      try {
        const res = await axios.post(
          `${API}/auth/session`,
          { session_id: sessionId },
          { withCredentials: true },
        );
        setUser(res.data);
        // New Google users have no urge_type set yet — send them to onboarding
        const isNewUser = !res.data.urge_type;
        navigate(isNewUser ? '/onboarding' : '/dashboard', { replace: true });
      } catch {
        navigate('/login');
      }
    })();
  }, [navigate, setUser]);

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: '#F9F8F6' }}
    >
      <div className="text-center">
        <div
          className="w-12 h-12 rounded-full mx-auto mb-4 animate-pulse"
          style={{ background: '#A4C3B2' }}
        />
        <p style={{ color: '#7A8B85', fontFamily: 'Figtree, sans-serif' }}>
          {t('signing_in')}
        </p>
      </div>
    </div>
  );
}
