// src/components/MemberManagement.jsx
import { useEffect, useMemo, useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { useHome } from '../context/HomeContext';
import { adminApi, homeApi } from '../api';
import { formatCount } from '../utils/numberFormat';

const money = value => `৳${Number(value || 0).toFixed(2)}`;

export default function MemberManagement() {
  const { members, currentHome, meals, expenses } = useHome();
  const [latestBill, setLatestBill] = useState(null);
  const [copied,     setCopied]     = useState(false);
  const [joinCode,   setJoinCode]   = useState('');
  const [joinError,  setJoinError]  = useState('');
  const [joinLoading,setJoinLoading]= useState(false);
  const [joinSuccess,setJoinSuccess]= useState('');

  const inviteCode = currentHome?.inviteCode || '—';

  useEffect(() => {
    const homeId = currentHome?._id;
    if (!homeId) {
      setLatestBill(null);
      return;
    }
    adminApi.getBills(homeId)
      .then(bills => setLatestBill(Array.isArray(bills) ? bills[0] || null : null))
      .catch(error => {
        console.error('Failed to load latest member bill:', error);
        setLatestBill(null);
      });
  }, [currentHome?._id]);

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
              const billEntry = latestBill?.breakdown?.find(item => String(item.userId) === String(memberId));
              const excludedWaterUsers = new Set((currentHome?.waterBillExcludedUsers || []).map(user => String(user?._id || user)));
              const billWaterExpenses = (expenses || []).filter(expense => {
                if (expense.category !== 'WaterSupply') return false;
                const expenseDate = new Date(expense.createdAt || expense.date);
                const start = latestBill?.periodStart ? new Date(latestBill.periodStart) : null;
                const end = latestBill?.periodEnd ? new Date(latestBill.periodEnd) : null;
                return start && end && !Number.isNaN(expenseDate.getTime()) && expenseDate >= start && expenseDate < end;
              }).reduce((sum, expense) => sum + Number(expense.amount || 0), 0);
              const recordedBillWaterCost = Number(latestBill?.waterCost ?? latestBill?.costSummary?.water ?? 0);
              const billWaterCost = billWaterExpenses || recordedBillWaterCost;
              const eligibleMembers = members.filter(homeMember => {
                const userId = homeMember.user?._id || homeMember.user?.id || homeMember.user;
                return userId && !excludedWaterUsers.has(String(userId));
              }).length;
              const waterShare = excludedWaterUsers.has(String(memberId)) || !eligibleMembers
                ? 0
                : billWaterCost / eligibleMembers;

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
                    <p className="mt-1 text-xl font-bold text-white">{formatCount(usage.meals)}</p>
                  </div>
                  <div className="rounded-lg border border-white/10 bg-white/5 px-4 py-3">
                    <p className="text-xs font-semibold uppercase text-gray-400">Eggs Consumed</p>
                    <p className="mt-1 text-xl font-bold text-white">{formatCount(usage.eggs)}</p>
                  </div>
                </div>
                <div className="rounded-lg border border-sky-400/20 bg-slate-950/50 px-4 py-3 sm:col-span-2">
                  <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                    <p className="text-xs font-semibold uppercase text-sky-200">Latest bill</p>
                    <span className="text-xs text-gray-400">{latestBill?.month || 'No bill sent yet'}</span>
                  </div>
                  {billEntry ? <div className="grid gap-2 sm:grid-cols-2">
                    <div className="flex items-center justify-between gap-2 rounded-md bg-white/5 px-3 py-2"><span className="text-sm text-gray-300">Meal bill</span><strong className="text-white">{money(billEntry.share)}</strong></div>
                    <div className="flex items-center justify-between gap-2 rounded-md border border-sky-400/20 bg-sky-400/5 px-3 py-2"><span className="text-sm font-semibold text-sky-200">Water supply bill</span><strong className="text-sky-100">{money(waterShare)}</strong></div>
                  </div> : <p className="text-sm text-gray-400">{latestBill ? 'No individual bill breakdown for this member.' : 'Bills will appear here after the first bill is sent.'}</p>}
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
