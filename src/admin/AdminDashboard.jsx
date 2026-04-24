import { useState, useEffect } from 'react';
import {
  Users, Trash2, User,
  AlertTriangle, PlusCircle
} from 'lucide-react';

import { useHome } from '../context/HomeContext';
import { adminApi } from '../api';

export default function AdminDashboard() {
  const { currentHome } = useHome();
  const homeId = currentHome?._id;

  const [members, setMembers] = useState([]);
  const [penalties, setPenalties] = useState([]);
  const [loadingAction, setLoadingAction] = useState('');

  // ✅ penalty form state
  const [penaltyData, setPenaltyData] = useState({
    userId: '',
    amount: '',
    reason: '',
  });

  // ─────────────────────────────
  // LOAD DATA
  // ─────────────────────────────
  useEffect(() => {
    if (!homeId) return;

    loadData();
  }, [homeId]);

  const loadData = async () => {
    try {
      const m = await adminApi.getMembers(homeId);
      const p = await adminApi.getPenalties(homeId);

      setMembers(m);
      setPenalties(p);
    } catch (err) {
      console.error(err);
    }
  };

  // ─────────────────────────────
  // MEMBER ACTIONS
  // ─────────────────────────────
  const handlePromote = async (userId) => {
    setLoadingAction(userId);
    try {
      const updated = await adminApi.promoteUser(homeId, userId);

      setMembers(prev =>
        prev.map(m =>
          m.user?._id === userId ? { ...m, role: updated.role } : m
        )
      );
    } catch (err) {
      alert(err.message);
    } finally {
      setLoadingAction('');
    }
  };

  const handleRemove = async (userId) => {
    if (!confirm('Remove this member?')) return;

    setLoadingAction(userId);
    try {
      await adminApi.removeUser(homeId, userId);

      setMembers(prev => prev.filter(m => m.user?._id !== userId));
    } catch (err) {
      alert(err.message);
    } finally {
      setLoadingAction('');
    }
  };

  // ─────────────────────────────
  // SET PENALTY 🔥
  // ─────────────────────────────
  const handlePenaltySubmit = async (e) => {
    e.preventDefault();

    if (!penaltyData.userId || !penaltyData.amount) {
      return alert('Select user and amount');
    }

    try {
      const newPenalty = await adminApi.addPenalty(homeId, {
        userId: penaltyData.userId,
        amount: Number(penaltyData.amount),
        reason: penaltyData.reason,
      });

      setPenalties(prev => [newPenalty, ...prev]);

      setPenaltyData({
        userId: '',
        amount: '',
        reason: '',
      });

    } catch (err) {
      alert(err.message);
    }
  };

  // ─────────────────────────────
  // TOTAL PENALTY
  // ─────────────────────────────
  const totalPenalty = penalties.reduce(
    (sum, p) => sum + (p.amount || 0),
    0
  );

  // ─────────────────────────────
  // UI
  // ─────────────────────────────
  return (
    <div className="p-6 text-white">

      <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>

      {/* ───────── OVERVIEW ───────── */}
      <div className="grid grid-cols-3 gap-4 mb-6">

        <div className="bg-gray-800 p-4 rounded">
          <p>Total Members</p>
          <h2 className="text-xl font-bold">{members.length}</h2>
        </div>

        <div className="bg-gray-800 p-4 rounded">
          <p>Total Penalty</p>
          <h2 className="text-xl font-bold">৳{totalPenalty}</h2>
        </div>

        <div className="bg-gray-800 p-4 rounded">
          <p>Penalties Count</p>
          <h2 className="text-xl font-bold">{penalties.length}</h2>
        </div>

      </div>

      {/* ───────── MEMBERS ───────── */}
      <div className="mb-8">
        <h2 className="text-xl mb-3">Members</h2>

        <table className="w-full">
          <thead>
            <tr className="text-left text-gray-400">
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            {members.map(m => (
              <tr key={m.user?._id} className="border-b border-gray-700">

                <td>{m.user?.firstName || 'Unknown'}</td>
                <td>{m.user?.email}</td>
                <td>{m.role}</td>

                <td className="flex gap-2 py-2">

                  <button
                    onClick={() => handlePromote(m.user?._id)}
                    className="text-blue-400"
                  >
                    <User size={18} />
                  </button>

                  <button
                    onClick={() => handleRemove(m.user?._id)}
                    className="text-red-400"
                  >
                    <Trash2 size={18} />
                  </button>

                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ───────── ADD PENALTY 🔥 ───────── */}
      <div className="mb-8">
        <h2 className="text-xl mb-3">Set Penalty</h2>

        <form
          onSubmit={handlePenaltySubmit}
          className="flex gap-3 flex-wrap"
        >
          <select
            value={penaltyData.userId}
            onChange={(e) =>
              setPenaltyData({ ...penaltyData, userId: e.target.value })
            }
            className="p-2 bg-gray-800 rounded"
          >
            <option value="">Select User</option>
            {members.map(m => (
              <option key={m.user?._id} value={m.user?._id}>
                {m.user?.firstName}
              </option>
            ))}
          </select>

          <input
            type="number"
            placeholder="Amount"
            value={penaltyData.amount}
            onChange={(e) =>
              setPenaltyData({ ...penaltyData, amount: e.target.value })
            }
            className="p-2 bg-gray-800 rounded"
          />

          <input
            type="text"
            placeholder="Reason"
            value={penaltyData.reason}
            onChange={(e) =>
              setPenaltyData({ ...penaltyData, reason: e.target.value })
            }
            className="p-2 bg-gray-800 rounded"
          />

          <button
            type="submit"
            className="flex items-center gap-2 px-4 bg-purple-500 rounded"
          >
            <PlusCircle size={16} />
            Add
          </button>
        </form>
      </div>

      {/* ───────── PENALTY LIST ───────── */}
      <div>
        <h2 className="text-xl mb-3">Penalty List</h2>

        <table className="w-full">
          <thead>
            <tr className="text-left text-gray-400">
              <th>User</th>
              <th>Amount</th>
              <th>Reason</th>
            </tr>
          </thead>

          <tbody>
            {penalties.map(p => (
              <tr key={p._id} className="border-b border-gray-700">

                <td>{p.userId?.firstName || 'Unknown'}</td>
                <td>৳{p.amount}</td>
                <td>{p.reason || '-'}</td>

              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
}