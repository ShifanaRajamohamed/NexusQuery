import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Sparkles, Mail, Lock, User, Briefcase, Users, AlertTriangle } from 'lucide-react';

export const Register: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  // Form inputs
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Employee');
  const [department, setDepartment] = useState('Engineering');
  
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await register(username, email, role, department, password);
      // Automatically redirect to login after successful register
      navigate('/login');
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-dark text-slate-100 p-4 relative overflow-hidden">
      {/* Glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-primary/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-brand-accent/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md bg-bg-card border border-bg-border shadow-2xl rounded-2xl p-8 relative z-10">
        
        {/* Brand Header */}
        <div className="flex flex-col items-center gap-2 mb-6 text-center">
          <div className="w-12 h-12 rounded-xl bg-brand-primary flex items-center justify-center text-white shadow-lg shadow-brand-primary/20">
            <Sparkles className="w-6 h-6 text-indigo-100" />
          </div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight mt-2">Create Account</h2>
          <p className="text-slate-400 text-xs">Join NexusQuery AI Knowledge Network</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-950/20 border border-red-500/30 rounded-xl text-red-400 text-xs flex gap-2 items-start">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Username</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                required
                placeholder="john_doe"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-bg-hover border border-bg-border focus:border-brand-primary/80 focus:ring-1 focus:ring-brand-primary outline-none py-2 px-10 rounded-xl text-sm transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="email"
                required
                placeholder="john@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-bg-hover border border-bg-border focus:border-brand-primary/80 focus:ring-1 focus:ring-brand-primary outline-none py-2 px-10 rounded-xl text-sm transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="password"
                required
                placeholder="Minimum 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-bg-hover border border-bg-border focus:border-brand-primary/80 focus:ring-1 focus:ring-brand-primary outline-none py-2 px-10 rounded-xl text-sm transition-all"
              />
            </div>
          </div>

          {/* Department selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Department</label>
            <div className="relative">
              <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full bg-bg-hover border border-bg-border focus:border-brand-primary/80 focus:ring-1 focus:ring-brand-primary outline-none py-2 pl-10 pr-4 rounded-xl text-sm appearance-none cursor-pointer text-slate-200"
              >
                <option value="Engineering">Engineering</option>
                <option value="HR">HR</option>
                <option value="Finance">Finance</option>
                <option value="Operations">Operations</option>
              </select>
            </div>
          </div>

          {/* Role selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Organizational Role</label>
            <div className="relative">
              <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full bg-bg-hover border border-bg-border focus:border-brand-primary/80 focus:ring-1 focus:ring-brand-primary outline-none py-2 pl-10 pr-4 rounded-xl text-sm appearance-none cursor-pointer text-slate-200"
              >
                <option value="Employee">Employee</option>
                <option value="Team Lead">Team Lead</option>
                <option value="Admin">Admin</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-4 py-2.5 bg-brand-primary hover:bg-brand-primaryHover disabled:bg-brand-primary/50 text-white rounded-xl text-sm font-semibold shadow-md shadow-brand-primary/10 transition-colors"
          >
            {loading ? 'CREATING ACCOUNT...' : 'REGISTER'}
          </button>

          <p className="text-center text-xs text-slate-400 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-brand-primary hover:text-brand-primaryHover">
              Sign In
            </Link>
          </p>
        </form>

      </div>
    </div>
  );
};
