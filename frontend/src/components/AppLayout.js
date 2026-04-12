import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import {
  LayoutDashboard, Flame, TrendingUp, Heart, Settings,
  LogOut, Menu, X, Anchor, Globe, BookOpen, ListChecks, Lock, Sparkles
} from 'lucide-react';

export default function AppLayout({ children }) {
  const { user, logout } = useAuth();
  const { t, lang, setLang } = useLanguage();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const isPaid = user?.tier === 'paid';

  const navItems = [
    { to: '/dashboard', icon: LayoutDashboard, label: t('nav_dashboard'), free: true },
    { to: '/urge-timer', icon: Flame, label: t('nav_urge_timer'), free: true },
    { to: '/programs', icon: BookOpen, label: 'Programs', free: false },
    { to: '/habits', icon: ListChecks, label: 'Habits', free: false },
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
          <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: '#A4C3B2' }}>
            <Anchor className="w-5 h-5" style={{ color: '#2A3A35' }} strokeWidth={1.5} />
          </div>
          <span className="font-heading text-xl font-medium tracking-tight" style={{ color: '#2A3A35' }}>Anchr</span>
        </NavLink>

        <nav className="flex-1 space-y-1">
          {navItems.map(renderNavItem)}
        </nav>

        {!isPaid && (
          <div className="mb-4 p-4 rounded-xl" style={{ background: '#6B908010', border: '1px solid #6B908033' }}>
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4" style={{ color: '#6B9080' }} strokeWidth={1.5} />
              <span className="text-xs font-medium" style={{ color: '#6B9080' }}>Anchr Pro</span>
            </div>
            <p className="text-xs mb-3" style={{ color: '#7A8B85' }}>Unlock programs, habits, deep insights & more</p>
            <button
              data-testid="sidebar-upgrade-btn"
              onClick={() => alert('Coming soon! Anchr Pro will be available shortly.')}
              className="w-full py-2 rounded-lg text-xs font-medium text-white"
              style={{ background: '#6B9080' }}
            >
              Upgrade
            </button>
          </div>
        )}

        <button
          data-testid="lang-toggle"
          onClick={() => setLang(lang === 'en' ? 'da' : 'en')}
          className="flex items-center gap-2 px-4 py-2.5 w-full rounded-xl text-sm font-medium transition-all duration-200 mb-3"
          style={{ background: '#F0EFEB', color: '#7A8B85' }}
        >
          <Globe className="w-4 h-4" strokeWidth={1.5} />
          {lang === 'en' ? 'Dansk' : 'English'}
        </button>

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
          <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: '#A4C3B2' }}>
            <Anchor className="w-4 h-4" style={{ color: '#2A3A35' }} strokeWidth={1.5} />
          </div>
          <span className="font-heading text-lg font-medium" style={{ color: '#2A3A35' }}>Anchr</span>
        </NavLink>
        <div className="flex items-center gap-2">
          <button data-testid="mobile-lang-toggle" onClick={() => setLang(lang === 'en' ? 'da' : 'en')} className="p-2 rounded-lg" style={{ color: '#7A8B85' }}>
            <Globe className="w-5 h-5" strokeWidth={1.5} />
          </button>
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

      <main className="flex-1 overflow-y-auto md:p-8 p-4 pt-20 md:pt-8">
        <div className="max-w-6xl mx-auto">{children}</div>
      </main>
    </div>
  );
}
