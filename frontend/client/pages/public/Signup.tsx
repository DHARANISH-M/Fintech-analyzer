import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';
import Loader from '@/components/Loader';
import { API_BASE_URL } from '@/lib/finance-api';

export default function Signup() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [strength, setStrength] = useState(0);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^a-zA-Z0-9]/.test(password)) score++;
    setStrength(score);
  }, [password]);

  const strengthLabels = ['Weak', 'Weak', 'Fair', 'Good', 'Strong'];
  const strengthColors = ['bg-destructive', 'bg-destructive', 'bg-amber-500', 'bg-sky-400', 'bg-success'];

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (strength < 3) {
      setError('Please choose a stronger password matching the rules.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Password and Confirm Password do not match.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: fullName,
          email,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || 'Signup failed.');
      }

      localStorage.setItem('user_name', fullName || 'User');
      localStorage.setItem('user_email', email);

      setSuccess('Account created successfully. Please sign in.');
      setTimeout(() => navigate('/enhanced/login'), 800);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to sign up.';
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
            Creating your workspace...
          </p>
        </div>
      )}
      <div className="max-w-[1000px] w-full min-h-[600px] overflow-hidden border border-border bg-card grid md:grid-cols-2 shadow-none rounded-lg">
        
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
            <h1 className="text-3xl font-heading font-normal text-foreground">Create workspace</h1>
            <p className="text-xs text-muted-foreground mt-1.5 font-light">Set up your secure, browser-local ledger database.</p>

            <form onSubmit={handleSignup} className="mt-8 space-y-4">
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Full name"
                  className="cursor-input pl-10"
                />
              </div>



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

              <div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Create password"
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

                {password.length > 0 && (
                  <div className="mt-2.5 p-3 border border-border bg-sub-card rounded-md">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">Strength</span>
                      <span className="text-xs font-semibold text-foreground">{strengthLabels[strength]}</span>
                    </div>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4].map((lvl) => (
                        <div
                          key={lvl}
                          className={`h-1 flex-1 rounded-sm ${strength >= lvl ? strengthColors[strength] : 'bg-border'}`}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm password"
                  className="cursor-input pl-10 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>



              <button
                type="submit"
                disabled={loading}
                className="cursor-btn-primary w-full flex items-center justify-center gap-2"
              >
                {loading ? 'Creating workspace...' : <><span>Create workspace</span><ArrowRight className="w-4 h-4" /></>}
              </button>

              {error && <p className="text-xs font-bold text-destructive pt-1 uppercase tracking-wide">{error}</p>}
              {success && <p className="text-xs font-bold text-success pt-1 uppercase tracking-wide">{success}</p>}
            </form>

            <p className="mt-5 text-xs text-muted-foreground font-light">
              Have a workspace?{' '}
              <Link to="/enhanced/login" className="font-semibold text-primary hover:underline ml-1">
                Sign in →
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
              <p className="text-[10px] uppercase font-bold tracking-wider text-primary">data privacy</p>
              <h2 className="text-3xl font-heading font-normal text-foreground tracking-tight leading-tight">
                Your data stays yours.
              </h2>
              <p className="text-card-foreground text-xs leading-relaxed font-light">
                All statement extractions and cash flow charts are processed locally inside client device memory. No data is stored on remote servers.
              </p>
              <div className="flex items-center gap-2 pt-2">
                <span className="timeline-pill-read">Reading</span>
                <span className="text-[10px] text-muted-foreground font-mono">browser storage sandbox</span>
              </div>
            </div>

            <div className="w-12 h-1 bg-border" />
          </div>
        </aside>
      </div>
    </div>
  );
}
