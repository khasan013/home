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

  // 🔥 NEW: COST STATE
  const [costData, setCostData] = useState({
    totalEggPrice: '',
    totalEggCount: '',
    consumedEgg: '',
    otherCost: '',
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
      await adminApi.addMealPenalty(homeId, {
        userId,
        meals: Number(meals),
      });

      const newPenalty = await adminApi.addPenalty(homeId, {
        userId,
        amount: Number(meals),
        reason: reason || `Penalty for ${meals} meals`,
      });

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

      loadData();

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
  // COST CALCULATION 🔥
  // ─────────────────────────────
  const calculateBill = () => {
    const { totalEggPrice, totalEggCount, consumedEgg, otherCost } = costData;

    if (!totalEggPrice || !totalEggCount) return null;

    const perEgg = totalEggPrice / totalEggCount;
    const consumedCost = consumedEgg * perEgg;
    const remainingEggCost = totalEggPrice - consumedCost;

    const totalBill = Number(otherCost || 0) + remainingEggCost;

    return {
      perEgg,
      consumedCost,
      remainingEggCost,
      totalBill,
    };
  };

  const bill = calculateBill();

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

      {/* 🔥 COST CALCULATION */}
      <div className="bg-gray-900 p-4 rounded mb-6">
        <h2 className="text-lg mb-3">Cost Calculation</h2>

        <div className="flex gap-3 flex-wrap">

          <input type="number" placeholder="Total Egg Price"
            onChange={e => setCostData({ ...costData, totalEggPrice: Number(e.target.value) })}
            className="p-2 bg-gray-800 rounded"
          />

          <input type="number" placeholder="Total Eggs"
            onChange={e => setCostData({ ...costData, totalEggCount: Number(e.target.value) })}
            className="p-2 bg-gray-800 rounded"
          />

          <input type="number" placeholder="Consumed Eggs"
            onChange={e => setCostData({ ...costData, consumedEgg: Number(e.target.value) })}
            className="p-2 bg-gray-800 rounded"
          />

          <input type="number" placeholder="Other Cost"
            onChange={e => setCostData({ ...costData, otherCost: Number(e.target.value) })}
            className="p-2 bg-gray-800 rounded"
          />

        </div>

        {bill && (
          <div className="mt-4 text-green-400">
            <p>Per Egg: ৳{bill.perEgg.toFixed(2)}</p>
            <p>Consumed: ৳{bill.consumedCost.toFixed(2)}</p>
            <p>Remaining: ৳{bill.remainingEggCost.toFixed(2)}</p>
            <h2 className="text-xl font-bold">Total: ৳{bill.totalBill.toFixed(2)}</h2>
          </div>
        )}
      </div>

      {/* MEMBERS */}
      <div className="mb-8">
        <h2 className="text-xl mb-3">Members</h2>

        <table className="w-full">
          <tbody>
            {members.map(m => (
              <tr key={m.user?._id}>
                <td>{m.user?.firstName}</td>
                <td>{m.user?.email}</td>
                <td>{m.role}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* PENALTY FORM */}
      <form onSubmit={handlePenaltySubmit} className="flex gap-2">
        <input placeholder="Meals"
          onChange={e => setPenaltyData({ ...penaltyData, meals: e.target.value })}
        />
        <button>Add</button>
      </form>

    </div>
  );
}