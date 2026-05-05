import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../api';

export default function RegisterPage({ onRegistered, onGoLogin }) {
  const { setPendingEmail } = useAuth();

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      return setError('Passwords do not match');
    }

    setLoading(true);

    try {
      const res = await authApi.register({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
      });

      console.log("REGISTER RESPONSE:", res);

      // ✅ Save email for OTP page
      setPendingEmail(formData.email);

      // ✅ Use your routing system (NOT navigate)
      onRegistered && onRegistered(formData.email);

    } catch (err) {
      console.log(err);
      setError(err?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-screen">
      <div className="auth-wrap">
        <div className="auth-card">

          <h1 className="auth-title">MealMate</h1>
          <p className="auth-subtitle">Create your MealMate account</p>

          <form onSubmit={handleSubmit} className="auth-form">

            {/* Name Fields */}
            <div className="auth-grid">
              <input
                name="firstName"
                placeholder="First Name"
                value={formData.firstName}
                onChange={handleChange}
                required
                className="auth-input"
              />
              <input
                name="lastName"
                placeholder="Last Name"
                value={formData.lastName}
                onChange={handleChange}
                className="auth-input"
              />
            </div>

            {/* Email */}
            <input
              name="email"
              type="email"
              placeholder="Email Address"
              value={formData.email}
              onChange={handleChange}
              required
              className="auth-input"
            />

            {/* Password */}
            <input
              name="password"
              type="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              required
              className="auth-input"
            />

            {/* Confirm Password */}
            <input
              name="confirmPassword"
              type="password"
              placeholder="Confirm Password"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              className="auth-input"
            />

            {/* Error */}
            {error && (
              <div className="auth-alert auth-alert-error">
                {error}
              </div>
            )}

            {/* Button */}
            <button
              type="submit"
              disabled={loading}
              className="auth-primary"
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </button>

            {/* Login Link */}
            <div className="auth-actions auth-actions-single">
              <button
                type="button"
                onClick={onGoLogin}
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
