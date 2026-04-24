import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../api';

export default function LoginPage({ onGoRegister, onForgotPassword }) {
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await authApi.login({ email, password });

      // ✅ FIX: use backend user directly
      if (!data || !data.token) {
        throw new Error('Invalid server response');
      }

      login(data.user, data.token);

    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-2xl border border-white/20">

          <h1 className="text-3xl font-bold text-white mb-2">Welcome Back</h1>
          <p className="text-gray-300 mb-8">Login to your Meal Mate account</p>

          <form onSubmit={handleSubmit} className="space-y-4">

            <input
              type="email"
              placeholder="Email Address"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 transition"
              required
            />

            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 transition"
              required
            />

            {/* Forgot Password */}
            <div className="text-right -mt-2">
              <button
                type="button"
                onClick={() => onForgotPassword && onForgotPassword(email)}
                className="text-sm text-purple-400 hover:text-purple-300"
              >
                Forgot Password?
              </button>
            </div>

            {error && (
              <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-lg hover:from-purple-600 hover:to-pink-600 transition transform hover:scale-105 disabled:opacity-50"
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>

            {/* Register */}
            <p className="text-center text-gray-400 text-sm">
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => onGoRegister && onGoRegister()}
                className="text-purple-400 hover:text-purple-300"
              >
                Register
              </button>
            </p>

          </form>
        </div>
      </div>
    </div>
  );
}