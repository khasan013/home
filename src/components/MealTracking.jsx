import { useState, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { useHome } from '../context/HomeContext';
import { mealApi } from '../api';

export default function MealTracking() {
  const { currentHome, meals, setMeals } = useHome();
  const homeId = currentHome?._id;

  const isAdmin = currentHome?.role === 'admin';

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [editValue, setEditValue] = useState('');

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    mealCount: 0,
    eggsCount: 0,
  });

  // ─────────────────────────────
  // LOAD MEALS
  // ─────────────────────────────
  useEffect(() => {
    if (!homeId) return;
    mealApi.getAll(homeId).then(setMeals).catch(console.error);
  }, [homeId]);

  // ─────────────────────────────
  // GROUP DATA (DATE + USER)
  // ─────────────────────────────
  const grouped = {};
  const usersSet = new Set();

  meals.forEach((meal) => {
    const date = meal.date?.split('T')[0];

    const user =
      meal.userId?.firstName ||
      meal.userId?.email ||
      'Unknown';

    usersSet.add(user);

    if (!grouped[date]) grouped[date] = {};

    grouped[date][user] = {
      meals: meal.mealCount || 0,
      eggs: meal.eggsCount || 0,
      mealId: meal._id,
    };
  });

  const users = Array.from(usersSet);

  // ─────────────────────────────
  // ADD MEAL
  // ─────────────────────────────
  const handleSubmit = async (e) => {
  e.preventDefault();

  try {
    // ✅ SUPPORT BOTH NUMBER + "2V 1D"
    let meals = formData.mealCount;
    let eggs = formData.eggsCount;

    // if string like "2V 1D"
    if (typeof meals === 'string') {
      const parsed = parseValue(meals);
      meals = parsed[0];
      eggs = parsed[1];
    }

    await mealApi.add(homeId, {
      date: new Date(formData.date).toISOString(),
      mealCount: Number(meals) || 0,
      eggsCount: Number(eggs) || 0,
    });

    const updated = await mealApi.getAll(homeId);
setMeals(updated);

    setFormData({
      date: new Date().toISOString().split('T')[0],
      mealCount: 0,
      eggsCount: 0,
    });

    setShowForm(false);

  } catch (err) {
    alert(err.message);
  }
};
  // ─────────────────────────────
  // EDIT
  // ─────────────────────────────
  const handleEdit = (date, user, value) => {
    if (!isAdmin) return;
    setEditing({ date, user });
    setEditValue(value);
  };

  // ─────────────────────────────
  // SAVE EDIT
  // ─────────────────────────────
  const handleSave = async (date, user) => {
    const item = grouped[date][user];
    if (!item) return;

    const [meals, eggs] = parseValue(editValue);

    try {
      await mealApi.update(homeId, item.mealId, {
        mealCount: Number(meals) || 0,
        eggsCount: Number(eggs) || 0,
      });

      const updated = await mealApi.getAll(homeId);
      setMeals(updated);

      setEditing(null);

    } catch (err) {
      alert(err.message);
    }
  };

  // ─────────────────────────────
  // DELETE
  // ─────────────────────────────
  const handleDelete = async (mealId) => {
    if (!isAdmin) return;
    if (!confirm('Delete this meal?')) return;

    try {
      await mealApi.remove(homeId, mealId);

      const updated = await mealApi.getAll(homeId);
      setMeals(updated);

    } catch (err) {
      alert(err.message);
    }
  };

  // ─────────────────────────────
  // PARSE "2V 1D"
  // ─────────────────────────────
  const parseValue = (val) => {
    let meals = 0;
    let eggs = 0;

    const vMatch = val.match(/([\d.]+)V/i);
    const dMatch = val.match(/(\d+)D/i);

    if (vMatch) meals = parseFloat(vMatch[1]);
    if (dMatch) eggs = parseInt(dMatch[1]);

    return [meals, eggs];
  };

  // ─────────────────────────────
  // RENDER
  // ─────────────────────────────
  return (
    <div className="space-y-4">

      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <h3 className="text-lg font-semibold text-white">Meal Table</h3>

        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg shadow-lg shadow-purple-950/30"
        >
          <Plus className="w-4 h-4" /> Add Meal
        </button>
      </div>

      {/* FORM */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-white/5 border border-white/10 rounded-xl p-6 space-y-4"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

            <input
              type="date"
              value={formData.date}
              onChange={(e) =>
                setFormData({ ...formData, date: e.target.value })
              }
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
              required
            />

            <input
              type="number"
              step="0.25"
              min="0"
              value={formData.mealCount}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  mealCount: e.target.value === '' ? 0 : Number(e.target.value),
                })
              }
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
            />

            <input
              type="number"
              min="0"
              value={formData.eggsCount}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  eggsCount: e.target.value === '' ? 0 : Number(e.target.value),
                })
              }
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
            />

          </div>

          <button
            type="submit"
            className="w-full py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg"
          >
            Save Meal
          </button>
        </form>
      )}

      {/* TABLE */}
      <div className="overflow-x-auto bg-white/5 border border-white/10 rounded-xl">
        <table className="w-full min-w-[620px] text-sm text-white">

          <thead className="bg-white/10">
            <tr>
              <th className="p-3 text-left">Date</th>
              {users.map((u) => (
                <th key={u} className="p-3 text-center">{u}</th>
              ))}
            </tr>
          </thead>

          <tbody>
            {Object.keys(grouped).map((date) => (
              <tr key={date} className="border-t border-white/10">
                <td className="p-3">{date}</td>

                {users.map((u) => {
                  const cell = grouped[date][u];

                  const display = cell
                    ? `${cell.meals > 0 ? cell.meals + 'V' : ''} ${cell.eggs > 0 ? cell.eggs + 'D' : ''}`.trim()
                    : '0';

                  const isEditing =
                    editing?.date === date && editing?.user === u;

                  return (
                    <td
                      key={u}
                      className={`p-3 text-center ${isAdmin ? 'cursor-pointer hover:bg-white/10' : ''}`}
                      onClick={() => handleEdit(date, u, display)}
                    >
                      {isEditing ? (
                        <input
                          value={editValue}
                          autoFocus
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={() => handleSave(date, u)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSave(date, u);
                          }}
                          className="bg-transparent border border-purple-400 text-center w-20"
                        />
                      ) : (
                        <div className="flex items-center justify-center gap-2">

                          <span>{display}</span>

                          {isAdmin && cell && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(cell.mealId);
                              }}
                              className="text-red-400 hover:text-red-600"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}

                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>

        </table>
      </div>
    </div>
  );
}
