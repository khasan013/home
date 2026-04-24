import { useState } from 'react';
import { authApi } from '../api';

export default function ForgotPasswordPage({ onNext }) {
  const [email, setEmail] = useState('');
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      await authApi.forgotPassword({ email });
      setMsg('OTP sent to your email');

      onNext(email); // go to reset page

    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="center">
      <form onSubmit={handleSubmit}>
        <h2>Forgot Password</h2>

        <input
          type="email"
          placeholder="Enter email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />

        {msg && <p className="text-green-400">{msg}</p>}
        {error && <p className="text-red-400">{error}</p>}

        <button type="submit">Send OTP</button>
      </form>
    </div>
  );
}