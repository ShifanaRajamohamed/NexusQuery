import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Sparkles, Mail, Lock, Eye, EyeOff, AlertTriangle } from 'lucide-react';

export const Login: React.FC = () => {
  const { login, resetPassword } = useAuth();
  const navigate = useNavigate();

  // Form states
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Password reset state
  const [isResetMode, setIsResetMode] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login(usernameOrEmail, password);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Invalid username or password');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      await resetPassword(resetEmail, newPassword);
      setSuccessMsg('Password updated successfully. You can now login with your new password.');
      setIsResetMode(false);
    } catch (err: any) {
      setError(err.message || 'Password reset failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-dark text-slate-100 p-4 relative overflow-hidden">
      {/* Decorative background glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-primary/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-brand-accent/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md bg-bg-card border border-bg-border shadow-2xl rounded-2xl p-8 relative z-10">
        
        {/* Brand Header */}
        <div className="flex flex-col items-center gap-2 mb-8 text-center">
          <div className="w-12 h-12 rounded-xl bg-brand-primary flex items-center justify-center text-white shadow-lg shadow-brand-primary/20">
            <Sparkles className="w-6 h-6 text-indigo-100" />
          </div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight mt-2">NexusQuery AI</h2>
          <p className="text-slate-400 text-xs">Enterprise Knowledge Discovery Platform</p>
        </div>

        {error && (
          <div className="mb-5 p-3.5 bg-red-950/20 border border-red-500/30 rounded-xl text-red-400 text-xs flex gap-2.5 items-start">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <p>{error}</p>
          </div>
        )}

        {successMsg && (
          <div className="mb-5 p-3.5 bg-emerald-950/20 border border-emerald-500/30 rounded-xl text-emerald-400 text-xs flex gap-2.5 items-start">
            <p>{successMsg}</p>
          </div>
        )}

        {!isResetMode ? (
          /* Login Form */
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Username or Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  required
                  placeholder="Enter email or username"
                  value={usernameOrEmail}
                  onChange={(e) => setUsernameOrEmail(e.target.value)}
                  className="w-full bg-bg-hover border border-bg-border focus:border-brand-primary/80 focus:ring-1 focus:ring-brand-primary outline-none py-2.5 pl-10 pr-4 rounded-xl text-sm transition-all"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Password</label>
                <button
                  type="button"
                  onClick={() => setIsResetMode(true)}
                  className="text-xs font-semibold text-brand-primary hover:text-brand-primaryHover"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-bg-hover border border-bg-border focus:border-brand-primary/80 focus:ring-1 focus:ring-brand-primary outline-none py-2.5 pl-10 pr-10 rounded-xl text-sm transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-6 py-2.5 bg-brand-primary hover:bg-brand-primaryHover disabled:bg-brand-primary/50 text-white rounded-xl text-sm font-semibold shadow-md shadow-brand-primary/10 transition-colors"
            >
              {loading ? 'SIGNING IN...' : 'SIGN IN'}
            </button>

            <p className="text-center text-xs text-slate-400 mt-6">
              New to the platform?{' '}
              <Link to="/register" className="font-semibold text-brand-primary hover:text-brand-primaryHover">
                Create an account
              </Link>
            </p>
          </form>
        ) : (
          /* Password Reset Form */
          <form onSubmit={handleReset} className="space-y-4">
            <h3 className="font-bold text-white text-sm mb-2">Reset Password</h3>
            <p className="text-xs text-slate-400 mb-4">Enter your registered email and your desired new password.</p>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="email"
                  required
                  placeholder="your@company.com"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  className="w-full bg-bg-hover border border-bg-border focus:border-brand-primary/80 focus:ring-1 focus:ring-brand-primary outline-none py-2.5 pl-10 pr-4 rounded-xl text-sm transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">New Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="password"
                  required
                  placeholder="Minimum 6 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-bg-hover border border-bg-border focus:border-brand-primary/80 focus:ring-1 focus:ring-brand-primary outline-none py-2.5 pl-10 pr-4 rounded-xl text-sm transition-all"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={() => setIsResetMode(false)}
                className="flex-1 py-2.5 border border-bg-border hover:bg-bg-hover text-slate-300 rounded-xl text-sm font-semibold transition-colors"
              >
                CANCEL
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-2.5 bg-brand-primary hover:bg-brand-primaryHover disabled:bg-brand-primary/50 text-white rounded-xl text-sm font-semibold shadow-md shadow-brand-primary/10 transition-colors"
              >
                {loading ? 'RESETTING...' : 'RESET PASSWORD'}
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
};
