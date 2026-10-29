import { useState, useEffect, useMemo } from 'react';
import { Plus, Trash2, BarChart3, Drumstick, Egg, Soup, Carrot, Utensils } from 'lucide-react';
import { useHome } from '../context/HomeContext';
import { mealApi } from '../api';

const initialQuantities = { meat: 0, vegetables: 0, egg: 0, rice: 0.1, vat: 0 };
const initialPercentages = { meat: 75, vegetables: 10, egg: 50, rice: 10, vat: 0 };
const itemMeta = [
  { key: 'meat', label: 'Mash/Murgi', icon: Drumstick, color: 'text-orange-400' },
  { key: 'vegetables', label: 'Vegetables', icon: Carrot, color: 'text-emerald-400' },
  { key: 'egg', label: 'Egg', icon: Egg, color: 'text-amber-300' },
  { key: 'rice', label: 'Rice', icon: Soup, color: 'text-slate-100' },
  { key: 'vat', label: 'Vat (Custom)', icon: Utensils, color: 'text-violet-300' },
];
const round2 = value => Math.round((Number(value || 0) + Number.EPSILON) * 100) / 100;
const fmt = value => round2(value).toFixed(2);

export default function MealTracking() {
  const { currentHome, meals, setMeals } = useHome();
  const homeId = currentHome?._id;

  const isAdmin = currentHome?.role === 'admin';

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [editValue, setEditValue] = useState('');

  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [quantities, setQuantities] = useState(initialQuantities);
  const [percentages, setPercentages] = useState(initialPercentages);
  const [extraEggs, setExtraEggs] = useState(0);
  const [saving, setSaving] = useState(false);

  const sectionRows = useMemo(() => itemMeta.map(item => ({
    ...item,
    quantity: Number(quantities[item.key]) || 0,
    percent: Number(percentages[item.key]) || 0,
    contribution: round2((Number(quantities[item.key]) || 0) * (Number(percentages[item.key]) || 0) / 100),
  })), [quantities, percentages]);
  const totalMeal = round2(sectionRows.reduce((sum, row) => sum + row.contribution, 0));

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
    if (totalMeal <= 0 && Number(extraEggs) <= 0) return alert('Select at least one meal item or extra egg.');
    setSaving(true);
    try {
      await mealApi.add(homeId, {
        date: new Date(`${date}T00:00:00`).toISOString(),
        mealCount: totalMeal,
        eggsCount: Number(extraEggs) || 0,
        mealSections: { quantities, percentages },
      });
      setMeals(await mealApi.getAll(homeId));
      setQuantities(initialQuantities);
      setPercentages(initialPercentages);
      setExtraEggs(0);
      setDate(new Date().toISOString().split('T')[0]);
      setShowForm(false);
    } catch (err) { alert(err.message); }
    finally { setSaving(false); }
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

    if (!Number.isFinite(Number(meals)) || Number(meals) < 0) {
      setEditing(null);
      return alert('Meal count cannot be negative.');
    }
    if (!Number.isFinite(Number(eggs)) || Number(eggs) < 0) {
      setEditing(null);
      return alert('Egg count cannot be negative.');
    }

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

            <label className="text-sm text-slate-300">Date<input type="date" value={date} onChange={e => setDate(e.target.value)} className="mt-1 block w-full rounded-lg border border-white/20 bg-slate-900 px-3 py-2 text-white [color-scheme:dark]" required /></label>

          </div>

          <div className="grid gap-3 sm:grid-cols-3">{sectionRows.slice(0, 3).map(row => <ItemCard key={row.key} row={row} quantities={quantities} percentages={percentages} setQuantities={setQuantities} setPercentages={setPercentages} />)}</div>
          <div className="grid gap-3 sm:grid-cols-2"><ItemCard row={sectionRows[3]} quantities={quantities} percentages={percentages} setQuantities={setQuantities} presets={[0.05, 0.1, 0.15]} /><ItemCard row={sectionRows[4]} quantities={quantities} percentages={percentages} setQuantities={setQuantities} setPercentages={setPercentages} customPercent /></div>
          <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-3"><div className="flex items-center gap-2"><Egg className="h-8 w-8 text-amber-300"/><span>Extra Egg <small className="block text-slate-400">additional eggs (same as before)</small></span></div><QuantityStepper value={extraEggs} onChange={setExtraEggs} integer /></div>
          <aside className="rounded-xl border border-white/10 bg-slate-900/70 p-4"><div className="mb-2 flex items-center gap-2"><BarChart3 className="text-violet-400"/><div><b>Total Meal (Estimated)</b><small className="block text-slate-400">Quantity × section percentage</small></div></div>{sectionRows.map(row => <div key={row.key} className="flex justify-between border-b border-white/5 py-2"><span>{row.label} ({row.percent}%) <small className="block text-slate-400">{Number(row.quantity).toFixed(2)} × {row.percent}%</small></span><b>{fmt(row.contribution)} meal</b></div>)}<div className="flex justify-between pt-3 text-lg font-bold"><span>∑ Total Meal</span><span className="rounded-lg bg-violet-600 px-4 py-2">{fmt(totalMeal)} meal</span></div></aside>
          <button type="submit" disabled={saving} className="w-full rounded-lg bg-purple-500 py-3 font-semibold hover:bg-purple-600 disabled:opacity-60">{saving ? 'Saving…' : 'Save Meal'}</button>
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
                    ? `${cell.meals > 0 ? fmt(cell.meals) + 'V' : ''} ${cell.eggs > 0 ? cell.eggs + 'D' : ''}`.trim()
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

function QuantityStepper({ value, onChange, integer = false }) {
  const step = integer ? 1 : 1;
  return <div className="flex items-center rounded-full border border-slate-700 bg-slate-900">
    <button type="button" onClick={() => onChange(Math.max(0, round2((Number(value) || 0) - step)))} className="rounded-full px-3 py-2 text-xl hover:bg-slate-800">−</button>
    <input type="number" min="0" step={integer ? 1 : 'any'} value={value} onChange={event => onChange(Math.max(0, Number(event.target.value) || 0))} className="w-14 bg-transparent text-center outline-none" />
    <button type="button" onClick={() => onChange(round2((Number(value) || 0) + step))} className="rounded-full px-3 py-2 text-xl hover:bg-slate-800">+</button>
  </div>;
}

function ItemCard({ row, quantities, percentages, setQuantities, setPercentages, presets, customPercent = false }) {
  const Icon = row.icon;
  const setQuantity = value => setQuantities(previous => ({ ...previous, [row.key]: value }));
  const setPercent = value => setPercentages(previous => ({ ...previous, [row.key]: Math.min(100, Math.max(0, Number(value) || 0)) }));
  return <div className="flex min-w-0 items-center justify-between gap-2 rounded-xl border border-white/10 bg-white/[0.03] p-3">
    <div className="flex min-w-0 items-center gap-2"><Icon className={`h-8 w-8 shrink-0 ${row.color}`} /><div className="min-w-0"><div className="truncate text-sm font-semibold">{row.label}</div>{customPercent ? <label className="text-xs text-slate-400">Section % <input aria-label={`${row.label} percentage`} type="number" min="0" max="100" value={percentages[row.key]} onChange={event => setPercent(event.target.value)} className="w-12 border-b border-slate-600 bg-transparent text-center text-white" /></label> : <span className="text-xs text-slate-400">{row.percent}%</span>}</div></div>
    {presets ? <div className="flex shrink-0 gap-1">{presets.map(value => <button type="button" key={value} onClick={() => setQuantity(value)} className={`rounded-full border px-2 py-2 text-xs ${Number(quantities[row.key]) === value ? 'border-violet-400 bg-violet-600' : 'border-slate-700 bg-slate-900'}`}>{value.toFixed(2)}</button>)}</div> : <QuantityStepper value={quantities[row.key]} onChange={setQuantity} />}
  </div>;
}
