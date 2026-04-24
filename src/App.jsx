// src/App.jsx
import { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { HomeProvider } from './context/HomeContext';

import RegisterPage          from './pages/RegisterPage';
import LoginPage             from './pages/LoginPage';
import OTPVerificationPage   from './pages/OTPVerificationPage';
import MainApp               from './components/MainApp';
import AdminDashboard        from './admin/AdminDashboard';

// ── Inner router (has access to AuthContext) ──────────────
function AppRouter() {
  const { isAuthenticated } = useAuth();
  // 'register' | 'login' | 'otp' | 'app' | 'admin'
  const [screen, setScreen] = useState('login');

  // Once authenticated, always show app
  if (isAuthenticated) {
    return (
      <>
        {/* Top nav to switch between app & admin */}
        <div style={{
          padding: '10px 16px',
          background: '#0f172a',
          display: 'flex',
          gap: '10px',
          alignItems: 'center',
        }}>
          <span style={{ color: '#a78bfa', fontWeight: 700, marginRight: 12 }}>🍽 Meal Mate</span>
          <button
            onClick={() => setScreen('app')}
            style={{ color: screen === 'app' ? '#fff' : '#94a3b8', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
            Home
          </button>
          <button
            onClick={() => setScreen('admin')}
            style={{ color: screen === 'admin' ? '#fff' : '#94a3b8', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
            Admin
          </button>
        </div>
        {screen === 'admin' ? <AdminDashboard /> : <MainApp />}
      </>
    );
  }

  if (screen === 'register') {
    return (
      <RegisterPage
        onRegistered={(email) => setScreen('otp')}
        onGoLogin={() => setScreen('login')}
      />
    );
  }

  if (screen === 'otp') {
    return (
      <OTPVerificationPage
        onVerified={() => setScreen('app')}
      />
    );
  }

  // Default: login
  return (
    <LoginPage onGoRegister={() => setScreen('register')} />
  );
}

// ── Root ──────────────────────────────────────────────────
export default function App() {
  return (
    <AuthProvider>
      <HomeProvider>
        <AppRouter />
      </HomeProvider>
    </AuthProvider>
  );
}