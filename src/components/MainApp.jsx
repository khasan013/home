// src/components/MainApp.jsx - Mobile Responsive with Search to Join Home
import { useState, useEffect } from 'react';
import { Home, LogOut, Users, TrendingUp, Settings, ChevronDown, Plus, AlertCircle, Menu, X, Search, Loader, Megaphone, Phone } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useHome } from '../context/HomeContext';
import { homeApi } from '../api';
import HomeDashboard from './HomeDashboard';
import NoticeBoard from './NoticeBoard';
import EmergencyContacts from './EmergencyContacts';

// ── CRITICAL FIX: SidebarContent must be defined OUTSIDE MainApp ──
// When defined inside, React treats it as a brand-new component type on every
// render, causing it to unmount/remount → input loses focus → keyboard dismisses.
function SidebarContent({
  user, logout,
  homes, currentHome, setCurrentHome,
  showJoinForm, setShowJoinForm,
  searchCode, setSearchCode,
  searchError, searchLoading,
  handleJoinHome,
  showNewHome, setShowNewHome,
  newHomeName, setNewHomeName,
  error, setError,
  handleCreateHome,
  activeNav, handleNavClick,
  isMobile, setMobileMenuOpen,
}) {
  const navItems = [
    { icon: Home,       label: 'Dashboard' },
    { icon: TrendingUp, label: 'Analytics' },
    { icon: Users,      label: 'Members'   },
    { icon: Megaphone,  label: 'Notice Board' },
    { icon: Phone,      label: 'Emergency Contacts' },
    { icon: Settings,   label: 'Settings'  },
  ];

  return (
    <div className="sidebar-content premium-scroll h-full min-h-0 flex flex-col overflow-y-auto overscroll-contain">
      {/* Logo */}
      <div>
        <h1 className="text-2xl font-bold text-white">Meal Mate</h1>
        <p className="text-gray-400 text-sm">Fair Sharing</p>
      </div>

      {/* Search to Join Home */}
      <div className="sidebar-section space-y-2">
        {showJoinForm ? (
          <form onSubmit={handleJoinHome} className="space-y-3 bg-white/5 p-4 rounded-lg border border-white/10">
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchCode}
                onChange={e => setSearchCode(e.target.value.toUpperCase())}
                placeholder="Enter invite code"
                maxLength="8"
                className="flex-1 bg-transparent text-white text-sm placeholder-gray-500 focus:outline-none font-mono tracking-wider"
                disabled={searchLoading}
              />
            </div>
            {searchError && <p className="text-red-400 text-xs">{searchError}</p>}
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={searchLoading}
                className="flex-1 py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition disabled:opacity-50 flex items-center justify-center gap-2">
                {searchLoading && <Loader className="w-3 h-3 animate-spin" />}
                {searchLoading ? 'Joining...' : 'Join'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowJoinForm(false);
                  setSearchCode('');
                }}
                disabled={searchLoading}
                className="px-3 py-2 text-gray-400 hover:text-white hover:bg-white/10 text-sm rounded-lg transition disabled:opacity-50">
                ✕
              </button>
            </div>
          </form>
        ) : (
          <button
            onClick={() => setShowJoinForm(true)}
            className="w-full flex items-center gap-2 px-3 py-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg text-sm transition">
            <Search className="w-4 h-4" /> Join Home
          </button>
        )}
      </div>

      {/* Home Switcher */}
      <div className="sidebar-section space-y-2">
        <p className="text-gray-500 text-xs uppercase font-semibold tracking-wider">Your Homes</p>
        {homes.map(home => (
          <button
            key={home._id}
            onClick={() => {
              setCurrentHome(home);
              if (isMobile) setMobileMenuOpen(false);
            }}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm transition truncate ${
              currentHome?._id === home._id
                ? 'bg-purple-500/30 text-white font-semibold'
                : 'text-gray-300 hover:bg-white/10'
            }`}>
            🏠 {home.name}
          </button>
        ))}

        {/* Create New Home */}
        {showNewHome ? (
          <form onSubmit={handleCreateHome} className="space-y-2">
            <input
              value={newHomeName}
              onChange={e => setNewHomeName(e.target.value)}
              placeholder="Home name"
              required
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:border-purple-500"
            />
            {error && <p className="text-red-400 text-xs">{error}</p>}
            <div className="flex gap-2">
              <button type="submit" className="flex-1 py-1 bg-purple-500 text-white text-sm rounded-lg hover:bg-purple-600 transition">
                Create
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowNewHome(false);
                  setNewHomeName('');
                  setError('');
                }}
                className="px-3 py-1 text-gray-400 hover:text-white text-sm transition">
                ✕
              </button>
            </div>
          </form>
        ) : (
          <button
            onClick={() => setShowNewHome(true)}
            className="w-full flex items-center gap-2 px-3 py-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg text-sm transition">
            <Plus className="w-4 h-4" /> New Home
          </button>
        )}
      </div>

      {/* Divider */}
      <div className="border-t border-white/10" />

      {/* Nav */}
      <nav className="sidebar-nav space-y-1 flex-1 min-h-0">
        {navItems.map(({ icon: Icon, label }) => (
          <button
            key={label}
            onClick={() => handleNavClick(label)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
              activeNav === label
                ? 'bg-white/10 text-white'
                : 'text-gray-300 hover:bg-white/10 hover:text-white'
            }`}>
            <Icon className="w-5 h-5 flex-shrink-0" />
            <span className="text-sm md:text-base">{label}</span>
          </button>
        ))}
      </nav>

      {/* User + Logout */}
      <div className="sidebar-user mt-auto pt-4 border-t border-white/10 space-y-3">
        <div className="flex items-center gap-3 px-2">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
            {user?.firstName?.[0] || user?.email?.[0]?.toUpperCase() || '?'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-semibold truncate">{user?.firstName || 'User'}</p>
            <p className="text-gray-400 text-xs truncate">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 text-red-300 hover:bg-red-500/20 rounded-lg transition">
          <LogOut className="w-4 h-4" /> Logout
        </button>
      </div>
    </div>
  );
}

export default function MainApp() {
  const { user, logout }               = useAuth();
  const { homes, setHomes, currentHome, setCurrentHome } = useHome();
  const [sidebarOpen,  setSidebarOpen]  = useState(window.innerWidth >= 768);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showNewHome,  setShowNewHome]  = useState(false);
  const [newHomeName,  setNewHomeName]  = useState('');
  const [activeNav,    setActiveNav]    = useState('Dashboard');
  const [error,        setError]        = useState('');
  const [isMobile,     setIsMobile]     = useState(window.innerWidth < 768);

  // Search to join home
  const [searchCode,    setSearchCode]    = useState('');
  const [searchError,   setSearchError]   = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [showJoinForm,  setShowJoinForm]  = useState(false);

  // Load all homes on mount
  useEffect(() => {
    homeApi.getAll()
      .then(data => {
        setHomes(data);
        if (data.length > 0 && !currentHome) setCurrentHome(data[0]);
      })
      .catch(console.error);
  }, []);

  // Handle responsive sidebar
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) {
        setSidebarOpen(true);
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleCreateHome = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const home = await homeApi.create({ name: newHomeName });
      setHomes(prev => [...prev, home]);
      setCurrentHome(home);
      setNewHomeName('');
      setShowNewHome(false);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleJoinHome = async (e) => {
    e.preventDefault();
    setSearchError('');
    setSearchLoading(true);
    try {
      if (!searchCode.trim()) {
        setSearchError('Please enter an invite code');
        setSearchLoading(false);
        return;
      }
      const home = await homeApi.joinByCode(searchCode.trim());
      setHomes(prev => {
        const exists = prev.some(h => h._id === home._id);
        return exists ? prev : [...prev, home];
      });
      setCurrentHome(home);
      setSearchCode('');
      setShowJoinForm(false);
      setSearchError('');
    } catch (err) {
      setSearchError(err.message || 'Invalid invite code or home not found');
    } finally {
      setSearchLoading(false);
    }
  };

  const handleNavClick = (label) => {
    setActiveNav(label);
    if (isMobile) setMobileMenuOpen(false);
  };

  // Shared props passed down to SidebarContent
  const sidebarProps = {
    user, logout,
    homes, currentHome, setCurrentHome,
    showJoinForm, setShowJoinForm,
    searchCode, setSearchCode,
    searchError, searchLoading,
    handleJoinHome,
    showNewHome, setShowNewHome,
    newHomeName, setNewHomeName,
    error, setError,
    handleCreateHome,
    activeNav, handleNavClick,
    isMobile, setMobileMenuOpen,
  };

  return (
    <div className="app-shell min-h-screen min-h-svh flex flex-col md:flex-row overflow-x-hidden">
      {/* ── DESKTOP SIDEBAR (hidden on mobile) ── */}
      <div className={`hidden md:flex premium-sidebar border-r border-white/10 transition-all duration-300 overflow-hidden flex-shrink-0 ${
        sidebarOpen ? 'md:w-72' : 'md:w-0'
      }`}>
        {sidebarOpen && <SidebarContent {...sidebarProps} />}
      </div>

      {/* ── MOBILE OVERLAY ── */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* ── MOBILE SIDEBAR (drawer) ── */}
      <div
        className={`mobile-drawer fixed md:hidden top-0 left-0 h-screen min-h-svh w-[86vw] max-w-[320px] premium-sidebar border-r border-white/10 z-50 transform transition-transform duration-300 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="mobile-drawer-inner">
          <SidebarContent {...sidebarProps} />
        </div>
      </div>

      {/* ── Main Content ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <div className="premium-topbar px-3 sm:px-4 md:px-6 py-3 md:py-4 flex justify-between items-center sticky top-0 z-30">
          <div className="flex items-center gap-2 md:gap-4 flex-1 min-w-0">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden premium-icon-button">
              {mobileMenuOpen ? (
                <X className="w-5 h-5 text-white" />
              ) : (
                <Menu className="w-5 h-5 text-white" />
              )}
            </button>

            {/* Desktop Sidebar Toggle */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="hidden md:block premium-icon-button">
              <ChevronDown className={`w-5 h-5 text-white transition-transform ${sidebarOpen ? '-rotate-90' : 'rotate-90'}`} />
            </button>

            {/* Home Title */}
            <h2 className="text-lg md:text-xl font-bold text-white truncate">
              {currentHome?.name || 'Select a home'}
            </h2>

            {/* Invite Code Badge */}
            {currentHome?.inviteCode && (
              <span className="hidden sm:inline text-xs bg-emerald-400/10 text-emerald-200 px-2.5 py-1 rounded-full font-mono whitespace-nowrap border border-emerald-300/20">
                {currentHome.inviteCode}
              </span>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="main-content flex-1 overflow-auto premium-scroll p-3 sm:p-4 md:p-6">
          {currentHome ? (
            activeNav === 'Notice Board' ? (
              <NoticeBoard />
            ) : activeNav === 'Emergency Contacts' ? (
              <EmergencyContacts />
            ) : (
              <HomeDashboard key={activeNav} activeNav={activeNav} />
            )
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
              <AlertCircle className="w-12 h-12 md:w-16 md:h-16 text-gray-600" />
              <p className="text-gray-400 text-base md:text-lg">
                No home selected. Create or join one from the sidebar.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
