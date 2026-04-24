import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../api';

export default function RegisterPage() {
  const navigate = useNavigate();
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

      // ✅ REDIRECT TO OTP PAGE
      navigate('/verify-otp', {
        state: { email: formData.email },
      });

    } catch (err) {
      console.log(err);
      setError(err?.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-2xl border border-white/20">

          <h1 className="text-3xl font-bold text-white mb-2">Meal Mate</h1>
          <p className="text-gray-300 mb-8">Fair meal expense sharing made simple</p>

          <form onSubmit={handleSubmit} className="space-y-4">

            <div className="grid grid-cols-2 gap-4">
              <input name="firstName" placeholder="First Name" onChange={handleChange} required className="input" />
              <input name="lastName" placeholder="Last Name" onChange={handleChange} className="input" />
            </div>

            <input name="email" type="email" placeholder="Email Address" onChange={handleChange} required className="input" />
            <input name="password" type="password" placeholder="Password" onChange={handleChange} required className="input" />
            <input name="confirmPassword" type="password" placeholder="Confirm Password" onChange={handleChange} required className="input" />

            {error && (
              <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200 text-sm">
                {error}
              </div>
            )}

            <button type="submit" disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg">
              {loading ? 'Creating...' : 'Create Account'}
            </button>

            <p className="text-center text-gray-400 text-sm">
              Already have an account?{' '}
              <span
                onClick={() => navigate('/login')}
                className="text-purple-400 cursor-pointer"
              >
                Login
              </span>
            </p>

          </form>
        </div>
      </div>
    </div>
  );
}