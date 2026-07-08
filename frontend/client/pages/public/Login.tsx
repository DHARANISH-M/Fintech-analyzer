import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';
import Loader from '@/components/Loader';

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || 'Login failed.');
      }

      localStorage.setItem('auth_token', data.token);
      localStorage.setItem('user_name', data.user?.name || 'User');
      localStorage.setItem('user_username', data.user?.username || '');
      localStorage.setItem('user_email', data.user?.email || '');
      localStorage.setItem('user_phone', data.user?.phone || '');
      localStorage.setItem('user_currency', data.user?.currency || '₹');
      navigate('/enhanced/dashboard');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to login.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-card-foreground p-4 md:p-8 flex items-center justify-center font-sans relative">
      {loading && (
        <div className="fixed inset-0 bg-background/70 backdrop-blur-sm z-50 flex flex-col items-center justify-center">
          <Loader size="lg" />
          <p className="text-xs uppercase font-bold tracking-wider text-muted-foreground mt-4 animate-pulse">
            Signing you in...
          </p>
        </div>
      )}
      <div className="max-w-[1000px] w-full min-h-[580px] overflow-hidden border border-border bg-card grid md:grid-cols-2 shadow-none rounded-lg">
        
        {/* Left Form Panel (Pure White) */}
        <section className="p-8 md:p-12 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <Link to="/enhanced" className="flex items-center gap-2 hover:opacity-85 transition-opacity">
              <span className="w-2.5 h-2.5 bg-primary rounded-full" />
              <span className="font-heading text-lg font-normal text-foreground tracking-tight">LedgerLens</span>
            </Link>
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
            className="w-full max-w-sm my-auto pt-6 pb-6"
          >
            <h1 className="text-3xl font-heading font-normal text-foreground">Welcome back</h1>
            <p className="text-xs text-muted-foreground mt-1.5 font-light">Sign in with your workspace credentials.</p>

            <form onSubmit={handleLogin} className="mt-8 space-y-5">
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                     type="email"
                     required
                     value={email}
                     onChange={(e) => setEmail(e.target.value)}
                     placeholder="name@company.com"
                     className="cursor-input pl-10"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Password</label>
                  <button type="button" className="text-xs font-semibold text-primary hover:underline">Forgot?</button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    className="cursor-input pl-10 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="cursor-btn-primary w-full flex items-center justify-center gap-2"
              >
                {loading ? 'Signing in...' : <><span>Sign in</span><ArrowRight className="w-4 h-4" /></>}
              </button>

              {error && <p className="text-xs font-bold text-destructive pt-1 uppercase tracking-wide">{error}</p>}
            </form>

            <p className="mt-6 text-xs text-muted-foreground font-light">
              New to LedgerLens?{' '}
              <Link to="/enhanced/signup" className="font-semibold text-primary hover:underline ml-1">
                Create workspace →
              </Link>
            </p>
          </motion.div>

          <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-light">
            © {new Date().getFullYear()} LedgerLens. Secure browser-local parsing.
          </div>
        </section>

        {/* Right Product Spotlight Panel (Cursor style pane) */}
        <aside className="relative hidden md:block bg-sub-card text-foreground border-l border-border">
          <div className="h-full p-12 flex flex-col justify-between">
            <div className="max-w-xs pt-12 space-y-6">
              <p className="text-[10px] uppercase font-bold tracking-wider text-primary">spotlight features</p>
              <h2 className="text-3xl font-heading font-normal text-foreground tracking-tight leading-tight">
                Read less. Know more.
              </h2>
              <p className="text-card-foreground text-xs leading-relaxed font-light">
                Log in to index statement PDFs, clean UPI logs, inspect anomalies, and export formatted reports completely inside client sandbox memory.
              </p>
              <div className="flex items-center gap-2 pt-2">
                <span className="timeline-pill-thinking">Thinking</span>
                <span className="text-[10px] text-muted-foreground font-mono">local database ready</span>
              </div>
            </div>

            <div className="w-12 h-1 bg-border" />
          </div>
        </aside>
      </div>
    </div>
  );
}
