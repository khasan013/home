import { useState } from 'react';
import { authApi } from '../api';

export default function ResetPasswordPage({ email, onDone }) {
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await authApi.resetPassword({
        email,
        otp,
        newPassword: password,
      });

      setSuccess('Password reset successful');

      setTimeout(() => {
        onDone(); // your original logic
      }, 1200);

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

          <h1 className="auth-title">
            Reset Password
          </h1>

          <p className="auth-subtitle">
            Enter OTP sent to{' '}
            <span className="auth-accent">{email}</span>
          </p>

          <form onSubmit={handleSubmit} className="auth-form">

            {/* OTP */}
            <input
              type="text"
              maxLength="6"
              placeholder="Enter OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
              className="auth-input auth-otp"
              required
            />

            {/* Password */}
            <input
              type="password"
              placeholder="New Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="auth-input"
              required
            />

            {/* Error */}
            {error && (
              <div className="auth-alert auth-alert-error">
                {error}
              </div>
            )}

            {/* Success */}
            {success && (
              <div className="auth-alert auth-alert-success">
                {success}
              </div>
            )}

            {/* Button */}
            <button
              type="submit"
              disabled={loading || otp.length !== 6}
              className="auth-primary"
            >
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>

          </form>
        </div>
      </div>
    </div>
  );
}
