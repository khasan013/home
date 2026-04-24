// src/components/MealTracking.jsx
import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { useHome } from '../context/HomeContext';
import { mealApi } from '../api';

export default function MealTracking() {
  const { currentHome, meals, setMeals, addMeal, removeMeal } = useHome();
  const homeId = currentHome?._id;

  const [showForm, setShowForm] = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    mealCount: 0,
    eggsCount: 0,
  });

  // Load meals when home changes
  useEffect(() => {
    if (!homeId) return;
    mealApi.getAll(homeId).then(setMeals).catch(console.error);
  }, [homeId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const meal = await mealApi.add(homeId, formData);
      addMeal(meal);
      setFormData({ date: new Date().toISOString().split('T')[0], mealCount: 0, eggsCount: 0 });
      setShowForm(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (mealId) => {
    if (!confirm('Delete this meal entry?')) return;
    try {
      await mealApi.remove(homeId, mealId);
      removeMeal(mealId);
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-white">Daily Meal Log</h3>
        <button onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition">
          <Plus className="w-4 h-4" /> Add Meal
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white/5 border border-white/10 rounded-xl p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-gray-300 mb-2">Date</label>
              <input type="date" value={formData.date}
                onChange={e => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-purple-500" required />
            </div>
            <div>
              <label className="block text-sm text-gray-300 mb-2">Meals (V)</label>
              <input type="number" step="0.25" min="0" value={formData.mealCount}
                onChange={e => setFormData({ ...formData, mealCount: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-purple-500" />
            </div>
            <div>
              <label className="block text-sm text-gray-300 mb-2">Eggs (D)</label>
              <input type="number" min="0" value={formData.eggsCount}
                onChange={e => setFormData({ ...formData, eggsCount: parseInt(e.target.value) })}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-purple-500" />
            </div>
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button type="submit" disabled={loading}
            className="w-full py-2 bg-purple-500 hover:bg-purple-600 text-white font-semibold rounded-lg transition disabled:opacity-50">
            {loading ? 'Saving...' : 'Save Meal'}
          </button>
        </form>
      )}

      <div className="space-y-2">
        {meals.length === 0 ? (
          <p className="text-gray-400 text-center py-8">No meals logged yet</p>
        ) : (
          meals.map((meal) => (
            <div key={meal._id} className="bg-white/5 border border-white/10 rounded-lg p-4 flex justify-between items-center">
              <div>
                <p className="text-white font-semibold">{meal.date?.split('T')[0] || meal.date}</p>
                <p className="text-gray-300 text-sm">{meal.mealCount} V meals • {meal.eggsCount} eggs</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleDelete(meal._id)}
                  className="p-2 hover:bg-red-500/20 rounded-lg transition">
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
