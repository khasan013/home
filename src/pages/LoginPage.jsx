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
    <div className="auth-screen">
      <div className="auth-wrap">
        <div className="auth-card">

          <h1 className="auth-title">MealMate</h1>
          <p className="auth-subtitle">Welcome back to your meal dashboard</p>

          <form onSubmit={handleSubmit} className="auth-form">

            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="auth-input"
              required
            />

            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="auth-input"
              required
            />

            {error && (
              <div className="auth-alert auth-alert-error">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="auth-primary"
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>

            <div className="auth-actions">
              <button
                type="button"
                onClick={() => onGoRegister && onGoRegister()}
                className="auth-secondary auth-secondary-purple"
              >
                Register
              </button>
              <button
                type="button"
                onClick={() => onForgotPassword && onForgotPassword(email)}
                className="auth-secondary auth-secondary-mint"
              >
                Forgot Password
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
}
