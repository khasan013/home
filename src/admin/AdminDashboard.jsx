// src/pages/AdminDashboard.jsx
//
// Changes vs previous version:
//  1. Penalty is stored as a separate record ONLY — it does NOT inject a meal
//     entry and does NOT affect the penalised user's meal count.
//  2. Egg stats (totalEggPrice, totalEggCount, consumedEgg) are auto-filled from
//     the home's expense & meal data.  Admin can still override any field.
//  3. Bills are sent automatically on the 1st of every month at 00:01 AM
//     (client-side scheduler — fires once when the dashboard is mounted if the
//     current time is day-1 of the month and the auto-bill hasn't been sent yet
//     this month).  Admin can still send manually any time.

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Trash2, Pencil, ShieldCheck, ShieldOff,
  AlertTriangle, Send, Loader2,
  CheckCircle2, XCircle, RefreshCw,
} from 'lucide-react';
import { useHome } from '../context/HomeContext';
import { adminApi, mealApi, expenseApi } from '../api';

// ── tiny toast ────────────────────────────────────────────
function Toast({ msg, type, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [onClose]);
  const bg = type === 'error' ? '#ef4444' : '#22c55e';
  return (
    <div style={{
      position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
      background: bg, color: '#fff', borderRadius: 10,
      padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 10,
      boxShadow: '0 8px 32px rgba(0,0,0,.35)', fontSize: 14, fontWeight: 500,
      animation: 'slideIn .25s ease',
    }}>
      {type === 'error' ? <XCircle size={16} /> : <CheckCircle2 size={16} />}
      {msg}
    </div>
  );
}

function Card({ title, children, accent = '#6366f1' }) {
  return (
    <div style={{
      background: '#111827', borderRadius: 14, overflow: 'hidden',
      border: '1px solid #1f2937', marginBottom: 24,
    }}>
      <div style={{
        borderLeft: `4px solid ${accent}`, padding: '14px 20px',
        background: '#0f172a', fontWeight: 700, fontSize: 15, color: '#f1f5f9',
      }}>{title}</div>
      <div style={{ padding: 20 }}>{children}</div>
    </div>
  );
}

function Stat({ label, value, color = '#6366f1' }) {
  return (
    <div style={{
      flex: '1 1 140px', background: '#0f172a', borderRadius: 12,
      padding: '18px 20px', border: '1px solid #1f2937',
    }}>
      <div style={{ color: '#6b7280', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 }}>{label}</div>
      <div style={{ color, fontSize: 28, fontWeight: 800, marginTop: 6 }}>{value}</div>
    </div>
  );
}

// ── Auto-bill scheduler ───────────────────────────────────
// Returns ms until next 1st-of-month 00:01 AM local time.
function msUntilMonthStart() {
  const now  = new Date();
  const next = new Date(now.getFullYear(), now.getMonth() + 1, 1, 0, 1, 0, 0);
  return next - now;
}

// Storage key to avoid double-firing in same month
function autoBillKey(homeId) {
  const d = new Date();
  return `autoBillSent_${homeId}_${d.getFullYear()}_${d.getMonth() + 1}`;
}

// ─────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const { currentHome, expenses } = useHome();
  const homeId = currentHome?._id;

  const [members,   setMembers]   = useState([]);
  const [penalties, setPenalties] = useState([]);
  const [meals,     setMeals]     = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [busy,      setBusy]      = useState('');
  const [toast,     setToast]     = useState(null);

  // penalty form
  const [penForm, setPenForm] = useState({ userId: '', meals: '', reason: '' });

  // cost form — egg fields are auto-filled but editable
  const [costForm, setCostForm] = useState({
    totalEggPrice: '',
    totalEggCount: '',
    consumedEgg:   '',
    otherCost:     '',
  });

  // meal edit
  const [editMeal, setEditMeal] = useState(null);

  const autoBillFiredRef = useRef(false);

  const toast$ = (msg, type = 'success') => setToast({ msg, type });

  // ── load ──────────────────────────────────────────────
  const load = useCallback(async () => {
    if (!homeId) return;
    setLoading(true);
    try {
      const [m, p, ml] = await Promise.all([
        adminApi.getMembers(homeId),
        adminApi.getPenalties(homeId),
        mealApi.getAll(homeId),
      ]);
      setMembers(m);
      setPenalties(p);
      setMeals(ml);
    } catch (err) {
      toast$(err.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [homeId]);

  useEffect(() => { load(); }, [load]);

  // ── Auto-fill egg stats from expense context ──────────
 useEffect(() => {
  if (!expenses || expenses.length === 0) return;

  // 🥚 Egg expenses
  const eggExpenses   = expenses.filter(e => e.category === 'Egg');
  const totalEggPrice = eggExpenses.reduce((s, e) => s + e.amount, 0);
  const totalEggCount = eggExpenses.reduce((s, e) => s + (e.eggQty || 0), 0);

  // 🛒 Grocery expenses
  const groceryTotal = expenses
    .filter(e => e.category === 'Grocery')
    .reduce((s, e) => s + e.amount, 0);

  setCostForm(prev => ({
    ...prev,
    totalEggPrice: totalEggPrice > 0 ? String(totalEggPrice) : prev.totalEggPrice,
    totalEggCount: totalEggCount > 0 ? String(totalEggCount) : prev.totalEggCount,
    otherCost: groceryTotal > 0 ? String(groceryTotal) : prev.otherCost, // ✅ ADD THIS
  }));

}, [expenses]);

  // ── Auto-fill consumedEgg from meal records ───────────
  useEffect(() => {
    if (!meals || meals.length === 0) return;
    const consumed = meals
      .filter(m => !m.isPenalty)
      .reduce((s, m) => s + (m.eggsCount || 0), 0);

    setCostForm(prev => ({
      ...prev,
      consumedEgg: consumed > 0 ? String(consumed) : prev.consumedEgg,
    }));
  }, [meals]);

  // ── Bill calculation (live preview) ───────────────────
  const billCalc = (() => {
    const { totalEggPrice, totalEggCount, consumedEgg, otherCost } = costForm;
    if (!totalEggPrice || !totalEggCount) return null;
    const eggPrice        = Number(totalEggPrice);
    const eggCount        = Number(totalEggCount) || 1;
    const consumed        = Number(consumedEgg)   || 0;
    const other           = Number(otherCost)     || 0;
    const perEgg          = eggPrice / eggCount;
    const consumedCost    = consumed * perEgg;
    const remainingEggCost = eggPrice - consumedCost;
    const totalBill       = other + remainingEggCost;
    return { perEgg, consumedCost, remainingEggCost, totalBill };
  })();

 // ── Send bill ─────────────────────────────────────────
const doSendBill = useCallback(async (auto = false) => {
  if (!billCalc) return;

  setBusy('bill');

  try {
    const month = new Date().toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    });

    // ✅ CALCULATE TOTAL MEALS (VERY IMPORTANT)
    const totalMeals = meals
      .filter(m => !m.isPenalty)
      .reduce((s, m) => s + (m.mealCount || 0), 0);

    if (!totalMeals) {
      return toast$('No meals found for this month', 'error');
    }

    // ✅ SEND FULL DATA TO BACKEND
    const result = await adminApi.sendBill(homeId, {
      ...costForm,

      totalMeals,                    // 🔥 needed for perMeal
      totalBill: billCalc.totalBill, // 🔥 correct total (remainingEgg + other)
      perEgg: billCalc.perEgg,       // 🔥 egg cost per piece

      month,
    });

    toast$(auto ? `Auto-bill sent for ${month}` : result.message);

    if (auto) {
      localStorage.setItem(autoBillKey(homeId), '1');
    }

  } catch (err) {
    toast$(err.message, 'error');
  } finally {
    setBusy('');
  }
}, [billCalc, costForm, homeId, meals]); // ✅ add meals dependency



const handleSendBill = async (e) => {
  e.preventDefault();

  if (!billCalc) {
    return toast$('Enter egg price and count first', 'error');
  }

  doSendBill(false);
};
  // ── Monthly auto-bill scheduler ───────────────────────
  useEffect(() => {
    if (!homeId || autoBillFiredRef.current) return;

    const now = new Date();
    // Check if it's the 1st of the month and not already sent
    if (now.getDate() === 1 && !localStorage.getItem(autoBillKey(homeId))) {
      // Wait until data is loaded and costForm has values, then fire
      const tryAutoSend = () => {
        if (billCalc && !autoBillFiredRef.current) {
          autoBillFiredRef.current = true;
          doSendBill(true);
        }
      };
      // Give a small delay so costForm gets auto-filled first
      const tid = setTimeout(tryAutoSend, 3000);
      return () => clearTimeout(tid);
    }

    // Schedule for next month-start
    const delay = msUntilMonthStart();
    const tid   = setTimeout(() => {
      if (!localStorage.getItem(autoBillKey(homeId)) && billCalc) {
        autoBillFiredRef.current = true;
        doSendBill(true);
      }
    }, delay);
    return () => clearTimeout(tid);
  }, [homeId, billCalc, doSendBill]);

  // ── Member actions ────────────────────────────────────
  const handlePromote = async (userId) => {
    setBusy(`promote-${userId}`);
    try {
      const updated = await adminApi.promoteUser(homeId, userId);
      setMembers(prev => prev.map(m =>
        m.user?._id === userId ? { ...m, role: updated.role } : m,
      ));
      toast$('Role updated');
    } catch (err) { toast$(err.message, 'error'); }
    finally { setBusy(''); }
  };

  const handleRemove = async (userId) => {
    if (!confirm('Remove this member from the home?')) return;
    setBusy(`remove-${userId}`);
    try {
      await adminApi.removeUser(homeId, userId);
      setMembers(prev => prev.filter(m => m.user?._id !== userId));
      toast$('Member removed');
    } catch (err) { toast$(err.message, 'error'); }
    finally { setBusy(''); }
  };

  // ── Penalty ───────────────────────────────────────────
  // Penalty is a SEPARATE record only.  It does NOT inject a meal entry
  // and does NOT affect the penalised user's meal count.
  const handlePenalty = async (e) => {
    e.preventDefault();
    const { userId, meals: penMeals, reason } = penForm;
    if (!userId || !penMeals) return toast$('Select user and enter meal count', 'error');
    setBusy('penalty');
    try {
      const newPenalty = await adminApi.addPenalty(homeId, {
        userId,
        meals:  Number(penMeals),
        reason,
        // Signal to backend: do NOT create a meal record for this penalty
        injectMeal: false,
      });
      setPenalties(prev => [newPenalty, ...prev]);
      setPenForm({ userId: '', meals: '', reason: '' });
      toast$(`Penalty of ${penMeals} meals recorded (bill share adjusted at send-bill time)`);
    } catch (err) { toast$(err.message, 'error'); }
    finally { setBusy(''); }
  };

  const handleRemovePenalty = async (penId) => {
    if (!confirm('Remove this penalty?')) return;
    try {
      await adminApi.removePenalty(homeId, penId);
      setPenalties(prev => prev.filter(p => p._id !== penId));
      toast$('Penalty removed');
    } catch (err) { toast$(err.message, 'error'); }
  };

  // ── Meal actions ──────────────────────────────────────
  const handleDeleteMeal = async (mealId) => {
    if (!confirm('Delete this meal entry?')) return;
    try {
      await mealApi.remove(homeId, mealId);
      setMeals(prev => prev.filter(m => m._id !== mealId));
      toast$('Meal deleted');
    } catch (err) { toast$(err.message, 'error'); }
  };

  const handleEditMealSubmit = async (e) => {
    e.preventDefault();
    if (!editMeal) return;
    setBusy('editMeal');
    try {
      const updated = await mealApi.update(homeId, editMeal._id, {
        mealCount: Number(editMeal.mealCount),
        eggsCount: Number(editMeal.eggsCount),
      });
      setMeals(prev => prev.map(m => m._id === updated._id ? updated : m));
      setEditMeal(null);
      toast$('Meal updated');
    } catch (err) { toast$(err.message, 'error'); }
    finally { setBusy(''); }
  };

  // ── Derived stats ─────────────────────────────────────
  // Total meals = only regular (non-penalty) meal entries
  const totalMeals      = meals.filter(m => !m.isPenalty).reduce((s, m) => s + m.mealCount, 0);
  const totalPenalty    = penalties.reduce((s, p) => s + (p.amount || 0), 0);
  const totalEggsConsumed = meals.filter(m => !m.isPenalty).reduce((s, m) => s + (m.eggsCount || 0), 0);

  const inp = {
    background: '#1f2937', border: '1px solid #374151', borderRadius: 8,
    color: '#f1f5f9', padding: '9px 12px', fontSize: 14, outline: 'none',
    width: '100%', boxSizing: 'border-box',
  };
  const btn = (bg = '#6366f1') => ({
    background: bg, color: '#fff', border: 'none', borderRadius: 8,
    padding: '9px 18px', cursor: 'pointer', fontSize: 13, fontWeight: 600,
    display: 'flex', alignItems: 'center', gap: 6,
  });

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: '#6b7280' }}>
      <Loader2 size={32} style={{ animation: 'spin 1s linear infinite' }} />
    </div>
  );

  return (
    <div style={{ padding: 24, maxWidth: 900, margin: '0 auto', color: '#f1f5f9', fontFamily: 'system-ui,sans-serif' }}>
      <style>{`
        @keyframes spin    { to { transform:rotate(360deg) } }
        @keyframes slideIn { from { transform:translateY(12px);opacity:0 } }
        select option { background:#1f2937; }
        table { border-collapse:collapse; width:100%; font-size:13px; }
        th,td { padding:10px 14px; text-align:left; border-bottom:1px solid #1f2937; }
        th { color:#9ca3af; font-weight:600; font-size:12px; text-transform:uppercase; letter-spacing:.5px; }
        tr:last-child td { border-bottom:none; }
        tr:hover td { background:#0f172a40; }
        input:focus,select:focus { border-color:#6366f1 !important; }
      `}</style>

      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, margin: 0, color: '#f8fafc' }}>Admin Dashboard</h1>
        <button onClick={load} style={{ ...btn('#1f2937'), padding: '8px 14px' }} title="Refresh">
          <RefreshCw size={14} />
        </button>
      </div>

      {/* ── STATS ── */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 24 }}>
        <Stat label="Members"         value={members.length}    color="#6366f1" />
        <Stat label="Total Meals"     value={totalMeals}        color="#22c55e" />
        <Stat label="Penalties"       value={penalties.length}  color="#f59e0b" />
        <Stat label="Penalty Meals"   value={`+${totalPenalty}`} color="#ef4444" />
        <Stat label="Eggs Consumed"   value={totalEggsConsumed} color="#f59e0b" />
      </div>

      {/* ── COST & BILL ── */}
      <Card title="💰 Cost Calculation & Send Bills" accent="#22c55e">
        <p style={{ color: '#9ca3af', fontSize: 12, marginTop: 0, marginBottom: 12 }}>
          🔄 Egg fields are auto-filled from your Expense &amp; Meal data. You can still edit them before sending.
        </p>
        <form onSubmit={handleSendBill}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill,minmax(190px,1fr))',
            gap: 10, marginBottom: 16,
          }}>
            {[
              ['totalEggPrice', '🥚 Total Egg Price (৳)',  '#f59e0b'],
              ['totalEggCount', '🥚 Total Egg Count',      '#f59e0b'],
              ['consumedEgg',   '🍳 Consumed Eggs',        '#f59e0b'],
              ['otherCost',     '🛒 Other / Grocery Cost (৳)', '#6366f1'],
            ].map(([key, label, accent]) => (
              <div key={key}>
                <label style={{ display: 'block', color: accent === '#f59e0b' ? '#fbbf24' : '#9ca3af', fontSize: 12, marginBottom: 4 }}>
                  {label}
                </label>
                <input
                  style={{
                    ...inp,
                    borderColor: costForm[key] ? '#374151' : '#374151',
                  }}
                  type="number" placeholder="0"
                  value={costForm[key]}
                  onChange={e => setCostForm(p => ({ ...p, [key]: e.target.value }))}
                />
              </div>
            ))}
          </div>

          {/* Live preview */}
          {billCalc && (
            <div style={{
              background: '#0f172a', borderRadius: 10, padding: 16, marginBottom: 16,
              border: '1px solid #22c55e40',
              display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(180px,1fr))', gap: 12,
            }}>
              {[
                ['Per Egg',           `৳${billCalc.perEgg.toFixed(2)}`],
                ['Consumed Egg Cost', `৳${billCalc.consumedCost.toFixed(2)}`],
                ['Remaining Egg',     `৳${billCalc.remainingEggCost.toFixed(2)}`],
                ['TOTAL BILL',        `৳${billCalc.totalBill.toFixed(2)}`],
              ].map(([l, v], i) => (
                <div key={l}>
                  <div style={{ color: '#6b7280', fontSize: 11, textTransform: 'uppercase' }}>{l}</div>
                  <div style={{
                    color: i === 3 ? '#22c55e' : '#f1f5f9',
                    fontSize: i === 3 ? 22 : 16,
                    fontWeight: i === 3 ? 800 : 500,
                    marginTop: 2,
                  }}>{v}</div>
                </div>
              ))}
            </div>
          )}

          <p style={{ color: '#9ca3af', fontSize: 12, marginBottom: 12 }}>
            Bills are also auto-sent every month on the <strong style={{ color: '#f1f5f9' }}>1st at 12:01 AM</strong>.
            Click below to send manually any time.
          </p>
          <button style={btn('#22c55e')} type="submit" disabled={busy === 'bill' || !billCalc}>
            {busy === 'bill'
              ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
              : <Send size={14} />
            }
            Calculate &amp; Send Bills to All Members
          </button>
        </form>
      </Card>

      {/* ── MEMBERS ── */}
      <Card title="👥 Members" accent="#6366f1">
        <table>
          <thead>
            <tr><th>Name</th><th>Email</th><th>Role</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {members.map(m => (
              <tr key={m.user?._id}>
                <td style={{ fontWeight: 600 }}>{m.user?.firstName} {m.user?.lastName}</td>
                <td style={{ color: '#9ca3af' }}>{m.user?.email}</td>
                <td>
                  <span style={{
                    background: m.role === 'admin' ? '#312e81' : '#1f2937',
                    color:      m.role === 'admin' ? '#a5b4fc' : '#9ca3af',
                    borderRadius: 20, padding: '2px 10px', fontSize: 12, fontWeight: 600,
                  }}>{m.role}</span>
                </td>
                <td>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={() => handlePromote(m.user?._id)}
                      style={{ ...btn('#1f2937'), padding: '6px 10px' }}
                      title={m.role === 'admin' ? 'Demote' : 'Promote'}
                      disabled={busy === `promote-${m.user?._id}`}
                    >
                      {m.role === 'admin'
                        ? <ShieldOff size={14} color="#f59e0b" />
                        : <ShieldCheck size={14} color="#6366f1" />
                      }
                    </button>
                    <button
                      onClick={() => handleRemove(m.user?._id)}
                      style={{ ...btn('#1f2937'), padding: '6px 10px' }}
                      title="Remove member"
                      disabled={busy === `remove-${m.user?._id}`}
                    >
                      <Trash2 size={14} color="#ef4444" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {/* ── ADD PENALTY ── */}
      <Card title="⚠️ Add Penalty" accent="#f59e0b">
        <p style={{ color: '#9ca3af', fontSize: 13, marginTop: 0 }}>
          Penalty meals are recorded separately. They <strong style={{ color: '#fbbf24' }}>do not</strong> inflate the
          home's total meal count or the user's personal meal count.
          The penalty amount adjusts the member's cost share when bills are sent.
        </p>
        <form onSubmit={handlePenalty} style={{
          display: 'grid', gap: 10,
          gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))',
        }}>
          <div>
            <label style={{ display: 'block', color: '#9ca3af', fontSize: 12, marginBottom: 4 }}>Member</label>
            <select
              style={inp}
              value={penForm.userId}
              onChange={e => setPenForm(p => ({ ...p, userId: e.target.value }))}
            >
              <option value="">— Select member —</option>
              {members.map(m => (
                <option key={m.user?._id} value={m.user?._id}>
                  {m.user?.firstName} {m.user?.lastName}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', color: '#9ca3af', fontSize: 12, marginBottom: 4 }}>Penalty Meals</label>
            <input
              style={inp} type="number" min="1" placeholder="e.g. 5"
              value={penForm.meals}
              onChange={e => setPenForm(p => ({ ...p, meals: e.target.value }))}
            />
          </div>
          <div style={{ gridColumn: '1/-1' }}>
            <label style={{ display: 'block', color: '#9ca3af', fontSize: 12, marginBottom: 4 }}>Reason</label>
            <input
              style={inp} placeholder="e.g. Late payment, rule violation…"
              value={penForm.reason}
              onChange={e => setPenForm(p => ({ ...p, reason: e.target.value }))}
            />
          </div>
          <div>
            <button style={btn('#f59e0b')} type="submit" disabled={busy === 'penalty'}>
              {busy === 'penalty'
                ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                : <AlertTriangle size={14} />
              }
              Apply Penalty
            </button>
          </div>
        </form>

        {penalties.length > 0 && (
          <div style={{ marginTop: 20 }}>
            <div style={{ color: '#9ca3af', fontSize: 12, textTransform: 'uppercase', marginBottom: 8 }}>Penalty Log</div>
            <table>
              <thead>
                <tr><th>Member</th><th>Meals</th><th>Reason</th><th>Date</th><th></th></tr>
              </thead>
              <tbody>
                {penalties.map(p => (
                  <tr key={p._id}>
                    <td>{p.userId?.firstName} {p.userId?.lastName}</td>
                    <td><span style={{ color: '#ef4444', fontWeight: 700 }}>+{p.amount}</span></td>
                    <td style={{ color: '#9ca3af' }}>{p.reason || '—'}</td>
                    <td style={{ color: '#6b7280', fontSize: 12 }}>{new Date(p.createdAt).toLocaleDateString()}</td>
                    <td>
                      <button
                        onClick={() => handleRemovePenalty(p._id)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                      >
                        <Trash2 size={13} color="#ef4444" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* ── MEALS ── */}
      <Card title="🍽️ All Meals" accent="#38bdf8">
        {editMeal && (
          <div style={{
            background: '#0f172a', border: '1px solid #374151', borderRadius: 12,
            padding: 20, marginBottom: 16,
          }}>
            <form onSubmit={handleEditMealSubmit} style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
              <div>
                <label style={{ display: 'block', color: '#9ca3af', fontSize: 12, marginBottom: 4 }}>Meal Count</label>
                <input style={{ ...inp, width: 120 }} type="number"
                  value={editMeal.mealCount}
                  onChange={e => setEditMeal(p => ({ ...p, mealCount: e.target.value }))}
                />
              </div>
              <div>
                <label style={{ display: 'block', color: '#9ca3af', fontSize: 12, marginBottom: 4 }}>Eggs Count</label>
                <input style={{ ...inp, width: 120 }} type="number"
                  value={editMeal.eggsCount}
                  onChange={e => setEditMeal(p => ({ ...p, eggsCount: e.target.value }))}
                />
              </div>
              <button style={btn()} type="submit" disabled={busy === 'editMeal'}>
                {busy === 'editMeal' ? <Loader2 size={14} /> : <Pencil size={14} />} Save
              </button>
              <button style={btn('#374151')} type="button" onClick={() => setEditMeal(null)}>Cancel</button>
            </form>
          </div>
        )}

        <table>
          <thead>
            <tr><th>Member</th><th>Date</th><th>Meals</th><th>Eggs</th><th>Type</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {meals.map(m => (
              <tr key={m._id}>
                <td style={{ fontWeight: 500 }}>{m.userId?.firstName || m.userId?.email || '—'}</td>
                <td style={{ color: '#9ca3af', fontSize: 12 }}>{new Date(m.date).toLocaleDateString()}</td>
                <td>{m.mealCount}</td>
                <td>{m.eggsCount}</td>
                <td>
                  {m.isPenalty ? (
                    <span style={{ background: '#7f1d1d', color: '#fca5a5', borderRadius: 20, padding: '2px 10px', fontSize: 11, fontWeight: 600 }}>
                      Penalty
                    </span>
                  ) : (
                    <span style={{ background: '#14532d', color: '#86efac', borderRadius: 20, padding: '2px 10px', fontSize: 11, fontWeight: 600 }}>
                      Regular
                    </span>
                  )}
                </td>
                <td>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {!m.isPenalty && (
                      <button
                        onClick={() => setEditMeal({ _id: m._id, mealCount: m.mealCount, eggsCount: m.eggsCount })}
                        style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                      >
                        <Pencil size={13} color="#6366f1" />
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteMeal(m._id)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                    >
                      <Trash2 size={13} color="#ef4444" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}