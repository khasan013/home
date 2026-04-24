// src/components/HomeDashboard.jsx
import { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';
import { useHome } from '../context/HomeContext';
import { reportApi, homeApi } from '../api';
import MealTracking    from './MealTracking';
import ExpenseTracker  from './ExpenseTracker';
import MemberManagement from './MemberManagement';

const COLORS = ['#8b5cf6', '#ec4899', '#06b6d4', '#f59e0b'];

export default function HomeDashboard() {
  const { currentHome, members, setMembers, meals, expenses, report, setReport } = useHome();
  const [activeTab, setActiveTab] = useState('overview');
  const homeId = currentHome?._id;

  // Fetch report & members when home changes
  useEffect(() => {
    if (!homeId) return;
    reportApi.get(homeId).then(setReport).catch(console.error);
    // Populate members from the home object (already fetched in MainApp)
    if (currentHome?.members) setMembers(currentHome.members);
  }, [homeId]);

  const totalExpense = report?.totalExpense ?? expenses.reduce((s, e) => s + e.amount, 0);
  const totalMeals   = report?.totalMeals   ?? meals.reduce((s, m) => s + m.mealCount, 0);
  const perMeal      = report?.perMeal ?? (totalMeals ? totalExpense / totalMeals : 0);

  // Derive pie data from expense categories
  const categoryMap = {};
  expenses.forEach(e => {
    categoryMap[e.category] = (categoryMap[e.category] || 0) + e.amount;
  });
  const pieData = Object.entries(categoryMap).map(([cat, val]) => ({ category: cat, value: val }));

  // Derive weekly bar data from last 7 days of meals
  const last7 = [...meals].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 7).reverse();
  const barData = last7.map(m => ({
    day: new Date(m.date).toLocaleDateString('en-US', { weekday: 'short' }),
    meals: m.mealCount,
    eggs:  m.eggsCount,
  }));

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Expense',   value: `৳${totalExpense.toFixed(2)}`, color: 'blue'   },
          { label: 'Total Meals',     value: String(totalMeals),             color: 'purple' },
          { label: 'Members',         value: String(members.length),         color: 'pink'   },
          { label: 'Cost Per Meal',   value: `৳${perMeal.toFixed(2)}`,       color: 'cyan'   },
        ].map(({ label, value, color }) => (
          <div key={label} className={`bg-gradient-to-br from-${color}-500/20 to-${color}-600/20 border border-${color}-500/30 rounded-xl p-6 backdrop-blur-sm`}>
            <p className={`text-${color}-200 text-sm font-semibold mb-2`}>{label}</p>
            <p className={`text-3xl font-bold text-${color}-100`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-white/10">
        {['overview', 'meals', 'expenses', 'members'].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-4 py-3 font-semibold capitalize transition ${
              activeTab === tab ? 'text-purple-400 border-b-2 border-purple-500' : 'text-gray-400 hover:text-gray-300'
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
                  <Tooltip contentStyle={{ backgroundColor: 'rgba(15,23,42,0.9)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px' }} />
                  <Legend />
                  <Bar dataKey="meals" fill="#8b5cf6" name="Meals (V)" />
                  <Bar dataKey="eggs"  fill="#ec4899" name="Eggs (D)" />
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
