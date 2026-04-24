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
      <div className="min-h-screen flex items-center justify-center text-white">
        <p>No email found. Please register again.</p>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await authApi.verifyOtp({
        email: pendingEmail,
        otp,
      });

      // ✅ FIX: axios response
      const data = res.data;

      login(data.user, data.token);

      // ✅ safe call
      if (onVerified) onVerified();

    } catch (err) {
      console.log(err);
      setError(
        err?.response?.data?.message || err.message || 'Verification failed'
      );
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
      setError(
        err?.response?.data?.message || err.message || 'Resend failed'
      );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-2xl border border-white/20">

          <div className="flex justify-center mb-4">
            <Mail className="w-12 h-12 text-purple-400" />
          </div>

          <h1 className="text-2xl font-bold text-white mb-2 text-center">
            Verify Your Email
          </h1>

          <p className="text-gray-300 mb-8 text-center">
            We've sent a 6-digit code to{' '}
            <span className="text-purple-400 font-semibold">
              {pendingEmail}
            </span>
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">

            <input
              type="text"
              maxLength="6"
              placeholder="000000"
              value={otp}
              onChange={(e) =>
                setOtp(e.target.value.replace(/\D/g, ''))
              }
              className="w-full text-center text-2xl tracking-widest px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-purple-500 transition font-mono"
              required
            />

            {error && (
              <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200 text-sm">
                {error}
              </div>
            )}

            {resent && (
              <div className="p-3 bg-green-500/20 border border-green-500/50 rounded-lg text-green-200 text-sm text-center">
                ✅ New code sent!
              </div>
            )}

            <button
              type="submit"
              disabled={loading || otp.length !== 6}
              className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-lg hover:from-purple-600 hover:to-pink-600 transition transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Verifying...' : 'Verify Email'}
            </button>

            <p className="text-center text-gray-400 text-sm">
              Didn't receive code?{' '}
              <button
                type="button"
                onClick={handleResend}
                className="text-purple-400 hover:text-purple-300"
              >
                Resend
              </button>
            </p>

          </form>
        </div>
      </div>
    </div>
  );
}