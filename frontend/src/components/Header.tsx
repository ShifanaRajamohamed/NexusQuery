import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Bell, Sun, Moon, Search, Check, AlertCircle, Circle } from 'lucide-react';

export const Header: React.FC = () => {
  const { user, api } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const res = await api.get('/api/notifications/list');
      setNotifications(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10000);
    return () => clearInterval(interval);
  }, [user]);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const handleMarkAllRead = async () => {
    try {
      await api.post('/api/notifications/read-all');
      fetchNotifications();
    } catch (e) {
      console.error(e);
    }
  };

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    // Simple mock toggle
    if (next === 'light') {
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.add('dark');
    }
  };

  return (
    <header className="h-16 border-b border-bg-border bg-bg-card/75 backdrop-blur-md flex items-center justify-between px-8 sticky top-0 z-10 w-full">
      {/* Search trigger (informational indicator) */}
      <div className="flex items-center gap-2 text-slate-400 bg-bg-hover/40 px-3.5 py-1.5 rounded-lg border border-bg-border w-80 text-xs">
        <Search className="w-4 h-4 text-slate-500" />
        <span>Press <kbd className="bg-bg-border px-1.5 py-0.5 rounded font-mono text-[10px]">Ctrl</kbd> + <kbd className="bg-bg-border px-1.5 py-0.5 rounded font-mono text-[10px]">K</kbd> to search...</span>
      </div>

      <div className="flex items-center gap-4">
        {/* Department Pill */}
        {user?.department && (
          <div className="px-2.5 py-1 bg-brand-primary/10 border border-brand-primary/30 rounded-full text-xs font-semibold text-brand-primary">
            Dept: {user.department}
          </div>
        )}

        {/* Theme Toggle */}
        <button 
          onClick={toggleTheme}
          className="p-2 hover:bg-bg-hover rounded-lg text-slate-400 hover:text-white transition-colors"
        >
          {theme === 'dark' ? <Sun className="w-[18px] h-[18px]" /> : <Moon className="w-[18px] h-[18px]" />}
        </button>

        {/* Notification Bell Panel */}
        <div className="relative">
          <button 
            onClick={() => setShowDropdown(!showDropdown)}
            className="p-2 hover:bg-bg-hover rounded-lg text-slate-400 hover:text-white transition-colors relative"
          >
            <Bell className="w-[18px] h-[18px]" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-brand-danger text-[9px] text-white rounded-full flex items-center justify-center font-bold">
                {unreadCount}
              </span>
            )}
          </button>

          {showDropdown && (
            <div className="absolute right-0 mt-3 w-80 bg-bg-card border border-bg-border shadow-2xl rounded-xl z-30 p-2 text-slate-300">
              <div className="flex items-center justify-between p-3 border-b border-bg-border">
                <span className="font-bold text-white text-sm">Notifications</span>
                {unreadCount > 0 && (
                  <button 
                    onClick={handleMarkAllRead}
                    className="text-xs text-brand-primary hover:underline font-semibold"
                  >
                    Mark all read
                  </button>
                )}
              </div>
              <div className="max-h-60 overflow-y-auto py-1">
                {notifications.length === 0 ? (
                  <div className="text-center py-6 text-slate-500 text-xs flex flex-col items-center gap-1">
                    <Circle className="w-6 h-6 stroke-[1.5]" />
                    No notifications
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div key={n.id} className={`p-3 border-b border-bg-border/40 last:border-0 hover:bg-bg-hover/30 transition-all flex gap-3 text-xs ${!n.is_read ? 'bg-brand-primary/5' : ''}`}>
                      <AlertCircle className={`w-4 h-4 mt-0.5 shrink-0 ${!n.is_read ? 'text-brand-primary' : 'text-slate-500'}`} />
                      <div>
                        <p className="font-medium text-slate-200">{n.title}</p>
                        <p className="text-slate-400 mt-0.5">{n.message}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Info Avatar */}
        <div className="flex items-center gap-2 border-l border-bg-border pl-4">
          <div className="w-8 h-8 rounded-full bg-brand-accent/20 text-brand-accent font-semibold flex items-center justify-center border border-brand-accent/30 text-xs">
            {user?.username ? user.username.substring(0, 2).toUpperCase() : 'G'}
          </div>
        </div>
      </div>
    </header>
  );
};
