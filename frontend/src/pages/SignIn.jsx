import React, { useState } from 'react';

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Placeholder social login handlers; replace with real OAuth logic
  const handleGoogleLogin = () => {
    alert('Google login clicked');
  };

  const handleMicrosoftLogin = () => {
    alert('Microsoft login clicked');
  };

  const handleSubmit = e => {
    e.preventDefault();
    alert(`Signing in with email: ${email}`);
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

          <button
            type="submit"
            className="w-full bg-accent text-secondary font-semibold rounded-lg py-3 hover:bg-accent/90 transition"
          >
            Sign In
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
      </div>
    </section>
  );
}

