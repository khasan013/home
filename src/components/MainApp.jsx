// src/components/MainApp.jsx
import { useState, useEffect } from 'react';
import { Home, LogOut, Users, TrendingUp, Settings, ChevronDown, Plus, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useHome } from '../context/HomeContext';
import { homeApi } from '../api';
import HomeDashboard from './HomeDashboard';

export default function MainApp() {
  const { user, logout }               = useAuth();
  const { homes, setHomes, currentHome, setCurrentHome } = useHome();
  const [sidebarOpen,  setSidebarOpen]  = useState(true);
  const [showNewHome,  setShowNewHome]  = useState(false);
  const [newHomeName,  setNewHomeName]  = useState('');
  const [activeNav,    setActiveNav]    = useState('Dashboard');
  const [error,        setError]        = useState('');

  // Load all homes on mount
  useEffect(() => {
    homeApi.getAll()
      .then(data => {
        setHomes(data);
        if (data.length > 0 && !currentHome) setCurrentHome(data[0]);
      })
      .catch(console.error);
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

  const navItems = [
    { icon: Home,       label: 'Dashboard' },
    { icon: TrendingUp, label: 'Analytics' },
    { icon: Users,      label: 'Members'   },
    { icon: Settings,   label: 'Settings'  },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex">
      {/* ── Sidebar ── */}
      <div className={`${sidebarOpen ? 'w-64' : 'w-0'} bg-white/5 border-r border-white/10 backdrop-blur-sm transition-all duration-300 overflow-hidden flex-shrink-0`}>
        <div className="p-6 space-y-6 h-screen flex flex-col">
          {/* Logo */}
          <div>
            <h1 className="text-2xl font-bold text-white">Meal Mate</h1>
            <p className="text-gray-400 text-sm">Fair Sharing</p>
          </div>

          {/* Home Switcher */}
          <div className="space-y-2">
            <p className="text-gray-500 text-xs uppercase font-semibold tracking-wider">Your Homes</p>
            {homes.map(home => (
              <button key={home._id} onClick={() => setCurrentHome(home)}
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
                <input value={newHomeName} onChange={e => setNewHomeName(e.target.value)}
                  placeholder="Home name" required
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:border-purple-500" />
                {error && <p className="text-red-400 text-xs">{error}</p>}
                <div className="flex gap-2">
                  <button type="submit" className="flex-1 py-1 bg-purple-500 text-white text-sm rounded-lg">Create</button>
                  <button type="button" onClick={() => setShowNewHome(false)} className="px-3 py-1 text-gray-400 hover:text-white text-sm">✕</button>
                </div>
              </form>
            ) : (
              <button onClick={() => setShowNewHome(true)}
                className="w-full flex items-center gap-2 px-3 py-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg text-sm transition">
                <Plus className="w-4 h-4" /> New Home
              </button>
            )}
          </div>

          {/* Nav */}
          <nav className="space-y-1 flex-1">
            {navItems.map(({ icon: Icon, label }) => (
              <button key={label} onClick={() => setActiveNav(label)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                  activeNav === label
                    ? 'bg-white/10 text-white'
                    : 'text-gray-300 hover:bg-white/10 hover:text-white'
                }`}>
                <Icon className="w-5 h-5" />
                <span>{label}</span>
              </button>
            ))}
          </nav>

          {/* User + Logout */}
          <div className="pt-4 border-t border-white/10 space-y-3">
            <div className="flex items-center gap-3 px-2">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold">
                {user?.firstName?.[0] || user?.email?.[0]?.toUpperCase() || '?'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-semibold truncate">{user?.firstName || 'User'}</p>
                <p className="text-gray-400 text-xs truncate">{user?.email}</p>
              </div>
            </div>
            <button onClick={logout}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 text-red-300 hover:bg-red-500/20 rounded-lg transition">
              <LogOut className="w-4 h-4" /> Logout
            </button>
          </div>
        </div>
      </div>

      {/* ── Main Content ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <div className="bg-white/5 border-b border-white/10 backdrop-blur-sm px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-white/10 rounded-lg transition">
              <ChevronDown className={`w-5 h-5 text-white transition-transform ${sidebarOpen ? '-rotate-90' : 'rotate-90'}`} />
            </button>
            <h2 className="text-xl font-bold text-white">{currentHome?.name || 'Select or create a home'}</h2>
            {currentHome?.inviteCode && (
              <span className="text-xs bg-white/10 text-gray-300 px-2 py-1 rounded font-mono">
                Code: {currentHome.inviteCode}
              </span>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {currentHome ? <HomeDashboard /> : (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
              <AlertCircle className="w-16 h-16 text-gray-600" />
              <p className="text-gray-400 text-lg">No home selected. Create or join one from the sidebar.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
