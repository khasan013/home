import { useState } from 'react';
import { authApi } from '../api';

export default function ForgotPasswordPage({ onNext, onBack }) {
  const [email, setEmail] = useState('');
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMsg('');
    setLoading(true);

    try {
      await authApi.forgotPassword({ email });
      setMsg('OTP sent to your email');

      onNext(email);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-screen">
      <div className="auth-wrap">
        <div className="auth-card">

          <h1 className="auth-title">MealMate</h1>
          <p className="auth-subtitle">Enter your email to receive OTP</p>

          <form onSubmit={handleSubmit} className="auth-form">

            <input
              type="email"
              placeholder="Email Address"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="auth-input"
              required
            />

            {msg && (
              <div className="auth-alert auth-alert-success">
                {msg}
              </div>
            )}

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
              {loading ? 'Sending...' : 'Send OTP'}
            </button>

            {/* 🔙 Back to login */}
            <div className="auth-actions auth-actions-single">
              <button
                type="button"
                onClick={onBack}
                className="auth-secondary auth-secondary-mint"
              >
                Login
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
}
