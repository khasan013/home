// src/components/ExpenseTracker.jsx
import { useState, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { useHome } from '../context/HomeContext';
import { expenseApi } from '../api';

export default function ExpenseTracker() {
  const { currentHome, expenses, setExpenses, addExpense, removeExpense } = useHome();
  const homeId = currentHome?._id;

  const [showForm, setShowForm] = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');
  const [formData, setFormData] = useState({
    title: '', amount: 0,
    category: 'groceries',
    date: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    if (!homeId) return;
    expenseApi.getAll(homeId).then(setExpenses).catch(console.error);
  }, [homeId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const expense = await expenseApi.add(homeId, formData);
      addExpense(expense);
      setFormData({ title: '', amount: 0, category: 'groceries', date: new Date().toISOString().split('T')[0] });
      setShowForm(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (expId) => {
    if (!confirm('Delete this expense?')) return;
    try {
      await expenseApi.remove(homeId, expId);
      removeExpense(expId);
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-white">Expense Tracker</h3>
        <button onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition">
          <Plus className="w-4 h-4" /> Add Expense
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white/5 border border-white/10 rounded-xl p-6 space-y-4">
          <div>
            <label className="block text-sm text-gray-300 mb-2">Title</label>
            <input type="text" value={formData.title}
              onChange={e => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-purple-500" required />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-gray-300 mb-2">Amount (৳)</label>
              <input type="number" step="0.01" min="0" value={formData.amount}
                onChange={e => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-purple-500" required />
            </div>
            <div>
              <label className="block text-sm text-gray-300 mb-2">Category</label>
              <select value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 bg-slate-800 border border-white/20 rounded-lg text-white focus:outline-none focus:border-purple-500">
                <option value="groceries">Groceries</option>
                <option value="utilities">Utilities</option>
                <option value="rent">Rent</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-300 mb-2">Date</label>
              <input type="date" value={formData.date}
                onChange={e => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-purple-500" />
            </div>
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button type="submit" disabled={loading}
            className="w-full py-2 bg-purple-500 hover:bg-purple-600 text-white font-semibold rounded-lg transition disabled:opacity-50">
            {loading ? 'Saving...' : 'Save Expense'}
          </button>
        </form>
      )}

      <div className="space-y-2">
        {expenses.length === 0 ? (
          <p className="text-gray-400 text-center py-8">No expenses recorded yet</p>
        ) : (
          expenses.map((expense) => (
            <div key={expense._id} className="bg-white/5 border border-white/10 rounded-lg p-4 flex justify-between items-center">
              <div>
                <p className="text-white font-semibold">{expense.title}</p>
                <p className="text-gray-300 text-sm capitalize">{expense.category} • {expense.date?.split('T')[0] || expense.date}</p>
              </div>
              <div className="flex items-center gap-3">
                <p className="text-purple-400 font-bold">৳{Number(expense.amount).toFixed(2)}</p>
                <button onClick={() => handleDelete(expense._id)} className="p-2 hover:bg-red-500/20 rounded-lg transition">
                  <Trash2 className="w-4 h-4 text-red-400" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
