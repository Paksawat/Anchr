import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { UrgeTimerProvider } from './contexts/UrgeTimerContext';
import ProtectedRoute from './components/ProtectedRoute';
import AuthPage from './pages/AuthPage';
import Onboarding from './pages/Onboarding';
import Dashboard from './pages/Dashboard';
import UrgeTimer from './pages/UrgeTimer';
import Progress from './pages/Progress';
import MotivationWall from './pages/MotivationWall';
import Settings from './pages/Settings';
import Programs from './pages/Programs';
import Habits from './pages/Habits';
import NotFound from './pages/NotFound';
import './App.css';

function AppRouter() {
  return (
    <Routes>
      <Route path="/login" element={<AuthPage />} />
      <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/urge-timer" element={<ProtectedRoute><UrgeTimer /></ProtectedRoute>} />
      <Route path="/programs" element={<ProtectedRoute><Programs /></ProtectedRoute>} />
      <Route path="/habits" element={<ProtectedRoute><Habits /></ProtectedRoute>} />
      <Route path="/progress" element={<ProtectedRoute><Progress /></ProtectedRoute>} />
      <Route path="/motivation" element={<ProtectedRoute><MotivationWall /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <LanguageProvider>
        <AuthProvider>
          <UrgeTimerProvider>
            <AppRouter />
          </UrgeTimerProvider>
        </AuthProvider>
      </LanguageProvider>
    </BrowserRouter>
  );
}

export default App;
