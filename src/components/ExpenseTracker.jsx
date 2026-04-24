// src/components/ExpenseTracker.jsx
// Only two expense categories: Grocery and Egg.
// When "Egg" is selected the user also enters the egg quantity,
// which gets stored and later used to auto-fill the Admin bill form.

import { useState } from 'react';
import { Trash2, PlusCircle } from 'lucide-react';
import { useHome } from '../context/HomeContext';
import { expenseApi } from '../api';

const CATEGORIES = ['Grocery', 'Egg'];

export default function ExpenseTracker() {
  const { currentHome, expenses, setExpenses } = useHome();
  const homeId = currentHome?._id;

  const [form, setForm] = useState({
    title:    '',
    amount:   '',
    category: 'Grocery',
    eggQty:   '',          // only used when category === 'Egg'
  });
  const [busy, setBusy] = useState(false);
  const [err,  setErr]  = useState('');

  const handleAdd = async (e) => {
    e.preventDefault();
    setErr('');
    if (!form.title.trim() || !form.amount) return setErr('Title and amount are required.');
    if (form.category === 'Egg' && (!form.eggQty || Number(form.eggQty) < 1))
      return setErr('Please enter egg quantity.');

    setBusy(true);
    try {
      const payload = {
        title:    form.title.trim(),
        amount:   Number(form.amount),
        category: form.category,
        ...(form.category === 'Egg' ? { eggQty: Number(form.eggQty) } : {}),
      };
      const newExp = await expenseApi.add(homeId, payload);
      setExpenses(prev => [newExp, ...prev]);
      setForm({ title: '', amount: '', category: 'Grocery', eggQty: '' });
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (expId) => {
    if (!confirm('Delete this expense?')) return;
    try {
      await expenseApi.remove(homeId, expId);
      setExpenses(prev => prev.filter(e => e._id !== expId));
    } catch (e) {
      alert(e.message);
    }
  };

  // Totals
  const groceryTotal = expenses.filter(e => e.category === 'Grocery').reduce((s, e) => s + e.amount, 0);
  const eggTotal     = expenses.filter(e => e.category === 'Egg').reduce((s, e) => s + e.amount, 0);
  const eggQtyTotal  = expenses.filter(e => e.category === 'Egg').reduce((s, e) => s + (e.eggQty || 0), 0);

  const inp = {
    background: '#1e293b', border: '1px solid #334155', borderRadius: 8,
    color: '#f1f5f9', padding: '10px 12px', fontSize: 14, outline: 'none',
    width: '100%', boxSizing: 'border-box',
  };

  return (
    <div style={{ color: '#f1f5f9' }}>
      {/* Summary pills */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
        {[
          { label: 'Grocery Total', value: `৳${groceryTotal.toFixed(2)}`, color: '#6366f1' },
          { label: 'Egg Total',     value: `৳${eggTotal.toFixed(2)}`,     color: '#f59e0b' },
          { label: 'Eggs Bought',   value: `${eggQtyTotal} pcs`,          color: '#ec4899' },
        ].map(({ label, value, color }) => (
          <div key={label} style={{
            background: '#0f172a', border: `1px solid ${color}40`,
            borderRadius: 12, padding: '14px 20px', minWidth: 150,
          }}>
            <div style={{ color: '#6b7280', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 }}>{label}</div>
            <div style={{ color, fontSize: 22, fontWeight: 800, marginTop: 4 }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Add form */}
      <div style={{
        background: '#111827', borderRadius: 14, padding: 20,
        border: '1px solid #1f2937', marginBottom: 20,
      }}>
        <h3 style={{ margin: '0 0 14px', fontSize: 15, fontWeight: 700, color: '#f8fafc' }}>
          ➕ Add Expense
        </h3>
        {err && (
          <p style={{ color: '#f87171', fontSize: 13, marginBottom: 10 }}>{err}</p>
        )}
        <form onSubmit={handleAdd} style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
          gap: 10,
        }}>
          {/* Title */}
          <div>
            <label style={{ display: 'block', color: '#9ca3af', fontSize: 12, marginBottom: 4 }}>Title</label>
            <input
              style={inp} placeholder="e.g. Rice, Eggs…"
              value={form.title}
              onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
            />
          </div>

          {/* Category */}
          <div>
            <label style={{ display: 'block', color: '#9ca3af', fontSize: 12, marginBottom: 4 }}>Category</label>
            <select
              style={{ ...inp, cursor: 'pointer' }}
              value={form.category}
              onChange={e => setForm(p => ({ ...p, category: e.target.value, eggQty: '' }))}
            >
              {CATEGORIES.map(c => (
                <option key={c} value={c} style={{ background: '#1f2937' }}>{c}</option>
              ))}
            </select>
          </div>

          {/* Amount */}
          <div>
            <label style={{ display: 'block', color: '#9ca3af', fontSize: 12, marginBottom: 4 }}>Amount (৳)</label>
            <input
              style={inp} type="number" min="0" step="0.01" placeholder="0.00"
              value={form.amount}
              onChange={e => setForm(p => ({ ...p, amount: e.target.value }))}
            />
          </div>

          {/* Egg quantity — only shown for Egg category */}
          {form.category === 'Egg' && (
            <div>
              <label style={{ display: 'block', color: '#f59e0b', fontSize: 12, marginBottom: 4 }}>
                🥚 Egg Quantity (pcs)
              </label>
              <input
                style={{ ...inp, borderColor: '#f59e0b80' }}
                type="number" min="1" placeholder="e.g. 30"
                value={form.eggQty}
                onChange={e => setForm(p => ({ ...p, eggQty: e.target.value }))}
              />
            </div>
          )}

          {/* Submit */}
          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <button
              type="submit"
              disabled={busy}
              style={{
                background: '#6366f1', color: '#fff', border: 'none',
                borderRadius: 8, padding: '10px 18px', cursor: 'pointer',
                fontSize: 13, fontWeight: 600,
                display: 'flex', alignItems: 'center', gap: 6,
                width: '100%', justifyContent: 'center',
                opacity: busy ? 0.7 : 1,
              }}
            >
              <PlusCircle size={14} /> Add
            </button>
          </div>
        </form>
      </div>

      {/* Expense list */}
      <div style={{ background: '#111827', borderRadius: 14, border: '1px solid #1f2937', overflow: 'hidden' }}>
        <div style={{
          borderLeft: '4px solid #6366f1', padding: '12px 20px',
          background: '#0f172a', fontWeight: 700, fontSize: 14, color: '#f1f5f9',
        }}>
          Expense Log
        </div>
        {expenses.length === 0 ? (
          <p style={{ color: '#6b7280', textAlign: 'center', padding: 40 }}>No expenses yet.</p>
        ) : (
          <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #1f2937' }}>
                {['Title', 'Category', 'Amount', 'Eggs', 'Date', ''].map(h => (
                  <th key={h} style={{
                    padding: '10px 14px', textAlign: 'left',
                    color: '#9ca3af', fontWeight: 600, fontSize: 11,
                    textTransform: 'uppercase', letterSpacing: '.5px',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {expenses.map(exp => (
                <tr key={exp._id} style={{ borderBottom: '1px solid #1f293740' }}>
                  <td style={{ padding: '10px 14px', fontWeight: 500 }}>{exp.title}</td>
                  <td style={{ padding: '10px 14px' }}>
                    <span style={{
                      background: exp.category === 'Egg' ? '#78350f40' : '#1e1b4b40',
                      color:      exp.category === 'Egg' ? '#fbbf24'   : '#a5b4fc',
                      borderRadius: 20, padding: '2px 10px', fontSize: 11, fontWeight: 600,
                    }}>
                      {exp.category}
                    </span>
                  </td>
                  <td style={{ padding: '10px 14px', color: '#34d399', fontWeight: 700 }}>
                    ৳{exp.amount.toFixed(2)}
                  </td>
                  <td style={{ padding: '10px 14px', color: '#fbbf24' }}>
                    {exp.eggQty ? `${exp.eggQty} pcs` : '—'}
                  </td>
                  <td style={{ padding: '10px 14px', color: '#6b7280', fontSize: 12 }}>
                    {new Date(exp.createdAt).toLocaleDateString()}
                  </td>
                  <td style={{ padding: '10px 14px' }}>
                    <button
                      onClick={() => handleDelete(exp._id)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                    >
                      <Trash2 size={13} color="#ef4444" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );

  
}