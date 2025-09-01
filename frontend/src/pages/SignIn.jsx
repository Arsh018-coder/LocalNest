import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import apiCall from '../utils/api';
import { useAuth } from '../contexts/AuthContext';

export default function SignIn() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Placeholder social login handlers; replace with real OAuth logic
  const handleGoogleLogin = () => {
    alert('Google login clicked');
  };

  const handleMicrosoftLogin = () => {
    alert('Microsoft login clicked');
  };

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const data = await apiCall('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      // Use auth context to login
      login(data.user, data.token);
      
      alert(`Welcome back, ${data.user.firstName}!`);
      
      // Redirect to dashboard
      navigate('/dashboard');
    } catch (error) {
      console.error('Login error:', error);
      setError(error.message || 'Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="min-h-screen flex items-center justify-center bg-dominant px-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
        <h2 className="text-3xl font-bold text-secondary mb-6 text-center">Sign In to LocalNest</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-secondary font-semibold mb-1">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-secondary rounded-lg text-secondary placeholder-secondary/70 focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-secondary font-semibold mb-1">
              Password
            </label>
            <input
              type="password"
              id="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-secondary rounded-lg text-secondary placeholder-secondary/70 focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent"
              placeholder="Enter your password"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-accent text-secondary font-semibold rounded-lg py-3 hover:bg-accent/90 transition disabled:opacity-50"
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        {/* Social login buttons */}
        <div className="mt-8">
          <p className="text-center text-secondary font-semibold mb-4">Or sign in with</p>
          <div className="flex flex-col gap-4">
            <button
              onClick={handleGoogleLogin}
              className="flex items-center justify-center gap-3 border border-secondary rounded-lg py-3 font-semibold text-secondary hover:bg-[#C7E94B] transition"
            >
              <img src="https://www.google.com/images/branding/googleg/2x/googleg_standard_color_92dp.png"
                alt="Google logo"
                className="w-6 h-6"
                />
                Continue with Google
            </button>

            <button
              onClick={handleMicrosoftLogin}
              className="flex items-center justify-center gap-3 border border-secondary rounded-lg py-3 font-semibold text-secondary hover:bg-[#C7E94B] transition"
            >
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/4/44/Microsoft_logo.svg"
                alt="Microsoft logo"
                className="w-6 h-6"
              />
              Continue with Microsoft
            </button>
          </div>
        </div>

        {/* Register link */}
        <div className="mt-6 text-center">
          <p className="text-secondary">
            Don't have an account?{' '}
            <Link to="/register" className="text-accent hover:underline font-semibold">
              Sign up here
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}

