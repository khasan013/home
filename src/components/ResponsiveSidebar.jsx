// src/components/ResponsiveSidebar.jsx
export default function ResponsiveSidebar({ 
  isOpen, 
  onClose, 
  homeSelected, 
  onHomeSelect,
  menuItems = [] 
}) {
  const defaultMenuItems = [
    { icon: '🏠', label: 'Dashboard', key: 'dashboard' },
    { icon: '📊', label: 'Analytics', key: 'analytics' },
    { icon: '👥', label: 'Members', key: 'members' },
    { icon: '⚙️', label: 'Settings', key: 'settings' },
  ];

  const items = menuItems.length > 0 ? menuItems : defaultMenuItems;

  return (
    <>
      {/* Desktop Sidebar - Always visible */}
      <div style={{
        display: 'none',
        width: '100%',
        maxWidth: '280px',
        background: 'linear-gradient(135deg, #0f172a 0%, #1a2540 100%)',
        borderRight: '1px solid #1e293b',
        padding: '24px 0',
        minHeight: '100vh',
        position: 'relative',
        '@media (min-width: 769px)': {
          display: 'flex',
          flexDirection: 'column',
        },
      }} className="sidebar-desktop">
        <nav style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          padding: '0 16px',
        }}>
          {items.map((item) => (
            <button
              key={item.key}
              onClick={() => onHomeSelect(item.key)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '14px 16px',
                background: homeSelected === item.key 
                  ? 'rgba(167, 139, 250, 0.15)' 
                  : 'transparent',
                border: `1px solid ${homeSelected === item.key ? '#a78bfa' : '#334155'}`,
                color: homeSelected === item.key ? '#a78bfa' : '#cbd5e1',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '16px',
                transition: 'all 0.2s',
                width: '100%',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(167, 139, 250, 0.1)';
                e.currentTarget.style.borderColor = '#a78bfa';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = homeSelected === item.key 
                  ? 'rgba(167, 139, 250, 0.15)' 
                  : 'transparent';
                e.currentTarget.style.borderColor = homeSelected === item.key ? '#a78bfa' : '#334155';
              }}
            >
              <span style={{ fontSize: '20px' }}>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Mobile Sidebar - Hamburger Menu */}
      {isOpen && (
        <>
          {/* Overlay */}
          <div
            onClick={onClose}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.5)',
              zIndex: 39,
              display: 'block',
            }}
            className="sidebar-overlay"
          />

          {/* Sidebar Panel */}
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
              display: 'flex',
              flexDirection: 'column',
              paddingTop: '70px',
              paddingBottom: '20px',
              animation: 'slideInRight 0.3s ease-out forwards',
              overflowY: 'auto',
            }}
            className="sidebar-mobile"
          >
            <nav style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              padding: '0 16px',
              flex: 1,
            }}>
              {items.map((item) => (
                <button
                  key={item.key}
                  onClick={() => {
                    onHomeSelect(item.key);
                    onClose();
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '14px 16px',
                    background: homeSelected === item.key 
                      ? 'rgba(167, 139, 250, 0.15)' 
                      : 'transparent',
                    border: `1px solid ${homeSelected === item.key ? '#a78bfa' : '#334155'}`,
                    color: homeSelected === item.key ? '#a78bfa' : '#cbd5e1',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: '16px',
                    transition: 'all 0.2s',
                    width: '100%',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(167, 139, 250, 0.1)';
                    e.currentTarget.style.borderColor = '#a78bfa';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = homeSelected === item.key 
                      ? 'rgba(167, 139, 250, 0.15)' 
                      : 'transparent';
                    e.currentTarget.style.borderColor = homeSelected === item.key ? '#a78bfa' : '#334155';
                  }}
                >
                  <span style={{ fontSize: '20px' }}>{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              ))}
            </nav>

            {/* Logout button at bottom */}
            <div style={{
              padding: '16px',
              borderTop: '1px solid #334155',
            }}>
              <button
                onClick={() => {
                  // Handle logout
                  onClose();
                }}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid #ef4444',
                  color: '#ef4444',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '16px',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                }}
              >
                <span>🚪</span>
                <span>Logout</span>
              </button>
            </div>
          </div>
        </>
      )}

      <style>{`
        @media (max-width: 768px) {
          .sidebar-desktop {
            display: none !important;
          }
        }
        
        @media (min-width: 769px) {
          .sidebar-mobile {
            display: none !important;
          }
          .sidebar-overlay {
            display: none !important;
          }
        }

        @keyframes slideInRight {
          from {
            transform: translateX(100%);
          }
          to {
            transform: translateX(0);
          }
        }
      `}</style>
    </>
  );
}
