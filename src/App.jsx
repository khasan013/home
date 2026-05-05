import { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { HomeProvider } from './context/HomeContext';

import RegisterPage          from './pages/RegisterPage';
import LoginPage             from './pages/LoginPage';
import OTPVerificationPage   from './pages/OTPVerificationPage';
import MainApp               from './components/MainApp';
import AdminDashboard        from './admin/AdminDashboard';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';

// ── Mobile-aware Navigation ────────────────────────────────
function TopNav({ screen, setScreen, isMobileMenuOpen, setIsMobileMenuOpen }) {
  return (
    <>
      {/* Top Navigation Bar */}
      <div style={{
        padding: '12px 16px',
        background: '#0f172a',
        display: 'flex',
        gap: '16px',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid #1e293b',
      }}>
        <span style={{ 
          color: '#a78bfa', 
          fontWeight: 700, 
          fontSize: '18px',
          flex: 1,
        }}>
          🍽 Meal Mate
        </span>

        {/* Desktop Navigation */}
        <div style={{
          display: 'flex',
          gap: '20px',
          alignItems: 'center',
          '@media (max-width: 768px)': {
            display: 'none',
          },
        }} className="desktop-nav">
          <button
            onClick={() => setScreen('app')}
            style={{ 
              color: screen === 'app' ? '#fff' : '#94a3b8', 
              background: 'none', 
              border: 'none', 
              cursor: 'pointer', 
              fontWeight: 600,
              fontSize: '14px',
              transition: 'color 0.2s',
            }}
            onMouseEnter={(e) => e.target.style.color = '#fff'}
            onMouseLeave={(e) => e.target.style.color = screen === 'app' ? '#fff' : '#94a3b8'}
          >
            Home
          </button>
          <button
            onClick={() => setScreen('admin')}
            style={{ 
              color: screen === 'admin' ? '#fff' : '#94a3b8', 
              background: 'none', 
              border: 'none', 
              cursor: 'pointer', 
              fontWeight: 600,
              fontSize: '14px',
              transition: 'color 0.2s',
            }}
            onMouseEnter={(e) => e.target.style.color = '#fff'}
            onMouseLeave={(e) => e.target.style.color = screen === 'admin' ? '#fff' : '#94a3b8'}
          >
            Admin
          </button>
        </div>

        {/* Mobile Hamburger Menu */}
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          style={{
            display: 'none',
            background: 'none',
            border: 'none',
            color: '#a78bfa',
            cursor: 'pointer',
            fontSize: '24px',
            padding: '4px 8px',
            '@media (max-width: 768px)': {
              display: 'block',
            },
          }}
          className="mobile-menu-btn"
        >
          ⋮
        </button>
      </div>

      {/* Mobile Sidebar Menu */}
      {isMobileMenuOpen && (
        <>
          {/* Overlay */}
          <div
            onClick={() => setIsMobileMenuOpen(false)}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.5)',
              zIndex: 39,
              display: 'none',
            }}
            className="mobile-overlay"
          />

          {/* Sidebar */}
          <div
            style={{
              position: 'fixed',
              right: 0,
              top: 0,
              height: '100vh',
              width: '100%',
              maxWidth: '280px',
              background: 'linear-gradient(135deg, #0f172a 0%, #1a2540 100%)',
              borderLeft: '1px solid #1e293b',
              zIndex: 40,
              flexDirection: 'column',
              paddingTop: '60px',
              animation: 'slideIn 0.3s ease-out',
              display: 'none',
            }}
            className="mobile-sidebar"
          >
            <nav style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              padding: '16px',
            }}>
              <button
                onClick={() => {
                  setScreen('app');
                  setIsMobileMenuOpen(false);
                }}
                style={{
                  padding: '14px 16px',
                  background: screen === 'app' ? 'rgba(167, 139, 250, 0.15)' : 'transparent',
                  border: `1px solid ${screen === 'app' ? '#a78bfa' : '#334155'}`,
                  color: screen === 'app' ? '#a78bfa' : '#cbd5e1',
                  cursor: 'pointer',
                  borderRadius: '8px',
                  fontWeight: 600,
                  fontSize: '16px',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = 'rgba(167, 139, 250, 0.1)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = screen === 'app' ? 'rgba(167, 139, 250, 0.15)' : 'transparent';
                }}
              >
                Home
              </button>
              <button
                onClick={() => {
                  setScreen('admin');
                  setIsMobileMenuOpen(false);
                }}
                style={{
                  padding: '14px 16px',
                  background: screen === 'admin' ? 'rgba(167, 139, 250, 0.15)' : 'transparent',
                  border: `1px solid ${screen === 'admin' ? '#a78bfa' : '#334155'}`,
                  color: screen === 'admin' ? '#a78bfa' : '#cbd5e1',
                  cursor: 'pointer',
                  borderRadius: '8px',
                  fontWeight: 600,
                  fontSize: '16px',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = 'rgba(167, 139, 250, 0.1)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = screen === 'admin' ? 'rgba(167, 139, 250, 0.15)' : 'transparent';
                }}
              >
                Admin
              </button>
            </nav>
          </div>
        </>
      )}

      <style>{`
        @media (max-width: 768px) {
          .desktop-nav {
            display: none !important;
          }
          .mobile-menu-btn {
            display: block !important;
          }
          .mobile-overlay {
            display: block !important;
          }
          .mobile-sidebar {
            display: flex !important;
          }
          @keyframes slideIn {
            from {
              transform: translateX(100%);
            }
            to {
              transform: translateX(0);
            }
          }
        }
      `}</style>
    </>
  );
}

// ── Inner router (has access to AuthContext) ──────────────
function AppRouter() {
  const { isAuthenticated } = useAuth();
  const [screen, setScreen] = useState('login');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('');

  // Once authenticated, always show app
  if (isAuthenticated) {
    return (
      <div style={{ minHeight: '100vh', background: '#0f172a' }}>
        <TopNav 
          screen={screen} 
          setScreen={setScreen}
          isMobileMenuOpen={isMobileMenuOpen}
          setIsMobileMenuOpen={setIsMobileMenuOpen}
        />
        <div style={{
          width: '100%',
          maxWidth: '1400px',
          margin: '0 auto',
          padding: '0',
        }}>
          {screen === 'admin' ? <AdminDashboard /> : <MainApp />}
        </div>
      </div>
    );
  }

 if (screen === 'register') {
  return (
    <RegisterPage
      onRegistered={(email) => {
        setResetEmail(email);
        setScreen('otp');
      }}
      onGoLogin={() => setScreen('login')}
    />
  );
}
  if (screen === 'reset') {
  return (
    <ResetPasswordPage
      email={resetEmail}
      onDone={() => setScreen('login')}
    />
  );

  }

  if (screen === 'otp') {
    return (
      <OTPVerificationPage
        onVerified={() => setScreen('login')}
      />
    );
  }
if (screen === 'forgot') {
  return (
    <ForgotPasswordPage
      onNext={(email) => {
        setResetEmail(email);
        setScreen('reset'); // 🔥 NOT login
      }}
      onBack={() => setScreen('login')}
    />
  );

}

  return (
 <LoginPage
  onGoRegister={() => setScreen('register')}   // 🔥 THIS FIXES REGISTER BUTTON
  onForgotPassword={(email) => {
    setResetEmail(email);
    setScreen('forgot');
  }}
/>
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
