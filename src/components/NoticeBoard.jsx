import { useEffect, useMemo, useState } from 'react';
import { Plus, Trash2, X } from 'lucide-react';
import { noticeApi } from '../api';
import { useAuth } from '../context/AuthContext';
import { useHome } from '../context/HomeContext';

const REFRESH_MS = 30_000;

function userIdOf(value) {
  if (!value) return '';
  if (typeof value === 'string') return value;
  return value._id || value.id || '';
}

function formatDate(value) {
  if (!value) return '';
  return new Date(value).toLocaleString();
}

export default function NoticeBoard() {
  const { user } = useAuth();
  const { currentHome } = useHome();
  const homeId = currentHome?._id;
  const [notices, setNotices] = useState([]);
  const [activeTab, setActiveTab] = useState('general');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ title: '', message: '', category: 'general' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isAdmin = useMemo(() => {
    const myId = user?._id || user?.id || user?.userId;
    return currentHome?.members?.some(member =>
      userIdOf(member.user) === myId && member.role === 'admin'
    );
  }, [currentHome, user]);

  const loadNotices = async () => {
    if (!homeId) return;
    try {
      const data = await noticeApi.getAll(homeId);
      setNotices(data || []);
    } catch (err) {
      setError(err.message || 'Failed to load notices');
    }
  };

  useEffect(() => {
    loadNotices();
    const timer = setInterval(loadNotices, REFRESH_MS);
    return () => clearInterval(timer);
  }, [homeId]);

  const filtered = notices.filter(notice => notice.category === activeTab);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!homeId) return;
    setLoading(true);
    setError('');
    try {
      await noticeApi.create({ ...form, homeId });
      setForm({ title: '', message: '', category: activeTab });
      setShowModal(false);
      await loadNotices();
    } catch (err) {
      setError(err.message || 'Failed to create notice');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (noticeId) => {
    if (!confirm('Delete this notice?')) return;
    try {
      await noticeApi.remove(noticeId);
      await loadNotices();
    } catch (err) {
      setError(err.message || 'Failed to delete notice');
    }
  };

  return (
    <div className="relative space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-white">Notice Board</h2>
          <p className="text-sm text-gray-400">Latest notices appear first.</p>
        </div>
        <button
          onClick={() => {
            setForm(prev => ({ ...prev, category: activeTab }));
            setShowModal(true);
          }}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-purple-500 px-4 py-2 font-semibold text-white hover:bg-purple-600"
        >
          <Plus className="h-4 w-4" /> Add Notice
        </button>
      </div>

      <div className="inline-flex rounded-lg border border-white/10 bg-white/5 p-1">
        {['general', 'emergency'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`rounded-md px-4 py-2 text-sm font-semibold capitalize ${
              activeTab === tab ? 'bg-white/15 text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {error && <p className="rounded-lg border border-red-400/30 bg-red-500/10 p-3 text-sm text-red-200">{error}</p>}

      {filtered.length === 0 ? (
        <div className="rounded-lg border border-white/10 bg-white/5 p-10 text-center text-gray-400">
          No {activeTab} notices yet.
        </div>
      ) : (
        <div className="grid gap-4">
          {filtered.map(notice => (
            <article key={notice._id} className="rounded-lg border border-white/10 bg-slate-900/70 p-5 shadow-xl">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <h3 className="text-lg font-bold text-white">{notice.title}</h3>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-gray-300">{notice.message}</p>
                </div>
                {isAdmin && (
                  <button
                    onClick={() => handleDelete(notice._id)}
                    className="rounded-lg p-2 text-red-300 hover:bg-red-500/15"
                    title="Delete notice"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
              <div className="mt-4 flex flex-wrap gap-3 text-xs text-gray-500">
                <span>Posted by {notice.postedByName || 'Unknown'}</span>
                <span>{formatDate(notice.createdAt)}</span>
              </div>
            </article>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4">
          <form onSubmit={handleSubmit} className="w-full max-w-lg rounded-lg border border-white/10 bg-slate-900 p-5 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-xl font-bold text-white">Add Notice</h3>
              <button type="button" onClick={() => setShowModal(false)} className="rounded-lg p-2 text-gray-400 hover:bg-white/10">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4">
              <input
                value={form.title}
                onChange={event => setForm(prev => ({ ...prev, title: event.target.value }))}
                required
                maxLength={120}
                placeholder="Title"
                className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-purple-400"
              />
              <textarea
                value={form.message}
                onChange={event => setForm(prev => ({ ...prev, message: event.target.value }))}
                required
                maxLength={2000}
                rows={5}
                placeholder="Message"
                className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-purple-400"
              />
              <select
                value={form.category}
                onChange={event => setForm(prev => ({ ...prev, category: event.target.value }))}
                className="w-full rounded-lg border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-purple-400"
              >
                <option value="general">General</option>
                <option value="emergency">Emergency</option>
              </select>
              <button disabled={loading} className="w-full rounded-lg bg-purple-500 px-4 py-3 font-bold text-white hover:bg-purple-600 disabled:opacity-60">
                {loading ? 'Saving...' : 'Save Notice'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
