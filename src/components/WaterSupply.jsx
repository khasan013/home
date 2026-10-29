import { useEffect, useMemo, useState } from 'react';
import { Droplets, Plus, GlassWater, CalendarDays } from 'lucide-react';
import { useHome } from '../context/HomeContext';
import { expenseApi } from '../api';

const money = value => `৳${Number(value || 0).toFixed(2)}`;
const inputClass = 'w-full rounded-xl border border-slate-700 bg-slate-950/80 px-3.5 py-3 text-white outline-none transition placeholder:text-slate-600 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20';

export default function WaterSupply() {
  const { currentHome, expenses, setExpenses } = useHome();
  const homeId = currentHome?._id;
  const [title, setTitle] = useState('Drinking water supply');
  const [bottleQty, setBottleQty] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (homeId) expenseApi.getAll(homeId).then(setExpenses).catch(err => setError(err.message));
  }, [homeId, setExpenses]);

  const waterExpenses = useMemo(() => expenses.filter(expense => expense.category === 'WaterSupply'), [expenses]);
  const total = waterExpenses.reduce((sum, expense) => sum + Number(expense.amount || 0), 0);
  const totalBottles = waterExpenses.reduce((sum, expense) => sum + Number(expense.bottleQty || 0), 0);
  const bottlePrice = Number(currentHome?.waterBottlePrice) || 0;
  const estimatedAmount = bottlePrice * (Number(bottleQty) || 0);

  const handleSubmit = async event => {
    event.preventDefault();
    setError('');
    if (!title.trim()) return setError('Please enter a description.');
    if (bottlePrice <= 0) return setError('The home admin must set a water bottle price before a purchase can be added.');
    if (!Number.isFinite(Number(bottleQty)) || Number(bottleQty) <= 0) return setError('Bottle quantity must be greater than zero.');
    setBusy(true);
    try {
      const expense = await expenseApi.add(homeId, {
        title: title.trim(), category: 'WaterSupply',
        bottleQty: Number(bottleQty),
      });
      setExpenses(previous => [expense, ...previous]);
      setTitle('Drinking water supply');
      setBottleQty('');
    } catch (err) {
      setError(err.message || 'Could not add water supply.');
    } finally {
      setBusy(false);
    }
  };

  return <div className="mx-auto max-w-5xl space-y-5 text-slate-100">
    <header className="flex flex-wrap items-center gap-3">
      <div className="rounded-2xl border border-sky-400/20 bg-sky-400/10 p-3 text-sky-300"><Droplets className="h-7 w-7" /></div>
      <div><h1 className="text-2xl font-bold tracking-tight">Water Supply</h1><p className="text-sm text-slate-400">Record drinking water purchases for {currentHome?.name || 'your home'}</p></div>
    </header>

    <section className="grid gap-3 sm:grid-cols-3">
      <SummaryCard label="Total Water Cost" value={money(total)} icon={<Droplets className="h-5 w-5" />} />
      <SummaryCard label="Bottles Purchased" value={String(totalBottles)} icon={<GlassWater className="h-5 w-5" />} />
      <SummaryCard label="Shared Equally" value="Yes" icon={<span className="text-lg">÷</span>} />
    </section>

    <section className="rounded-2xl border border-slate-700/80 bg-gradient-to-br from-slate-900/95 to-slate-950/95 p-5 shadow-xl shadow-black/20 sm:p-6">
      <div className="mb-4"><h2 className="text-lg font-semibold">Add Water Supply</h2><p className="mt-1 text-sm text-slate-400">Bottle price is set by your home admin. Add the quantity and the total will be shared equally.</p></div>
      {error && <p role="alert" className="mb-3 rounded-lg border border-red-400/20 bg-red-400/10 px-3 py-2 text-sm text-red-300">{error}</p>}
      <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Field label="Description"><input value={title} onChange={event => setTitle(event.target.value)} className={inputClass} placeholder="Drinking water supply" /></Field>
        <Field label="Bottle quantity"><input type="number" min="1" step="1" value={bottleQty} onChange={event => setBottleQty(event.target.value)} className={inputClass} placeholder="e.g. 4" /></Field>
        <div className="flex items-center rounded-xl border border-slate-800 bg-slate-950/60 px-3.5 py-3"><div><div className="text-xs text-slate-400">Admin-set bottle price</div><div className="mt-1 font-semibold text-sky-200">{bottlePrice > 0 ? `${money(bottlePrice)} / bottle` : 'Not set yet'}</div></div></div>
        <div className="flex flex-col justify-end gap-2"><div className="text-xs text-slate-400">Purchase total <span className="ml-1 font-semibold text-sky-200">{money(estimatedAmount)}</span></div><button type="submit" disabled={busy || bottlePrice <= 0} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-600 to-cyan-500 px-4 py-2.5 font-semibold text-white shadow-lg shadow-sky-950/30 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"><Plus className="h-4 w-4" />{busy ? 'Adding…' : 'Add Water Supply'}</button></div>
      </form>
    </section>

    <section className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/60">
      <div className="border-b border-slate-800 px-5 py-4"><h2 className="font-semibold">Recent Water Supply</h2></div>
      {waterExpenses.length === 0 ? <div className="px-5 py-12 text-center text-sm text-slate-400">No water-supply purchases recorded yet.</div> : <div className="divide-y divide-slate-800/80">{waterExpenses.map(expense => <div key={expense._id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4"><div className="flex min-w-0 items-center gap-3"><span className="rounded-xl bg-sky-400/10 p-2.5 text-sky-300"><GlassWater className="h-5 w-5" /></span><div className="min-w-0"><div className="truncate font-medium">{expense.title}</div><div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-400"><span>{expense.bottleQty || 0} bottles × {money(expense.bottlePrice)}</span><span>·</span><span className="inline-flex items-center gap-1"><CalendarDays className="h-3 w-3" />{new Date(expense.createdAt).toLocaleDateString()}</span></div></div></div><div className="font-semibold text-sky-200">{money(expense.amount)}</div></div>)}</div>}
    </section>
  </div>;
}

function SummaryCard({ label, value, icon }) {
  return <div className="rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-950 p-4 shadow-lg shadow-black/10"><div className="flex items-center gap-2 text-sm text-slate-400"><span className="text-sky-300">{icon}</span>{label}</div><div className="mt-2 text-2xl font-bold text-white">{value}</div></div>;
}

function Field({ label, children }) {
  return <label className="block text-sm text-slate-300">{label}<div className="mt-1.5">{children}</div></label>;
}
