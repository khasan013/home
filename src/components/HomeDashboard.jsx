// src/components/HomeDashboard.jsx
import { useState, useEffect, useRef } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';
import { useHome } from '../context/HomeContext';
import MealTracking     from './MealTracking';
import ExpenseTracker   from './ExpenseTracker';
import MemberManagement from './MemberManagement';
import { reportApi, homeApi, expenseApi } from '../api';

const COLORS = ['#8b5cf6', '#ec4899', '#06b6d4', '#f59e0b'];

// ── Auto-refresh interval (ms) ──
const REFRESH_INTERVAL = 30_000; // 30 seconds

export default function HomeDashboard() {
  const { currentHome, setCurrentHome, members, setMembers, meals, setMeals, expenses, setExpenses, report, setReport } = useHome();
  const [activeTab, setActiveTab] = useState('overview');
  const homeId = currentHome?._id;
  const intervalRef = useRef(null);

  // ── Core data-fetch function (called on mount + every interval) ──
  const fetchAllData = async (id) => {
    if (!id) return;

    try {
      // Re-fetch home details (keeps currentHome fresh after idle)
      const freshHome = await homeApi.getById(id);
      if (freshHome) {
        setCurrentHome(freshHome);
        setMembers(freshHome.members);
        // Persist so sidebar can restore it on next mount
        localStorage.setItem('lastHomeId', id);
      }
    } catch (err) {
      console.error('Failed to refresh home:', err);
    }

    try {
      const [freshReport, freshExpenses] = await Promise.all([
        reportApi.get(id),
        expenseApi.getAll(id),
      ]);
      if (freshReport)  setReport(freshReport);
      if (freshExpenses) setExpenses(freshExpenses);
    } catch (err) {
      console.error('Failed to refresh report/expenses:', err);
    }
  };

  // ── On homeId change: fetch immediately + start interval ──
  useEffect(() => {
    if (!homeId) return;

    fetchAllData(homeId);

    // Clear any existing interval before starting a new one
    if (intervalRef.current) clearInterval(intervalRef.current);

    intervalRef.current = setInterval(() => {
      fetchAllData(homeId);
    }, REFRESH_INTERVAL);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [homeId]);

  // ── Restore last selected home on mount if currentHome is null ──
  useEffect(() => {
    if (currentHome) return; // already set, nothing to do

    const lastId = localStorage.getItem('lastHomeId');
    if (!lastId) return;

    homeApi.getById(lastId)
      .then((home) => {
        if (home) {
          setCurrentHome(home);
          setMembers(home.members);
        }
      })
      .catch(console.error);
  }, []);

  // ── Refresh when tab becomes visible again (user switches back) ──
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && homeId) {
        fetchAllData(homeId);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [homeId]);

  const totalExpense = report?.totalExpense ?? expenses.reduce((s, e) => s + e.amount, 0);
  const totalMeals   = report?.totalMeals   ?? meals.reduce((s, m) => s + m.mealCount, 0);
  const perMeal      = report?.perMeal ?? (totalMeals ? totalExpense / totalMeals : 0);

  // ── Total eggs consumed (sum of eggsCount across all meal entries) ──
  const totalEggsConsumed = meals.reduce((s, m) => s + (m.eggsCount || 0), 0);

  // ── Expense breakdown by category for pie ──
  const categoryMap = {};
  expenses.forEach(e => {
    categoryMap[e.category] = (categoryMap[e.category] || 0) + e.amount;
  });
  const pieData = Object.entries(categoryMap).map(([cat, val]) => ({ category: cat, value: val }));

  // ── Weekly bar from last 7 meal entries ──
  const last7   = [...meals].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 7).reverse();
  const barData = last7.map(m => ({
    day:   new Date(m.date).toLocaleDateString('en-US', { weekday: 'short' }),
    meals: m.mealCount,
    eggs:  m.eggsCount,
  }));

  // ── Stat card config ──
  const stats = [
    {
      label: 'Total Expense',
      value: `৳${totalExpense.toFixed(2)}`,
      icon: '💸',
      accent: '#6366f1',
      lightBg: '#eef2ff',
      textColor: '#4338ca',
    },
    {
      label: 'Total Meals',
      value: String(totalMeals),
      icon: '🍽️',
      accent: '#8b5cf6',
      lightBg: '#f5f3ff',
      textColor: '#6d28d9',
    },
    {
      label: 'Members',
      value: String(members.length),
      icon: '👥',
      accent: '#ec4899',
      lightBg: '#fdf2f8',
      textColor: '#be185d',
    },
    {
      label: 'Cost Per Meal',
      value: `৳${perMeal.toFixed(2)}`,
      icon: '📊',
      accent: '#06b6d4',
      lightBg: '#ecfeff',
      textColor: '#0e7490',
    },
    {
      label: 'Total Eggs Consumed',
      value: String(totalEggsConsumed),
      icon: '🥚',
      accent: '#f59e0b',
      lightBg: '#fffbeb',
      textColor: '#b45309',
    },
  ];

  return (
    <div className="space-y-6">
      {/* ── Header Stats (white cards) ── */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {stats.map(({ label, value, icon, accent, lightBg, textColor }) => (
          <div
            key={label}
            style={{
              background: '#ffffff',
              borderRadius: 16,
              padding: '20px 18px',
              boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
              borderTop: `4px solid ${accent}`,
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{
                fontSize: 20,
                background: lightBg,
                borderRadius: 8,
                padding: '4px 6px',
                lineHeight: 1,
              }}>{icon}</span>
              <p style={{ color: '#6b7280', fontSize: 12, fontWeight: 600, margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {label}
              </p>
            </div>
            <p style={{ color: textColor, fontSize: 26, fontWeight: 800, margin: 0 }}>{value}</p>
          </div>
        ))}
      </div>

      {/* ── Tabs ── */}
      <div className="flex gap-2 border-b border-white/10">
        {['overview', 'meals', 'expenses', 'members'].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-4 py-3 font-semibold capitalize transition ${
              activeTab === tab
                ? 'text-purple-400 border-b-2 border-purple-500'
                : 'text-gray-400 hover:text-gray-300'
            }`}>
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white/5 border border-white/10 rounded-xl p-6 backdrop-blur-sm">
            <h3 className="text-lg font-semibold text-white mb-4">Expense Distribution</h3>
            {pieData.length === 0 ? (
              <p className="text-gray-400 text-center py-16">No expense data yet</p>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" outerRadius={90} dataKey="value"
                    label={({ category, value }) => `${category} ৳${value.toFixed(0)}`}>
                    {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={v => `৳${v.toFixed(2)}`} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="bg-white/5 border border-white/10 rounded-xl p-6 backdrop-blur-sm">
            <h3 className="text-lg font-semibold text-white mb-4">Recent Meal Trend</h3>
            {barData.length === 0 ? (
              <p className="text-gray-400 text-center py-16">No meal data yet</p>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={barData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="day" stroke="rgba(255,255,255,0.5)" />
                  <YAxis stroke="rgba(255,255,255,0.5)" />
                  <Tooltip contentStyle={{
                    backgroundColor: 'rgba(15,23,42,0.9)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: '8px',
                  }} />
                  <Legend />
                  <Bar dataKey="meals" fill="#8b5cf6" name="Meals" />
                  <Bar dataKey="eggs"  fill="#f59e0b" name="Eggs"  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      )}

      {activeTab === 'meals'    && <MealTracking />}
      {activeTab === 'expenses' && <ExpenseTracker />}
      {activeTab === 'members'  && <MemberManagement />}
    </div>
  );
}