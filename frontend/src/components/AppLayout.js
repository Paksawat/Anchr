import React, { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useUrgeTimer } from '../contexts/UrgeTimerContext';
import { useInstallPrompt } from '../hooks/useInstallPrompt';
import InstallBanner from './InstallBanner';
import {
  LayoutDashboard, Flame, TrendingUp, Heart, Settings,
  LogOut, Menu, X, BookOpen, ListChecks, Lock, Sparkles
} from 'lucide-react';

const formatTime = (s) => {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, '0')}`;
};

export default function AppLayout({ children }) {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const isPaid = user?.tier === 'paid';
  const { phase, timeLeft } = useUrgeTimer();
  const timerActive = phase === 'active' && location.pathname !== '/urge-timer';
  const { showBanner } = useInstallPrompt();

  const navItems = [
    { to: '/dashboard', icon: LayoutDashboard, label: t('nav_dashboard'), free: true },
    { to: '/urge-timer', icon: Flame, label: t('nav_urge_timer'), free: true },
    { to: '/programs', icon: BookOpen, label: t('nav_programs'), free: false },
    { to: '/habits', icon: ListChecks, label: t('nav_habits'), free: false },
    { to: '/progress', icon: TrendingUp, label: t('nav_progress'), free: true },
    { to: '/motivation', icon: Heart, label: t('nav_motivation'), free: true },
    { to: '/settings', icon: Settings, label: t('nav_settings'), free: true },
  ];

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const renderNavItem = (item) => (
    <NavLink
      key={item.to}
      to={item.to}
      data-testid={`nav-${item.to.slice(1)}`}
      className={({ isActive }) =>
        `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${isActive ? 'shadow-sm' : 'hover:-translate-y-px'}`
      }
      style={({ isActive }) => ({
        background: isActive ? '#F0EFEB' : 'transparent',
        color: isActive ? '#2A3A35' : '#7A8B85',
      })}
    >
      <item.icon className="w-5 h-5" strokeWidth={1.5} />
      <span className="flex-1">{item.label}</span>
      {!item.free && !isPaid && <Lock className="w-3.5 h-3.5" style={{ color: '#A3B1AA' }} strokeWidth={1.5} />}
    </NavLink>
  );

  return (
    <div className="min-h-screen flex" style={{ background: '#F9F8F6' }}>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 p-6 border-r" style={{ background: '#FFFFFF', borderColor: '#E8E6E1' }}>
        <NavLink to="/dashboard" className="flex items-center gap-3 mb-10 hover:opacity-80 transition-opacity">
          <img src="/anchr-circle-small.svg" alt="Anchr" className="w-10 h-10" />
          <span className="font-heading text-xl font-medium tracking-tight" style={{ color: '#2A3A35' }}>Anchr</span>
        </NavLink>

        <nav className="flex-1 space-y-1">
          {navItems.map(renderNavItem)}
        </nav>

        {!isPaid && (
          <div className="mb-4 p-4 rounded-xl" style={{ background: '#6B908010', border: '1px solid #6B908033' }}>
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4" style={{ color: '#6B9080' }} strokeWidth={1.5} />
              <span className="text-xs font-medium" style={{ color: '#6B9080' }}>{t('upgrade_title')}</span>
            </div>
            <p className="text-xs mb-3" style={{ color: '#7A8B85' }}>{t('upgrade_desc')}</p>
            <button
              data-testid="sidebar-upgrade-btn"
              onClick={() => alert('Coming soon! Anchr Pro will be available shortly.')}
              className="w-full py-2 rounded-lg text-xs font-medium text-white"
              style={{ background: '#6B9080' }}
            >
              {t('upgrade_btn')}
            </button>
          </div>
        )}

        <div className="pt-4 border-t" style={{ borderColor: '#E8E6E1' }}>
          <div className="flex items-center gap-3 px-3 mb-4">
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-medium" style={{ background: '#A4C3B2', color: '#2A3A35' }}>
              {user?.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate" style={{ color: '#2A3A35' }}>{user?.name}</p>
              <p className="text-xs truncate" style={{ color: '#A3B1AA' }}>{user?.email}</p>
            </div>
          </div>
          <button
            data-testid="logout-btn"
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2.5 w-full rounded-xl text-sm transition-colors duration-200"
            style={{ color: '#7A8B85' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#F0EFEB'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
          >
            <LogOut className="w-4 h-4" strokeWidth={1.5} />
            {t('sign_out')}
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-3 border-b" style={{ background: '#FFFFFF', borderColor: '#E8E6E1' }}>
        <NavLink to="/dashboard" className="flex items-center gap-2">
          <img src="/anchr-circle-small.svg" alt="Anchr" className="w-8 h-8" />
          <span className="font-heading text-lg font-medium" style={{ color: '#2A3A35' }}>Anchr</span>
        </NavLink>
        <div className="flex items-center gap-2">
          <button data-testid="mobile-menu-btn" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X className="w-6 h-6" style={{ color: '#2A3A35' }} /> : <Menu className="w-6 h-6" style={{ color: '#2A3A35' }} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-40" style={{ background: 'rgba(42,58,53,0.3)' }} onClick={() => setMobileOpen(false)}>
          <div className="absolute right-0 top-14 bottom-0 w-64 p-6 border-l shadow-xl overflow-y-auto" style={{ background: '#FFFFFF', borderColor: '#E8E6E1' }} onClick={e => e.stopPropagation()}>
            <nav className="space-y-1">
              {navItems.map(item => (
                <NavLink key={item.to} to={item.to} onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200"
                  style={({ isActive }) => ({ background: isActive ? '#F0EFEB' : 'transparent', color: isActive ? '#2A3A35' : '#7A8B85' })}>
                  <item.icon className="w-5 h-5" strokeWidth={1.5} />
                  <span className="flex-1">{item.label}</span>
                  {!item.free && !isPaid && <Lock className="w-3.5 h-3.5" style={{ color: '#A3B1AA' }} strokeWidth={1.5} />}
                </NavLink>
              ))}
            </nav>
            <div className="mt-6 pt-6 border-t" style={{ borderColor: '#E8E6E1' }}>
              <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2.5 w-full rounded-xl text-sm" style={{ color: '#7A8B85' }}>
                <LogOut className="w-4 h-4" strokeWidth={1.5} /> {t('sign_out')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Extra bottom padding on mobile when install banner is visible */}
      <main className={`flex-1 overflow-y-auto md:p-8 p-4 pt-20 md:pt-8 ${showBanner ? 'pb-24' : ''}`}>
        <div className="max-w-6xl mx-auto">{children}</div>
      </main>

      <InstallBanner />

      {/* Floating mini timer — visible on all pages when a timer is running */}
      {timerActive && (
        <button
          onClick={() => navigate('/urge-timer')}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 px-5 py-3 rounded-full shadow-lg transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl"
          style={{ background: '#E5989B', color: '#fff' }}
        >
          <Flame className="w-4 h-4" strokeWidth={1.5} />
          <span className="text-sm font-semibold tracking-wide">{formatTime(timeLeft)}</span>
          <span className="text-xs opacity-80">{t('return_to_timer')}</span>
        </button>
      )}
    </div>
  );
}
