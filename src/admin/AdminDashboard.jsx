// src/admin/AdminDashboard.jsx
import { useState, useEffect } from 'react';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { Users, AlertTriangle, Download, Lock, Trash2, User, DollarSign } from 'lucide-react';
import { useHome } from '../context/HomeContext';
import { adminApi } from '../api';

export default function AdminDashboard() {
  const { currentHome } = useHome();
  const homeId = currentHome?._id;

  const [activeTab,       setActiveTab]       = useState('overview');
  const [members,         setMembers]         = useState([]);
  const [penalties,       setPenalties]       = useState([]);
  const [showPenaltyForm, setShowPenaltyForm] = useState(false);
  const [loadingAction,   setLoadingAction]   = useState('');
  const [newPenalty, setNewPenalty] = useState({
    userId: '', amount: '', reason: '',
    month: new Date().getMonth() + 1,
    year:  new Date().getFullYear(),
  });

  // ── Fetch data ────────────────────────────────────────
  useEffect(() => {
    if (!homeId) return;
    adminApi.getMembers(homeId).then(setMembers).catch(console.error);
    adminApi.getPenalties(homeId).then(setPenalties).catch(console.error);
  }, [homeId]);

  // Chart data derived from live members
  const memberDistributionData = members.map(m => ({
    name:  m.user?.firstName || m.user?.email || '?',
    value: m.totalCost || 0,
  }));

  // ── Actions ───────────────────────────────────────────
  const handlePromote = async (userId) => {
    setLoadingAction(userId);
    try {
      const updated = await adminApi.promoteUser(homeId, userId);
      setMembers(prev => prev.map(m =>
        (m.user?._id === userId) ? { ...m, role: updated.role } : m
      ));
    } catch (err) { alert(err.message); }
    finally { setLoadingAction(''); }
  };

  const handleRemove = async (userId) => {
    if (!confirm('Remove this member from the home?')) return;
    setLoadingAction(userId);
    try {
      await adminApi.removeUser(homeId, userId);
      setMembers(prev => prev.filter(m => m.user?._id !== userId));
    } catch (err) { alert(err.message); }
    finally { setLoadingAction(''); }
  };

  const handleAddPenalty = async (e) => {
    e.preventDefault();
    try {
      const penalty = await adminApi.addPenalty(homeId, {
        ...newPenalty,
        amount: parseFloat(newPenalty.amount),
      });
      setPenalties(prev => [penalty, ...prev]);
      setNewPenalty({ userId: '', amount: '', reason: '', month: new Date().getMonth() + 1, year: new Date().getFullYear() });
      setShowPenaltyForm(false);
    } catch (err) { alert(err.message); }
  };

  const handleRemovePenalty = async (penId) => {
    if (!confirm('Delete this penalty?')) return;
    try {
      await adminApi.removePenalty(homeId, penId);
      setPenalties(prev => prev.filter(p => p._id !== penId));
    } catch (err) { alert(err.message); }
  };

  const tabs = [
    { id: 'overview',   label: 'Overview',  icon: '📊' },
    { id: 'members',    label: 'Members',   icon: '👥' },
    { id: 'penalties',  label: 'Penalties', icon: '⚠️' },
    { id: 'settings',   label: 'Settings',  icon: '⚙️' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Admin Dashboard</h1>
            <p className="text-gray-400">Home: <span className="text-purple-400">{currentHome?.name || 'None selected'}</span></p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-white/10 overflow-x-auto">
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-3 font-semibold whitespace-nowrap transition ${
                activeTab === tab.id
                  ? 'text-purple-400 border-b-2 border-purple-500'
                  : 'text-gray-400 hover:text-gray-300'
              }`}>
              <span>{tab.icon}</span> {tab.label}
            </button>
          ))}
        </div>

        {/* ── Overview ── */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[
                { label: 'Total Members',    value: members.length,                                       icon: <Users      className="w-10 h-10 text-blue-400   opacity-20" /> },
                { label: 'Active Penalties', value: penalties.length,                                     icon: <AlertTriangle className="w-10 h-10 text-red-400  opacity-20" /> },
                { label: 'Total Penalties',  value: `৳${penalties.reduce((s, p) => s + p.amount, 0)}`,   icon: <DollarSign className="w-10 h-10 text-amber-400  opacity-20" /> },
                { label: 'Admins',           value: members.filter(m => m.role === 'admin').length,       icon: <Lock       className="w-10 h-10 text-purple-400 opacity-20" /> },
              ].map(({ label, value, icon }) => (
                <div key={label} className="bg-white/5 border border-white/10 rounded-xl p-6 backdrop-blur-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-400 text-sm mb-1">{label}</p>
                      <p className="text-3xl font-bold text-white">{value}</p>
                    </div>
                    {icon}
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white/5 border border-white/10 rounded-xl p-6 backdrop-blur-sm">
                <h3 className="text-lg font-semibold text-white mb-4">Cost by Member</h3>
                {memberDistributionData.length === 0 ? (
                  <p className="text-gray-400 text-center py-16">No data yet</p>
                ) : (
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={memberDistributionData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                      <XAxis dataKey="name" stroke="rgba(255,255,255,0.5)" />
                      <YAxis stroke="rgba(255,255,255,0.5)" />
                      <Tooltip contentStyle={{ backgroundColor: 'rgba(15,23,42,0.9)', border: '1px solid rgba(255,255,255,0.2)' }} />
                      <Bar dataKey="value" fill="#8b5cf6" name="Amount (৳)" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>

              {/* Penalty breakdown */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-6 backdrop-blur-sm">
                <h3 className="text-lg font-semibold text-white mb-4">Recent Penalties</h3>
                <div className="space-y-2">
                  {penalties.slice(0, 5).map(p => (
                    <div key={p._id} className="flex justify-between text-sm">
                      <span className="text-gray-300">{p.reason}</span>
                      <span className="text-red-400 font-semibold">৳{p.amount}</span>
                    </div>
                  ))}
                  {penalties.length === 0 && <p className="text-gray-400 text-center py-8">No penalties</p>}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Members ── */}
        {activeTab === 'members' && (
          <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10 bg-white/5">
                    {['Name', 'Email', 'Role', 'Actions'].map(h => (
                      <th key={h} className="px-6 py-4 text-left text-sm font-semibold text-white">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {members.map((m) => {
                    const userId = m.user?._id;
                    return (
                      <tr key={userId} className="hover:bg-white/5 transition">
                        <td className="px-6 py-4 text-white font-semibold">
                          {m.user?.firstName} {m.user?.lastName}
                        </td>
                        <td className="px-6 py-4 text-gray-300">{m.user?.email}</td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            m.role === 'admin' ? 'bg-purple-500/30 text-purple-200' : 'bg-gray-500/30 text-gray-200'
                          }`}>
                            {m.role === 'admin' ? '👑 Admin' : 'Member'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            <button onClick={() => handlePromote(userId)}
                              disabled={loadingAction === userId}
                              title={m.role === 'admin' ? 'Demote' : 'Promote'}
                              className="p-2 hover:bg-purple-500/20 rounded-lg transition text-purple-400 disabled:opacity-40">
                              <User className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleRemove(userId)}
                              disabled={loadingAction === userId}
                              title="Remove"
                              className="p-2 hover:bg-red-500/20 rounded-lg transition text-red-400 disabled:opacity-40">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {members.length === 0 && (
                <p className="text-gray-400 text-center py-12">No members found</p>
              )}
            </div>
          </div>
        )}

        {/* ── Penalties ── */}
        {activeTab === 'penalties' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-white">Manage Penalties</h3>
              <button onClick={() => setShowPenaltyForm(!showPenaltyForm)}
                className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition font-semibold">
                + Add Penalty
              </button>
            </div>

            {showPenaltyForm && (
              <form onSubmit={handleAddPenalty} className="bg-white/5 border border-white/10 rounded-xl p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-300 mb-2">Member</label>
                    <select value={newPenalty.userId} onChange={e => setNewPenalty({ ...newPenalty, userId: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-800 border border-white/20 rounded-lg text-white focus:outline-none focus:border-purple-500" required>
                      <option value="">Select member</option>
                      {members.map(m => (
                        <option key={m.user?._id} value={m.user?._id}>
                          {m.user?.firstName} {m.user?.lastName || m.user?.email}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-300 mb-2">Amount (৳)</label>
                    <input type="number" value={newPenalty.amount} onChange={e => setNewPenalty({ ...newPenalty, amount: e.target.value })}
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-purple-500" required />
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-gray-300 mb-2">Reason</label>
                  <textarea value={newPenalty.reason} onChange={e => setNewPenalty({ ...newPenalty, reason: e.target.value })}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-purple-500" rows="2" />
                </div>
                <button type="submit"
                  className="w-full py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition font-semibold">
                  Add Penalty
                </button>
              </form>
            )}

            <div className="space-y-2">
              {penalties.map(p => (
                <div key={p._id} className="bg-white/5 border border-white/10 rounded-lg p-4 flex justify-between items-center">
                  <div>
                    <p className="text-white font-semibold">{p.userId?.firstName || 'Member'}</p>
                    <p className="text-gray-300 text-sm">{p.reason}</p>
                    <p className="text-gray-400 text-xs">{p.month}/{p.year}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <p className="text-red-400 font-bold">৳{p.amount}</p>
                    <button onClick={() => handleRemovePenalty(p._id)} className="p-2 hover:bg-red-500/20 rounded-lg transition">
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </button>
                  </div>
                </div>
              ))}
              {penalties.length === 0 && <p className="text-gray-400 text-center py-8">No penalties</p>}
            </div>
          </div>
        )}

        {/* ── Settings ── */}
        {activeTab === 'settings' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Report Settings</h3>
              <div className="space-y-4">
                {['Auto-generate monthly reports', 'Send reports on 1st of month', 'Include activity logs'].map((label, i) => (
                  <label key={label} className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" defaultChecked={i < 2} className="w-4 h-4 rounded" />
                    <span className="text-gray-300">{label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Cost Distribution</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-300 mb-2">Meal Budget (%)</label>
                  <input type="number" defaultValue="70"
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-purple-500" />
                </div>
                <div>
                  <label className="block text-sm text-gray-300 mb-2">Egg Budget (%)</label>
                  <input type="number" defaultValue="30"
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-purple-500" />
                </div>
                <button className="w-full py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition font-semibold">
                  Save Settings
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
