import { useState, useEffect, useMemo } from 'react';
import { Plus, Trash2, BarChart3, Drumstick, Egg, Soup, Carrot, Utensils, Check } from 'lucide-react';
import { useHome } from '../context/HomeContext';
import { mealApi } from '../api';
import { formatCount } from '../utils/numberFormat';

const initialQuantities = { meat: 0, vegetables: 0, egg: 0, rice: 0.1, vat: 0 };
const initialPercentages = { meat: 75, vegetables: 10, egg: 50, rice: 100, vat: 100 };
const itemMeta = [
  { key: 'meat', label: 'Mash / Murgi', icon: Drumstick, color: 'text-orange-400' },
  { key: 'vegetables', label: 'Vegi', icon: Carrot, color: 'text-emerald-400' },
  { key: 'egg', label: 'Egg with Meal', icon: Egg, color: 'text-amber-300' },
  { key: 'rice', label: 'Rice', icon: Soup, color: 'text-slate-100' },
  { key: 'vat', label: 'Vat (Custom)', icon: Utensils, color: 'text-violet-300' },
];
const round2 = value => Math.round((Number(value || 0) + Number.EPSILON) * 100) / 100;
const fmt = value => round2(value).toFixed(2);
const getLocalDateInputValue = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function MealTracking() {
  const { currentHome, meals, setMeals } = useHome();
  const homeId = currentHome?._id;

  const isAdmin = currentHome?.role === 'admin';

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [editValue, setEditValue] = useState('');

  const [date, setDate] = useState(getLocalDateInputValue);
  const [quantities, setQuantities] = useState(initialQuantities);
  const [percentages, setPercentages] = useState(initialPercentages);
  const [extraEggs, setExtraEggs] = useState(0);
  const [saving, setSaving] = useState(false);

  const sectionRows = useMemo(() => itemMeta.map(item => ({
    ...item,
    quantity: Number(quantities[item.key]) || 0,
    percent: Number(percentages[item.key]) || 0,
    contribution: item.key === 'rice' || item.key === 'vat'
      ? round2(Number(quantities[item.key]) || 0)
      : round2((Number(quantities[item.key]) || 0) * (Number(percentages[item.key]) || 0) / 100),
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
        // Keep the selected calendar date stable across browser and server timezones.
        date: `${date}T00:00:00.000Z`,
        mealCount: totalMeal,
        eggsCount: Number(extraEggs) || 0,
        mealSections: { quantities, percentages },
      });
      setMeals(await mealApi.getAll(homeId));
      setQuantities(initialQuantities);
      setPercentages(initialPercentages);
      setExtraEggs(0);
      setDate(getLocalDateInputValue());
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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3"><div className="rounded-xl border border-violet-400/20 bg-violet-500/10 p-2.5 text-violet-300"><Soup className="h-6 w-6" /></div><div><h3 className="text-xl font-bold tracking-tight text-white">Meal Table</h3><p className="text-sm text-slate-400">Select meal items and quantities for this date</p></div></div>

        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-500 px-6 py-3 font-semibold text-white shadow-lg shadow-violet-950/40 transition hover:brightness-110 active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" /> Add Meal
        </button>
      </div>

      {/* FORM */}
      {showForm && (
        <form onSubmit={handleSubmit} className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
          <div className="space-y-4 rounded-2xl border border-slate-800/90 bg-gradient-to-br from-slate-950 via-slate-950 to-indigo-950/40 p-4 shadow-xl shadow-black/20 sm:p-6">
            <label className="block max-w-sm text-sm font-medium text-slate-300">Date<div className="relative mt-1.5"><input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full rounded-xl border border-slate-700 bg-slate-900/90 px-4 py-3 text-white outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 [color-scheme:dark]" required /></div></label>
            <div className="grid gap-3 lg:grid-cols-3">{sectionRows.slice(0, 3).map(row => <ItemCard key={row.key} row={row} quantities={quantities} setQuantities={setQuantities} />)}</div>
            <div className="grid gap-3 rounded-2xl border border-slate-800 bg-slate-900/35 p-3 md:grid-cols-[minmax(0,1fr)_1px_minmax(0,1fr)]">
              <ItemCard row={sectionRows[3]} quantities={quantities} setQuantities={setQuantities} presets={[0.05, 0.1, 0.15, 0.2, 0.3]} />
              <div className="hidden bg-slate-700/70 md:block" />
              <ItemCard row={sectionRows[4]} quantities={quantities} setQuantities={setQuantities} directMeal />
            </div>
            <div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-slate-900/45 p-4 transition hover:border-slate-700"><div className="flex items-center gap-3"><Egg className="h-9 w-9 text-amber-300"/><div className="font-semibold">Extra Egg<small className="block font-normal text-slate-400">(additional eggs)</small></div></div><QuantityStepper value={extraEggs} onChange={setExtraEggs} integer /></div>
            <button type="submit" disabled={saving} className="w-full rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-500 py-3 font-bold text-white shadow-lg shadow-violet-950/30 transition hover:brightness-110 hover:shadow-violet-900/30 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60">{saving ? 'Saving…' : 'Save Meal'}</button>
          </div>
          <SummaryPanel sectionRows={sectionRows} extraEggs={extraEggs} totalMeal={totalMeal} />
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
                    ? `${cell.meals > 0 ? fmt(cell.meals) + 'V' : ''} ${cell.eggs > 0 ? formatCount(cell.eggs) + 'D' : ''}`.trim()
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

function QuantityStepper({ value, onChange, integer = false, disabled = false, step: requestedStep }) {
  const step = requestedStep || 1;
  return <div className={`flex items-center rounded-full border border-slate-700 bg-slate-900 ${disabled ? 'opacity-40' : ''}`}>
    <button type="button" disabled={disabled} onClick={() => onChange(Math.max(0, round2((Number(value) || 0) - step)))} className="rounded-full p-2.5 text-lg transition hover:bg-slate-800 disabled:cursor-not-allowed">−</button>
    <input type="number" min="0" step={integer ? 1 : 'any'} disabled={disabled} value={value} onChange={event => onChange(Math.max(0, Number(event.target.value) || 0))} className="w-10 bg-transparent text-center text-sm outline-none disabled:cursor-not-allowed" />
    <button type="button" disabled={disabled} onClick={() => onChange(round2((Number(value) || 0) + step))} className="rounded-full p-2.5 text-lg transition hover:bg-slate-800 disabled:cursor-not-allowed">+</button>
  </div>;
}

function ItemCard({ row, quantities, percentages, setQuantities, presets, directMeal = false }) {
  const Icon = row.icon;
  const setQuantity = value => setQuantities(previous => ({ ...previous, [row.key]: value }));
  const selected = Number(quantities[row.key]) > 0;
  const optional = !presets;
  return <div className={`flex min-w-0 flex-col gap-3 rounded-2xl border p-3 transition duration-200 sm:p-3.5 ${selected ? 'border-violet-500/80 bg-gradient-to-br from-violet-500/[0.10] to-fuchsia-500/[0.04] shadow-lg shadow-violet-950/10' : 'border-slate-800 bg-slate-900/35 hover:border-slate-700'}`}>
    <div className="flex min-w-0 items-center gap-2.5">
      {optional && <button type="button" role="checkbox" aria-checked={selected} aria-label={`Select ${row.label}`} onClick={() => setQuantity(selected ? 0 : (directMeal ? 0.05 : 1))} className={`grid h-6 w-6 shrink-0 place-items-center rounded-md border transition ${selected ? 'border-violet-400 bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white shadow-md shadow-violet-950/40' : 'border-slate-600 bg-slate-950 text-transparent hover:border-violet-400'}`}><Check className="h-4 w-4" /></button>}
      <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-white/10 bg-gradient-to-br from-white/[0.09] to-white/[0.02] shadow-inner ${row.color}`}><Icon className="h-6 w-6" strokeWidth={2.1} /></span>
      <div className="min-w-0 flex-1"><div className="truncate text-sm font-semibold text-slate-100">{row.label}</div><span className="text-xs text-slate-400">{directMeal ? 'Direct meal input' : `${row.percent}% share`}</span></div>
    </div>
    <div className={`flex min-h-10 items-center ${presets ? 'justify-start' : 'justify-end'}`}>
      {presets ? <div className="flex flex-wrap gap-1.5">{presets.map(value => <button type="button" key={value} aria-pressed={Number(quantities[row.key]) === value} onClick={() => setQuantity(Number(quantities[row.key]) === value ? 0 : value)} className={`min-w-[48px] rounded-full border px-2.5 py-2 text-xs transition duration-150 ${Number(quantities[row.key]) === value ? 'border-violet-400 bg-gradient-to-r from-violet-600 to-fuchsia-500 text-white shadow-md shadow-violet-950/30' : 'border-slate-700 bg-slate-900 text-slate-300 hover:border-violet-500/60 hover:text-white'}`}>{value}</button>)}</div> : <QuantityStepper value={quantities[row.key]} onChange={setQuantity} disabled={!selected} step={directMeal ? 0.05 : 1} />}
    </div>
  </div>;
}

function SummaryPanel({ sectionRows, extraEggs, totalMeal }) {
  return <aside className="h-fit rounded-2xl border border-indigo-900/60 bg-gradient-to-br from-slate-950 via-slate-950 to-indigo-950/50 p-4 shadow-xl shadow-black/20 sm:p-5">
    <div className="mb-3 flex items-center gap-3"><div className="rounded-lg bg-violet-500/10 p-2 text-violet-300"><BarChart3 className="h-6 w-6" /></div><div><h4 className="font-bold text-white">Total Meal (Estimated)</h4><p className="text-xs text-slate-400">Based on selected items and quantity</p></div></div>
    <div className="divide-y divide-slate-800/80">
      {sectionRows.map(row => {
        const selected = row.quantity > 0;
        const direct = row.key === 'rice' || row.key === 'vat';
        const description = direct ? `${Number(row.quantity).toFixed(2)} meal input` : `${Number(row.quantity).toFixed(2)} × ${fmt(row.percent / 100)}`;
        const title = row.key === 'vat' ? row.label : `${row.label} (${row.percent}%)`;
        return <div key={row.key} className={`flex items-center justify-between gap-2 py-2.5 transition ${selected ? 'opacity-100' : 'opacity-45'}`}><div className="flex min-w-0 items-center gap-2.5"><row.icon className={`h-6 w-6 shrink-0 ${row.color}`} /><div className="min-w-0"><div className="truncate text-sm font-medium text-slate-100">{title}</div><div className="truncate text-xs text-slate-400">{description}</div></div></div><span className={`shrink-0 rounded-full px-3 py-1 text-right text-sm font-semibold ${selected ? 'bg-violet-500/15 text-violet-100' : 'bg-slate-800/70 text-slate-400'}`}>{fmt(row.contribution)}<small className="block text-[10px] font-normal">meal</small></span></div>;
      })}
      <div className={`flex items-center justify-between gap-2 py-2.5 ${Number(extraEggs) > 0 ? '' : 'opacity-45'}`}><div className="flex min-w-0 items-center gap-2.5"><Egg className="h-6 w-6 shrink-0 text-amber-300"/><div><div className="text-sm font-medium text-slate-100">Extra Egg</div><div className="text-xs text-slate-400">Included in total eggs consumed</div></div></div><span className="shrink-0 rounded-full bg-amber-400/10 px-3 py-1 text-right text-sm font-semibold text-amber-200">{formatCount(extraEggs)}<small className="ml-1 font-medium">{Number(extraEggs) === 1 ? 'egg' : 'eggs'}</small></span></div>
    </div>
    <div className="mt-2 flex items-center justify-between border-t border-slate-700/90 pt-3"><div className="flex items-center gap-3"><span className="text-3xl text-slate-300">∑</span><span className="font-semibold text-white">Total Meal</span></div><span className="rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-500 px-5 py-2 text-center text-xl font-bold text-white shadow-lg shadow-violet-950/30">{fmt(totalMeal)}<small className="block text-xs font-medium">meal</small></span></div>
  </aside>;
}
