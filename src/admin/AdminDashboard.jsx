import { useState, useEffect } from 'react';
import {
  Trash2, User, PlusCircle, Mail, Pencil
} from 'lucide-react';

import { useHome } from '../context/HomeContext';
import { adminApi, mealApi } from '../api';

export default function AdminDashboard() {
  const { currentHome } = useHome();
  const homeId = currentHome?._id;

  const [members, setMembers] = useState([]);
  const [penalties, setPenalties] = useState([]);
  const [meals, setMeals] = useState([]);
  const [loadingAction, setLoadingAction] = useState('');

  const [penaltyData, setPenaltyData] = useState({
    userId: '',
    meals: '',
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
      const mealData = await mealApi.getAll(homeId);

      setMembers(m);
      setPenalties(p);
      setMeals(mealData);
    } catch (err) {
      console.error(err);
    }
  };

  // ─────────────────────────────
  // MEMBER ACTIONS
  // ─────────────────────────────
  const handlePromote = async (userId) => {
    const updated = await adminApi.promoteUser(homeId, userId);

    setMembers(prev =>
      prev.map(m =>
        m.user?._id === userId ? { ...m, role: updated.role } : m
      )
    );
  };

  const handleRemove = async (userId) => {
    if (!confirm('Remove this member?')) return;

    await adminApi.removeUser(homeId, userId);
    setMembers(prev => prev.filter(m => m.user?._id !== userId));
  };

  // ─────────────────────────────
  // PENALTY SYSTEM
  // ─────────────────────────────
  const handlePenaltySubmit = async (e) => {
    e.preventDefault();

    const { userId, meals, reason } = penaltyData;

    if (!userId || !meals) {
      return alert('Select user and meal count');
    }

    try {
      // 1. add meals
      await adminApi.addMealPenalty(homeId, {
        userId,
        meals: Number(meals),
      });

      // 2. save penalty
      const newPenalty = await adminApi.addPenalty(homeId, {
        userId,
        amount: Number(meals),
        reason: reason || `Penalty for ${meals} meals`,
      });

      // 3. send email 🔥
      await adminApi.sendPenaltyEmail({
        userId,
        meals,
        reason,
      });

      setPenalties(prev => [newPenalty, ...prev]);

      setPenaltyData({
        userId: '',
        meals: '',
        reason: '',
      });

      loadData(); // refresh meals

    } catch (err) {
      alert(err.message);
    }
  };

  // ─────────────────────────────
  // MEAL MANAGEMENT
  // ─────────────────────────────
  const handleDeleteMeal = async (mealId) => {
    if (!confirm('Delete this meal?')) return;

    await mealApi.remove(homeId, mealId);
    setMeals(prev => prev.filter(m => m._id !== mealId));
  };

  const handleEditMeal = async (meal) => {
    const newMeal = prompt('Update meal count', meal.mealCount);
    if (newMeal === null) return;

    const updated = await mealApi.update(homeId, meal._id, {
      mealCount: Number(newMeal),
    });

    setMeals(prev =>
      prev.map(m => (m._id === meal._id ? updated : m))
    );
  };

  // ─────────────────────────────
  // BILL SYSTEM
  // ─────────────────────────────
  const handleSendBill = async () => {
    await adminApi.sendBill(homeId);
    alert('📧 Bills sent!');
  };

  const handleDownloadPDF = async () => {
    const blob = await adminApi.downloadBill(homeId);

    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'monthly_bill.pdf';
    a.click();
  };

  // ─────────────────────────────
  // TOTAL PENALTY
  // ─────────────────────────────
  const totalPenalty = penalties.reduce(
    (sum, p) => sum + (p.amount || 0),
    0
  );

  return (
    <div className="p-6 text-white">

      <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>

      {/* OVERVIEW */}
      <div className="grid grid-cols-3 gap-4 mb-6">

        <div className="bg-gray-800 p-4 rounded">
          <p>Total Members</p>
          <h2>{members.length}</h2>
        </div>

        <div className="bg-gray-800 p-4 rounded">
          <p>Total Penalty</p>
          <h2>৳{totalPenalty}</h2>
        </div>

        <div className="bg-gray-800 p-4 rounded">
          <p>Penalties</p>
          <h2>{penalties.length}</h2>
        </div>

      </div>

      {/* BILL BUTTONS */}
      <div className="flex gap-3 mb-6">
        <button onClick={handleSendBill} className="bg-green-500 px-4 py-2 rounded flex items-center gap-2">
          <Mail size={16} /> Send Bills
        </button>

        <button onClick={handleDownloadPDF} className="bg-blue-500 px-4 py-2 rounded">
          Download PDF
        </button>
      </div>

      {/* MEMBERS */}
      <div className="mb-8">
        <h2 className="text-xl mb-3">Members</h2>

        <table className="w-full">
          <thead>
            <tr className="text-gray-400">
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            {members.map(m => (
              <tr key={m.user?._id}>
                <td>{m.user?.firstName}</td>
                <td>{m.user?.email}</td>
                <td>{m.role}</td>

                <td className="flex gap-2">
                  <button onClick={() => handlePromote(m.user?._id)}>
                    <User size={16} />
                  </button>

                  <button onClick={() => handleRemove(m.user?._id)}>
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* PENALTY */}
      <div className="mb-8">
        <h2 className="text-xl mb-3">Set Penalty</h2>

        <form onSubmit={handlePenaltySubmit} className="flex gap-3 flex-wrap">

          <select
            value={penaltyData.userId}
            onChange={(e) =>
              setPenaltyData({ ...penaltyData, userId: e.target.value })
            }
            className="p-2 bg-gray-800 rounded"
          >
            <option value="">User</option>
            {members.map(m => (
              <option key={m.user?._id} value={m.user?._id}>
                {m.user?.firstName}
              </option>
            ))}
          </select>

          <input
            type="number"
            placeholder="Meals (V)"
            value={penaltyData.meals}
            onChange={(e) =>
              setPenaltyData({ ...penaltyData, meals: e.target.value })
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

          <button className="bg-purple-500 px-4 rounded flex items-center gap-2">
            <PlusCircle size={16} />
            Add
          </button>

        </form>
      </div>

      {/* MEAL MANAGEMENT */}
      <div className="mb-8">
        <h2 className="text-xl mb-3">Manage Meals</h2>

        <table className="w-full">
          <thead>
            <tr className="text-gray-400">
              <th>User</th>
              <th>Meals</th>
              <th>Date</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            {meals.map(m => (
              <tr key={m._id}>
                <td>{m.userId?.firstName}</td>
                <td>{m.mealCount}</td>
                <td>{m.date?.split('T')[0]}</td>

                <td className="flex gap-2">
                  <button onClick={() => handleEditMeal(m)}>
                    <Pencil size={16} />
                  </button>

                  <button onClick={() => handleDeleteMeal(m._id)}>
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* PENALTY LIST */}
      <div>
        <h2 className="text-xl mb-3">Penalty List</h2>

        <table className="w-full">
          <tbody>
            {penalties.map(p => (
              <tr key={p._id}>
                <td>{p.userId?.firstName}</td>
                <td>{p.amount} V</td>
                <td>{p.reason}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
}