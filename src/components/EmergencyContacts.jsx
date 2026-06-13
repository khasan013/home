import { useCallback, useEffect, useMemo, useState } from 'react';
import { Phone, Save } from 'lucide-react';
import { emergencyContactApi } from '../api';
import { useAuth } from '../context/AuthContext';
import { useHome } from '../context/HomeContext';

function userIdOf(value) {
  if (!value) return '';
  if (typeof value === 'string') return value;
  return value._id || value.id || '';
}

const emptyContacts = {
  caretakerName: '',
  caretakerPhone: '',
  gasProviderName: '',
  gasProviderPhone: '',
};

function ContactCard({ title, nameKey, phoneKey, contacts, isAdmin, updateField }) {
  return (
    <div className="rounded-lg border border-white/10 bg-slate-900/70 p-5">
      <h3 className="text-lg font-bold text-white">{title}</h3>
      {isAdmin ? (
        <div className="mt-4 space-y-3">
          <input
            value={contacts[nameKey] || ''}
            onChange={event => updateField(nameKey, event.target.value)}
            placeholder="Name"
            className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-emerald-400"
          />
          <input
            value={contacts[phoneKey] || ''}
            onChange={event => updateField(phoneKey, event.target.value)}
            placeholder="Phone Number"
            className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-emerald-400"
          />
        </div>
      ) : (
        <div className="mt-4 space-y-2">
          <p className="text-xl font-semibold text-white">{contacts[nameKey] || 'Not set'}</p>
          <p className="text-gray-400">{contacts[phoneKey] || 'No phone number'}</p>
        </div>
      )}
      <a
        href={contacts[phoneKey] ? `tel:${contacts[phoneKey]}` : undefined}
        className={`mt-5 inline-flex items-center gap-2 rounded-lg px-4 py-2 font-semibold ${
          contacts[phoneKey]
            ? 'bg-emerald-500 text-white hover:bg-emerald-600'
            : 'pointer-events-none bg-white/10 text-gray-500'
        }`}
      >
        <Phone className="h-4 w-4" /> Call
      </a>
    </div>
  );
}

export default function EmergencyContacts() {
  const { user } = useAuth();
  const { currentHome } = useHome();
  const homeId = currentHome?._id;
  const [contacts, setContacts] = useState(emptyContacts);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const isAdmin = useMemo(() => {
    const myId = user?._id || user?.id || user?.userId;
    return currentHome?.members?.some(member =>
      userIdOf(member.user) === myId && member.role === 'admin'
    );
  }, [currentHome, user]);

  const loadContacts = useCallback(async () => {
    if (!homeId) return;
    const data = await emergencyContactApi.get(homeId);
    setContacts({ ...emptyContacts, ...(data || {}) });
  }, [homeId]);

  useEffect(() => {
    Promise.resolve()
      .then(loadContacts)
      .catch(err => setMessage(err.message || 'Failed to load contacts'));
  }, [loadContacts]);

  const updateField = (key, value) => {
    setContacts(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async (event) => {
    event.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      const saved = await emergencyContactApi.update(homeId, contacts);
      setContacts({ ...emptyContacts, ...(saved || {}) });
      setMessage('Contacts updated');
    } catch (err) {
      setMessage(err.message || 'Failed to update contacts');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold text-white">Emergency Contacts</h2>
        <p className="text-sm text-gray-400">Caretaker and gas service contacts for this home.</p>
      </div>

      <form onSubmit={handleSave} className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <ContactCard
            title="Caretaker"
            nameKey="caretakerName"
            phoneKey="caretakerPhone"
            contacts={contacts}
            isAdmin={isAdmin}
            updateField={updateField}
          />
          <ContactCard
            title="Gas Service"
            nameKey="gasProviderName"
            phoneKey="gasProviderPhone"
            contacts={contacts}
            isAdmin={isAdmin}
            updateField={updateField}
          />
        </div>

        {isAdmin && (
          <button
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-3 font-bold text-white hover:bg-emerald-600 disabled:opacity-60"
          >
            <Save className="h-4 w-4" /> {loading ? 'Saving...' : 'Save Contacts'}
          </button>
        )}
      </form>

      {message && <p className="text-sm text-gray-300">{message}</p>}
    </div>
  );
}
