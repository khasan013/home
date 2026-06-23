import { useState } from 'react';
import { PlusCircle, Save, Trash2, X } from 'lucide-react';
import { useHome } from '../context/HomeContext';
import { expenseApi } from '../api';

const CATEGORIES = ['Grocery', 'Egg', 'SharedBill'];
const CATEGORY_LABELS = {
  Grocery: 'Grocery',
  Egg: 'Egg',
  SharedBill: 'Shared Bill',
  WaterSupply: 'Water Supply',
};

const isFiniteNumber = (value) => Number.isFinite(Number(value));
const money = (value) => `Tk ${Number(value || 0).toFixed(2)}`;

export default function ExpenseTracker() {
  const { currentHome, expenses, setExpenses } = useHome();
  const homeId = currentHome?._id;

  const [form, setForm] = useState({
    title: '',
    amount: '',
    category: 'Grocery',
    eggQty: '',
  });
  const [editBill, setEditBill] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const inp = {
    background: '#1e293b',
    border: '1px solid #334155',
    borderRadius: 8,
    color: '#f1f5f9',
    padding: '10px 12px',
    fontSize: 14,
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box',
  };

  const handleAdd = async (event) => {
    event.preventDefault();
    setErr('');

    if (!form.title.trim() || !form.amount) return setErr('Title and amount are required.');
    if (!isFiniteNumber(form.amount) || Number(form.amount) <= 0) return setErr('Amount must be greater than 0.');
    if (form.category === 'Egg' && (!form.eggQty || !isFiniteNumber(form.eggQty) || Number(form.eggQty) < 1)) {
      return setErr('Please enter egg quantity.');
    }

    setBusy(true);
    try {
      const payload = {
        title: form.title.trim(),
        amount: Number(form.amount),
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

  const handleUpdateBill = async (event) => {
    event.preventDefault();
    setErr('');

    if (!editBill?.title?.trim() || !editBill?.amount) return setErr('Bill title and amount are required.');
    if (!isFiniteNumber(editBill.amount) || Number(editBill.amount) <= 0) return setErr('Bill amount must be greater than 0.');

    setBusy(true);
    try {
      const updated = await expenseApi.update(homeId, editBill._id, {
        title: editBill.title.trim(),
        amount: Number(editBill.amount),
        category: 'SharedBill',
      });
      setExpenses(prev => prev.map(exp => exp._id === updated._id ? updated : exp));
      setEditBill(null);
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

  const groceryTotal = expenses.filter(e => e.category === 'Grocery').reduce((s, e) => s + Number(e.amount || 0), 0);
  const eggTotal = expenses.filter(e => e.category === 'Egg').reduce((s, e) => s + Number(e.amount || 0), 0);
  const eggQtyTotal = expenses.filter(e => e.category === 'Egg').reduce((s, e) => s + Number(e.eggQty || 0), 0);
  const sharedBills = expenses.filter(e => e.category === 'SharedBill');
  const sharedBillTotal = sharedBills.reduce((s, e) => s + Number(e.amount || 0), 0);
  const waterTotal = expenses.filter(e => e.category === 'WaterSupply').reduce((s, e) => s + Number(e.amount || 0), 0);

  return (
    <div style={{ color: '#f1f5f9' }}>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
        {[
          { label: 'Grocery Total', value: money(groceryTotal), color: '#6366f1' },
          { label: 'Egg Total', value: money(eggTotal), color: '#f59e0b' },
          { label: 'Eggs Bought', value: `${eggQtyTotal} pcs`, color: '#ec4899' },
          { label: 'Shared Bills', value: money(sharedBillTotal), color: '#22c55e' },
          { label: 'Water Supply', value: money(waterTotal), color: '#38bdf8' },
        ].map(({ label, value, color }) => (
          <div key={label} style={{
            background: 'linear-gradient(145deg, rgba(15,29,51,0.82), rgba(9,21,38,0.94))',
            border: `1.5px solid ${color}80`,
            borderRadius: 24,
            padding: '14px 20px',
            minWidth: 150,
            flex: '1 1 160px',
            boxShadow: '0 18px 42px rgba(0,0,0,0.22)',
          }}>
            <div style={{ color: '#9ca3af', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 }}>{label}</div>
            <div style={{ color, fontSize: 22, fontWeight: 800, marginTop: 4 }}>{value}</div>
          </div>
        ))}
      </div>

      <div style={{
        background: 'linear-gradient(145deg, rgba(15,29,51,0.82), rgba(9,21,38,0.94))',
        borderRadius: 28,
        padding: 20,
        border: '1.5px solid rgba(61,91,134,0.78)',
        marginBottom: 20,
        boxShadow: '0 22px 52px rgba(0,0,0,0.24)',
      }}>
        <h3 style={{ margin: '0 0 14px', fontSize: 15, fontWeight: 700, color: '#f8fafc' }}>
          Add Expense
        </h3>
        {err && <p style={{ color: '#f87171', fontSize: 13, marginBottom: 10 }}>{err}</p>}
        <form onSubmit={handleAdd} style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(180px, 100%), 1fr))',
          gap: 10,
        }}>
          <div>
            <label style={{ display: 'block', color: '#9ca3af', fontSize: 12, marginBottom: 4 }}>Title</label>
            <input
              style={inp}
              placeholder={form.category === 'SharedBill' ? 'e.g. Internet bill' : 'e.g. Rice, Eggs'}
              value={form.title}
              onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
            />
          </div>
          <div>
            <label style={{ display: 'block', color: '#9ca3af', fontSize: 12, marginBottom: 4 }}>Category</label>
            <select
              style={{ ...inp, cursor: 'pointer' }}
              value={form.category}
              onChange={e => setForm(p => ({ ...p, category: e.target.value, eggQty: '' }))}
            >
              {CATEGORIES.map(category => (
                <option key={category} value={category} style={{ background: '#1f2937' }}>
                  {CATEGORY_LABELS[category]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', color: '#9ca3af', fontSize: 12, marginBottom: 4 }}>Amount (Tk)</label>
            <input
              style={inp}
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={form.amount}
              onChange={e => {
                const value = e.target.value;
                if (value === '' || Number(value) >= 0) setForm(p => ({ ...p, amount: value }));
              }}
            />
          </div>
          {form.category === 'Egg' && (
            <div>
              <label style={{ display: 'block', color: '#f59e0b', fontSize: 12, marginBottom: 4 }}>
                Egg Quantity (pcs)
              </label>
              <input
                style={{ ...inp, borderColor: '#f59e0b80' }}
                type="number"
                min="1"
                placeholder="e.g. 30"
                value={form.eggQty}
                onChange={e => {
                  const value = e.target.value;
                  if (value === '' || Number(value) >= 0) setForm(p => ({ ...p, eggQty: value }));
                }}
              />
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <button
              type="submit"
              disabled={busy}
              style={{
                background: '#6366f1',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                padding: '10px 18px',
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                width: '100%',
                justifyContent: 'center',
                opacity: busy ? 0.7 : 1,
              }}
            >
              <PlusCircle size={14} /> Add
            </button>
          </div>
        </form>
      </div>

      <div style={{
        background: 'linear-gradient(145deg, rgba(15,29,51,0.82), rgba(9,21,38,0.94))',
        borderRadius: 28,
        padding: 20,
        border: '1.5px solid rgba(34,197,94,0.55)',
        marginBottom: 20,
        boxShadow: '0 22px 52px rgba(0,0,0,0.24)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', marginBottom: 14 }}>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#f8fafc' }}>Shared Bills</h3>
          <span style={{ color: '#22c55e', fontWeight: 800 }}>{money(sharedBillTotal)}</span>
        </div>
        {sharedBills.length === 0 ? (
          <p style={{ color: '#6b7280', margin: 0 }}>No shared bills yet.</p>
        ) : (
          <div style={{ display: 'grid', gap: 10 }}>
            {sharedBills.map(bill => (
              editBill?._id === bill._id ? (
                <form key={bill._id} onSubmit={handleUpdateBill} style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(min(180px, 100%), 1fr)) auto',
                  gap: 10,
                  alignItems: 'end',
                }}>
                  <input style={inp} value={editBill.title} onChange={e => setEditBill(prev => ({ ...prev, title: e.target.value }))} />
                  <input style={inp} type="number" min="0" step="0.01" value={editBill.amount} onChange={e => setEditBill(prev => ({ ...prev, amount: e.target.value }))} />
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button type="submit" disabled={busy} style={{ ...inp, width: 42, padding: 10, cursor: 'pointer', display: 'grid', placeItems: 'center' }} title="Save bill">
                      <Save size={15} />
                    </button>
                    <button type="button" onClick={() => setEditBill(null)} style={{ ...inp, width: 42, padding: 10, cursor: 'pointer', display: 'grid', placeItems: 'center' }} title="Cancel">
                      <X size={15} />
                    </button>
                  </div>
                </form>
              ) : (
                <div key={bill._id} style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                  padding: '12px 14px',
                  border: '1px solid #1f2937',
                  borderRadius: 10,
                  background: '#0f172a',
                }}>
                  <div>
                    <div style={{ color: '#f8fafc', fontWeight: 700 }}>{bill.title}</div>
                    <div style={{ color: '#64748b', fontSize: 12 }}>{new Date(bill.createdAt).toLocaleDateString()} | Split equally</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ color: '#22c55e', fontWeight: 800 }}>{money(bill.amount)}</span>
                    <button onClick={() => setEditBill({ ...bill, amount: String(bill.amount || '') })} style={{ ...inp, width: 54, padding: 10, cursor: 'pointer' }}>
                      Edit
                    </button>
                  </div>
                </div>
              )
            ))}
          </div>
        )}
      </div>

      <div style={{
        background: 'rgba(9,21,38,0.88)',
        borderRadius: 28,
        border: '1.5px solid rgba(61,91,134,0.78)',
        overflow: 'hidden',
        boxShadow: '0 22px 52px rgba(0,0,0,0.24)',
      }}>
        <div style={{
          borderLeft: '4px solid #6366f1',
          padding: '12px 20px',
          background: '#0f172a',
          fontWeight: 700,
          fontSize: 14,
          color: '#f1f5f9',
        }}>
          Expense Log
        </div>
        {expenses.length === 0 ? (
          <p style={{ color: '#6b7280', textAlign: 'center', padding: 40 }}>No expenses yet.</p>
        ) : (
          <div style={{ overflowX: 'auto' }} className="premium-scroll">
            <table style={{ borderCollapse: 'collapse', width: '100%', minWidth: 680, fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #1f2937' }}>
                  {['Title', 'Category', 'Amount', 'Eggs', 'Date', ''].map(h => (
                    <th key={h} style={{
                      padding: '10px 14px',
                      textAlign: 'left',
                      color: '#9ca3af',
                      fontWeight: 600,
                      fontSize: 11,
                      textTransform: 'uppercase',
                      letterSpacing: '.5px',
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
                        background: exp.category === 'Egg' ? '#78350f40' : ['SharedBill', 'WaterSupply'].includes(exp.category) ? '#14532d40' : '#1e1b4b40',
                        color: exp.category === 'Egg' ? '#fbbf24' : ['SharedBill', 'WaterSupply'].includes(exp.category) ? '#86efac' : '#a5b4fc',
                        borderRadius: 20,
                        padding: '2px 10px',
                        fontSize: 11,
                        fontWeight: 600,
                      }}>
                        {CATEGORY_LABELS[exp.category] || exp.category}
                      </span>
                    </td>
                    <td style={{ padding: '10px 14px', color: '#34d399', fontWeight: 700 }}>{money(exp.amount)}</td>
                    <td style={{ padding: '10px 14px', color: '#fbbf24' }}>{exp.eggQty ? `${exp.eggQty} pcs` : '-'}</td>
                    <td style={{ padding: '10px 14px', color: '#6b7280', fontSize: 12 }}>{new Date(exp.createdAt).toLocaleDateString()}</td>
                    <td style={{ padding: '10px 14px' }}>
                      <button onClick={() => handleDelete(exp._id)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                        <Trash2 size={13} color="#ef4444" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
