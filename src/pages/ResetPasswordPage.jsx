import { useState } from 'react';
import { authApi } from '../api';

export default function ResetPasswordPage({ email, onDone }) {
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      await authApi.resetPassword({
        email,
        otp,
        newPassword: password,
      });

      alert('Password reset successful');
      onDone();

    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="center">
      <form onSubmit={handleSubmit}>
        <h2>Reset Password</h2>

        <input
          placeholder="OTP"
          value={otp}
          onChange={e => setOtp(e.target.value)}
          required
        />

        <input
          type="password"
          placeholder="New Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
        />

        {error && <p className="text-red-400">{error}</p>}

        <button type="submit">Reset Password</button>
      </form>
    </div>
  );
}