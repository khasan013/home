import { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { useHome } from '../context/HomeContext';
import { mealApi } from '../api';

export default function MealTracking() {
  const { currentHome, meals, setMeals, addMeal } = useHome();
  const homeId = currentHome?._id;

  const isAdmin = currentHome?.role === 'admin'; // ✅ ADMIN CHECK

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null); // {date, user}
  const [editValue, setEditValue] = useState('');

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    mealCount: 0,
    eggsCount: 0,
  });

  // LOAD
  useEffect(() => {
    if (!homeId) return;
    mealApi.getAll(homeId).then(setMeals).catch(console.error);
  }, [homeId]);

  // GROUP DATA
  const grouped = {};
  const usersSet = new Set();

  meals.forEach((meal) => {
    const date = meal.date?.split('T')[0];
    const user = meal.user?.firstName || 'Unknown';

    usersSet.add(user);

    if (!grouped[date]) grouped[date] = {};

    grouped[date][user] = {
      meals: meal.mealCount || 0,
      eggs: meal.eggsCount || 0,
      mealId: meal._id,
    };
  });

  const users = Array.from(usersSet);

  // ADD
  const handleSubmit = async (e) => {
    e.preventDefault();
    const meal = await mealApi.add(homeId, formData);
    addMeal(meal);
    setShowForm(false);
  };

  // EDIT CLICK
  const handleEdit = (date, user, value) => {
    if (!isAdmin) return;

    setEditing({ date, user });
    setEditValue(value);
  };

  // SAVE EDIT
  const handleSave = async (date, user) => {
    const item = grouped[date][user];
    if (!item) return;

    const [meals, eggs] = parseValue(editValue);

    try {
      await mealApi.update(homeId, item.mealId, {
        mealCount: meals,
        eggsCount: eggs,
      });

      // reload
      const updated = await mealApi.getAll(homeId);
      setMeals(updated);

      setEditing(null);
    } catch (err) {
      alert(err.message);
    }
  };

  // PARSE "2.5V 1D"
  const parseValue = (val) => {
    let meals = 0;
    let eggs = 0;

    const vMatch = val.match(/([\d.]+)V/i);
    const dMatch = val.match(/(\d+)D/i);

    if (vMatch) meals = parseFloat(vMatch[1]);
    if (dMatch) eggs = parseInt(dMatch[1]);

    return [meals, eggs];
  };

  return (
    <div className="space-y-4">

      {/* HEADER */}
      <div className="flex justify-between">
        <h3 className="text-white text-lg">Meal Table</h3>

        {isAdmin && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-purple-500 px-4 py-2 rounded-lg text-white"
          >
            <Plus className="w-4 h-4 inline" /> Add Meal
          </button>
        )}
      </div>

      {/* TABLE */}
      <div className="overflow-x-auto bg-white/5 border border-white/10 rounded-xl">
        <table className="w-full text-white">

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
                    ? `${cell.meals > 0 ? cell.meals + 'V' : ''} ${cell.eggs > 0 ? cell.eggs + 'D' : ''}`
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
                        display || '0'
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