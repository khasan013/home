import { useState } from 'react';
import { Mail } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../api';

export default function OTPVerificationPage({ onVerified }) {
  const { pendingEmail, login } = useAuth();

  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resent, setResent] = useState(false);

  // ✅ fallback if email lost (refresh case)
  if (!pendingEmail) {
    return (
      <div className="auth-screen">
        <p>No email found. Please register again.</p>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // ✅ FIX: fetch already returns JSON
      const data = await authApi.verifyOtp({
        email: pendingEmail,
        otp,
      });

      // ✅ safety check
      if (!data || !data.token) {
        throw new Error('Invalid server response');
      }

      // ✅ login user
      login(data.user, data.token);

      // ✅ redirect to login
      if (onVerified) onVerified();

    } catch (err) {
      console.log(err);
      setError(err.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError('');

    try {
      await authApi.resendOtp({ email: pendingEmail });

      setResent(true);
      setTimeout(() => setResent(false), 4000);

    } catch (err) {
      setError(err.message || 'Resend failed');
    }
  };

  return (
    <div className="auth-screen">
      <div className="auth-wrap">
        <div className="auth-card">

          <div className="auth-icon">
            <Mail className="w-12 h-12 text-purple-400" />
          </div>

          <h1 className="auth-title auth-title-center">Verify Email</h1>

          <p className="auth-subtitle auth-subtitle-center">
            We've sent a 6-digit code to{' '}
            <span className="auth-accent">
              {pendingEmail}
            </span>
          </p>

          <form onSubmit={handleSubmit} className="auth-form">

            <input
              type="text"
              maxLength="6"
              placeholder="000000"
              value={otp}
              onChange={(e) =>
                setOtp(e.target.value.replace(/\D/g, ''))
              }
              className="auth-input auth-otp"
              required
            />

            {error && (
              <div className="auth-alert auth-alert-error">
                {error}
              </div>
            )}

            {resent && (
              <div className="auth-alert auth-alert-success">
                ✅ New code sent!
              </div>
            )}

            <button
              type="submit"
              disabled={loading || otp.length !== 6}
              className="auth-primary"
            >
              {loading ? 'Verifying...' : 'Verify Email'}
            </button>

            <div className="auth-actions auth-actions-single">
              <button
                type="button"
                onClick={handleResend}
                className="auth-secondary auth-secondary-mint"
              >
                Resend
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
}
