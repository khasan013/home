// src/components/MemberManagement.jsx
import { useMemo, useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { useHome } from '../context/HomeContext';
import { homeApi } from '../api';

export default function MemberManagement() {
  const { members, currentHome, meals } = useHome();
  const [copied,     setCopied]     = useState(false);
  const [joinCode,   setJoinCode]   = useState('');
  const [joinError,  setJoinError]  = useState('');
  const [joinLoading,setJoinLoading]= useState(false);
  const [joinSuccess,setJoinSuccess]= useState('');

  const inviteCode = currentHome?.inviteCode || '—';

  const memberUsage = useMemo(() => {
    return meals.reduce((totals, meal) => {
      const userId = meal.userId?._id || meal.userId?.id || meal.userId;
      if (!userId) return totals;

      const key = String(userId);
      const current = totals[key] || { meals: 0, eggs: 0 };
      totals[key] = {
        meals: current.meals + (Number(meal.mealCount) || 0),
        eggs: current.eggs + (Number(meal.eggsCount) || 0),
      };
      return totals;
    }, {});
  }, [meals]);

  const copyCode = () => {
    navigator.clipboard.writeText(inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleJoin = async (e) => {
    e.preventDefault();
    setJoinError('');
    setJoinSuccess('');
    setJoinLoading(true);
    try {
      const home = await homeApi.join({ inviteCode: joinCode.trim().toUpperCase() });
      setJoinSuccess(`✅ Joined "${home.name}" successfully!`);
      setJoinCode('');
    } catch (err) {
      setJoinError(err.message);
    } finally {
      setJoinLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Invite Code Card */}
      <div className="bg-white/5 border border-purple-500/30 rounded-xl p-6 space-y-3">
        <h4 className="text-white font-semibold">📎 Invite Code</h4>
        <p className="text-gray-400 text-sm">Share this code with people you want to invite to this home.</p>
        <div className="flex items-center gap-3">
          <span className="flex-1 text-center text-2xl font-mono font-bold tracking-widest text-purple-300 bg-white/10 py-3 rounded-lg border border-white/10">
            {inviteCode}
          </span>
          <button onClick={copyCode}
            className="p-3 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition">
            {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Join Home Form */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-6 space-y-3">
        <h4 className="text-white font-semibold">🔗 Join a Home</h4>
        <p className="text-gray-400 text-sm">Enter an invite code to join an existing home.</p>
        <form onSubmit={handleJoin} className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            maxLength={8}
            placeholder="Enter code (e.g. A3F9B2C1)"
            value={joinCode}
            onChange={e => setJoinCode(e.target.value)}
            className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 font-mono uppercase tracking-widest"
          />
          <button type="submit" disabled={joinLoading || !joinCode}
            className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition disabled:opacity-50">
            {joinLoading ? '...' : 'Join'}
          </button>
        </form>
        {joinError   && <p className="text-red-400 text-sm">{joinError}</p>}
        {joinSuccess && <p className="text-green-400 text-sm">{joinSuccess}</p>}
      </div>

      {/* Members List */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-white">Home Members</h3>
          <span className="text-gray-400 text-sm">{members.length} member{members.length !== 1 ? 's' : ''}</span>
        </div>

        <div className="space-y-2">
          {members.length === 0 ? (
            <p className="text-gray-400 text-center py-8">No members yet</p>
          ) : (
            members.map((member) => {
              const memberId = member.user?._id || member.user?.id || member.user;
              const usage = memberUsage[String(memberId)] || { meals: 0, eggs: 0 };

              return (
              <div key={member._id || memberId} className="bg-white/5 border border-white/10 rounded-lg p-4 flex flex-col gap-4">
                <div className="min-w-0">
                  <p className="text-white font-semibold">
                    {member.user?.firstName} {member.user?.lastName}
                  </p>
                  <p className="text-gray-300 text-sm break-all">{member.user?.email}</p>
                </div>
                <span className={`self-start px-3 py-1 rounded-full text-xs font-semibold ${
                  member.role === 'admin'
                    ? 'bg-purple-500/30 text-purple-200'
                    : 'bg-gray-500/30 text-gray-200'
                }`}>
                  {member.role === 'admin' ? '👑 Admin' : 'Member'}
                </span>
                <div className="grid grid-cols-2 gap-3 sm:col-span-2">
                  <div className="rounded-lg border border-white/10 bg-white/5 px-4 py-3">
                    <p className="text-xs font-semibold uppercase text-gray-400">Meals Consumed</p>
                    <p className="mt-1 text-xl font-bold text-white">{usage.meals}</p>
                  </div>
                  <div className="rounded-lg border border-white/10 bg-white/5 px-4 py-3">
                    <p className="text-xs font-semibold uppercase text-gray-400">Eggs Consumed</p>
                    <p className="mt-1 text-xl font-bold text-white">{usage.eggs}</p>
                  </div>
                </div>
              </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
