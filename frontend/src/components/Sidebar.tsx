import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Home, 
  Database, 
  GitBranch, 
  BookOpen, 
  MessageSquare, 
  UploadCloud, 
  Rss, 
  BarChart2, 
  Settings, 
  Shield, 
  LogOut,
  Sparkles,
  TrendingUp,
  Bookmark
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { to: '/', icon: Home, label: 'Home' },
    { to: '/knowledge', icon: Database, label: 'Knowledge Hub' },
    { to: '/gitquery', icon: GitBranch, label: 'GitQuery' },
    { to: '/wikiquery', icon: BookOpen, label: 'WikiQuery' },
    { to: '/chat', icon: MessageSquare, label: 'AI Assistant' },
  ];

  const collabItems = [
    { to: '/contribute', icon: UploadCloud, label: 'Contribute' },
    { to: '/feed', icon: Rss, label: 'Feed' },
    { to: '/trending', icon: TrendingUp, label: 'Trending Posts' },
    { to: '/bookmarks', icon: Bookmark, label: 'Bookmarks' },
  ];

  const analyticsItems = [
    { to: '/analytics', icon: BarChart2, label: 'Dashboard' },
  ];

  return (
    <aside className="w-64 bg-bg-card border-r border-bg-border flex flex-col h-screen fixed left-0 top-0 text-slate-300 z-20">
      {/* Brand Logo header */}
      <div className="p-6 border-b border-bg-border flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-brand-primary flex items-center justify-center text-white shadow-md shadow-brand-primary/20">
          <Sparkles className="w-5 h-5 text-indigo-100" />
        </div>
        <div>
          <h1 className="font-bold text-white leading-tight tracking-tight">Nexus AI</h1>
          <span className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">Enterprise</span>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-7">
        {/* Core Sections */}
        <div>
          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-widest px-3 block mb-3">Core Workspace</span>
          <nav className="space-y-1">
            {navItems.map((item) => (
              <NavLink 
                key={item.to} 
                to={item.to} 
                className={({ isActive }) => 
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150 ${
                    isActive 
                      ? 'bg-brand-primary/10 text-white border-l-2 border-brand-primary font-medium' 
                      : 'text-slate-400 hover:text-slate-100 hover:bg-bg-hover/40 border-l-2 border-transparent'
                  }`
                }
              >
                <item.icon className="w-[18px] h-[18px]" />
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Collaboration */}
        <div>
          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-widest px-3 block mb-3">Collaborate</span>
          <nav className="space-y-1">
            {collabItems.map((item) => (
              <NavLink 
                key={item.to} 
                to={item.to} 
                className={({ isActive }) => 
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150 ${
                    isActive 
                      ? 'bg-brand-primary/10 text-white border-l-2 border-brand-primary font-medium' 
                      : 'text-slate-400 hover:text-slate-100 hover:bg-bg-hover/40 border-l-2 border-transparent'
                  }`
                }
              >
                <item.icon className="w-[18px] h-[18px]" />
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Analytics */}
        <div>
          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-widest px-3 block mb-3">Analytics</span>
          <nav className="space-y-1">
            {analyticsItems.map((item) => (
              <NavLink 
                key={item.to} 
                to={item.to} 
                className={({ isActive }) => 
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150 ${
                    isActive 
                      ? 'bg-brand-primary/10 text-white border-l-2 border-brand-primary font-medium' 
                      : 'text-slate-400 hover:text-slate-100 hover:bg-bg-hover/40 border-l-2 border-transparent'
                  }`
                }
              >
                <item.icon className="w-[18px] h-[18px]" />
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Admin Console */}
        {user?.role === 'Admin' && (
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-widest px-3 block mb-3">Admin Panel</span>
            <nav className="space-y-1">
              <NavLink 
                to="/admin" 
                className={({ isActive }) => 
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150 ${
                    isActive 
                      ? 'bg-brand-primary/10 text-white border-l-2 border-brand-primary font-medium' 
                      : 'text-slate-400 hover:text-slate-100 hover:bg-bg-hover/40 border-l-2 border-transparent'
                  }`
                }
              >
                <Shield className="w-[18px] h-[18px]" />
                Admin Console
              </NavLink>
            </nav>
          </div>
        )}
      </div>

      {/* User profile dropdown drawer */}
      <div className="p-4 border-t border-bg-border bg-bg-card flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-brand-primary/20 border border-brand-primary/40 flex items-center justify-center text-brand-primary font-bold">
              {user?.username ? user.username[0].toUpperCase() : 'U'}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-semibold text-white truncate">{user?.username || 'Guest'}</p>
              <p className="text-[10px] text-slate-400 truncate">{user?.email || 'Not logged in'}</p>
            </div>
          </div>
          <button 
            onClick={() => navigate('/settings')}
            className="p-1.5 hover:bg-bg-hover rounded-lg text-slate-400 hover:text-white transition-colors"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>

        <button 
          onClick={handleLogout}
          className="flex items-center justify-center gap-2 w-full py-2 bg-bg-hover/50 hover:bg-red-950/20 hover:text-red-400 rounded-lg text-xs font-semibold border border-bg-border transition-all duration-150"
        >
          <LogOut className="w-3.5 h-3.5" />
          Log Out
        </button>
      </div>
    </aside>
  );
};
