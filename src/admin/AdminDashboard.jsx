import { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { Users, AlertTriangle, Trash2, User, DollarSign } from 'lucide-react';
import { useHome } from '../context/HomeContext';
import { adminApi, mealApi } from '../api'; // ✅ add mealApi

export default function AdminDashboard() {
  const { currentHome } = useHome();
  const homeId = currentHome?._id;

  const [activeTab, setActiveTab] = useState('overview');
  const [members, setMembers] = useState([]);
  const [penalties, setPenalties] = useState([]);
  const [meals, setMeals] = useState([]); // ✅ NEW
  const [loadingAction, setLoadingAction] = useState('');

  // ─────────────────────────────
  // LOAD DATA
  // ─────────────────────────────
  useEffect(() => {
    if (!homeId) return;

    adminApi.getMembers(homeId).then(setMembers).catch(console.error);
    adminApi.getPenalties(homeId).then(setPenalties).catch(console.error);
    mealApi.getAll(homeId).then(setMeals).catch(console.error); // ✅ NEW

  }, [homeId]);

  // ─────────────────────────────
  // CHART DATA
  // ─────────────────────────────
  const memberDistributionData = members.map(m => ({
    name: m.user?.firstName || m.user?.email || '?',
    value: m.totalCost || 0,
  }));

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
  // MEAL DELETE (ADMIN POWER 🔥)
  // ─────────────────────────────
  const handleDeleteMeal = async (mealId) => {
    if (!confirm('Delete this meal?')) return;

    try {
      await mealApi.remove(homeId, mealId);
      setMeals(prev => prev.filter(m => m._id !== mealId)); // ✅ instant UI update
    } catch (err) {
      alert(err.message);
    }
  };

  // ─────────────────────────────
  // TOTAL MEALS (FIXED)
  // ─────────────────────────────
  const totalMeals = meals.reduce(
    (sum, m) => sum + (m.mealCount || 0),
    0
  );

  // ─────────────────────────────
  // UI
  // ─────────────────────────────
  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'members', label: 'Members' },
    { id: 'meals', label: 'Meals' }, // ✅ NEW TAB
    { id: 'penalties', label: 'Penalties' },
  ];

  return (
    <div className="p-8 text-white">

      {/* HEADER */}
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>

      {/* TABS */}
      <div className="flex gap-4 mb-6">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={activeTab === tab.id ? 'text-purple-400' : 'text-gray-400'}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-3 gap-4">

          <div className="card">
            <p>Total Members</p>
            <h2>{members.length}</h2>
          </div>

          <div className="card">
            <p>Total Meals</p>
            <h2>{totalMeals}</h2> {/* ✅ FIX */}
          </div>

          <div className="card">
            <p>Total Penalties</p>
            <h2>৳{penalties.reduce((s, p) => s + p.amount, 0)}</h2>
          </div>

        </div>
      )}

      {/* MEMBERS */}
      {activeTab === 'members' && (
        <table className="w-full">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {members.map(m => (
              <tr key={m.user?._id}>
                <td>{m.user?.firstName || 'Unknown'}</td>
                <td>{m.user?.email}</td>
                <td>{m.role}</td>
                <td className="flex gap-2">

                  <button onClick={() => handlePromote(m.user?._id)}>
                    <User />
                  </button>

                  <button onClick={() => handleRemove(m.user?._id)}>
                    <Trash2 />
                  </button>

                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* MEALS (ADMIN CONTROL 🔥) */}
      {activeTab === 'meals' && (
        <table className="w-full">
          <thead>
            <tr>
              <th>Date</th>
              <th>User</th>
              <th>Meals</th>
              <th>Eggs</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            {meals.map(m => (
              <tr key={m._id}>
                <td>{m.date?.split('T')[0]}</td>
                <td>{m.userId?.firstName || 'Unknown'}</td>
                <td>{m.mealCount}</td>
                <td>{m.eggsCount}</td>

                <td>
                  <button
                    onClick={() => handleDeleteMeal(m._id)}
                    className="text-red-400"
                  >
                    <Trash2 />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* PENALTIES */}
      {activeTab === 'penalties' && (
        <div>
          {penalties.map(p => (
            <div key={p._id}>
              {p.userId?.firstName} - ৳{p.amount}
            </div>
          ))}
        </div>
      )}

    </div>
  );
}