'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import './loginPage.css';

export default function LoginPage() {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const router = useRouter();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) return setError(data.error || 'Login failed');
      localStorage.setItem('token', data.data.token);
      router.push('/dashboard');
    } catch {
      setError('Network error — please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="lp-root">
      {/* Grid texture */}
      <div className="lp-grid" aria-hidden="true" />

      <div className="lp-card">
        {/* Brand */}
        <div className="lp-wordmark">Feed<span>Pulse</span></div>

        {/* Heading */}
        <h1 className="lp-heading">Welcome back</h1>
        <p className="lp-sub">Sign in to access your dashboard</p>

        {/* Error */}
        {error && <div className="lp-error" role="alert">{error}</div>}

        {/* Form */}
        <form className="lp-form" onSubmit={handleLogin} noValidate>

          {/* Email */}
          <div className="lp-field">
            <label htmlFor="email" className="lp-label">Email</label>
            <div className="lp-input-wrap">
              <input
                id="email"
                className="lp-input"
                type="email"
                placeholder="admin@feedpulse.com"
                autoComplete="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
              <span className="lp-input-icon" aria-hidden="true">✉</span>
            </div>
          </div>

          {/* Password */}
          <div className="lp-field">
            <label htmlFor="password" className="lp-label">Password</label>
            <div className="lp-input-wrap">
              <input
                id="password"
                className="lp-input"
                type="password"
                placeholder="••••••••"
                autoComplete="current-password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
              <span className="lp-input-icon" aria-hidden="true">⚿</span>
            </div>
          </div>

          {/* Submit */}
          <button type="submit" className="lp-btn" disabled={loading}>
            {loading && <span className="lp-spinner" aria-hidden="true" />}
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="lp-footer">FeedPulse · Admin Portal</p>
      </div>
    </main>
  );
}