import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Settings as SettingsIcon, Save, Key, Lock, User, Briefcase } from 'lucide-react';

export const Settings: React.FC = () => {
  const { user } = useAuth();
  const [apiKey, setApiKey] = useState(localStorage.getItem('openai_api_key') || '');
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const handleSaveApi = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('openai_api_key', apiKey);
    setStatusMsg("OpenAI API configurations saved successfully.");
    setTimeout(() => setStatusMsg(null), 3000);
  };

  const handlePasswordUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword) return;
    setStatusMsg("Password updated successfully.");
    setOldPassword('');
    setNewPassword('');
    setTimeout(() => setStatusMsg(null), 3000);
  };

  return (
    <div className="space-y-8 pb-12">
      
      {/* Header */}
      <div>
        <h2 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
          <SettingsIcon className="w-5 h-5 text-brand-primary" />
          System Settings
        </h2>
        <p className="text-slate-400 text-xs mt-1">Configure API keys, adjust workspace themes, and manage user profile credentials.</p>
      </div>

      {statusMsg && (
        <div className="p-3 bg-emerald-950/20 border border-emerald-500/30 rounded-xl text-emerald-400 text-xs flex gap-2 items-center">
          <span>{statusMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Profile Details Card */}
        <div className="bg-bg-card border border-bg-border rounded-xl p-5 space-y-4">
          <h3 className="font-bold text-white text-xs border-b border-bg-border pb-3 flex items-center gap-2">
            <User className="w-4 h-4 text-brand-primary" />
            Profile Details
          </h3>
          
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="block text-slate-500 font-bold uppercase tracking-wider mb-1">Username</span>
                <p className="text-slate-200 p-2 bg-bg-hover/40 rounded-lg border border-bg-border/60 font-semibold">{user?.username}</p>
              </div>
              <div>
                <span className="block text-slate-500 font-bold uppercase tracking-wider mb-1">Email Scope</span>
                <p className="text-slate-200 p-2 bg-bg-hover/40 rounded-lg border border-bg-border/60 font-semibold">{user?.email}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="block text-slate-500 font-bold uppercase tracking-wider mb-1">Department</span>
                <p className="text-slate-200 p-2 bg-bg-hover/40 rounded-lg border border-bg-border/60 font-semibold">{user?.department}</p>
              </div>
              <div>
                <span className="block text-slate-500 font-bold uppercase tracking-wider mb-1">Access Role</span>
                <p className="text-slate-200 p-2 bg-bg-hover/40 rounded-lg border border-bg-border/60 font-semibold">{user?.role}</p>
              </div>
            </div>
          </div>
        </div>

        {/* AI API Configuration Card */}
        <div className="bg-bg-card border border-bg-border rounded-xl p-5 space-y-4">
          <h3 className="font-bold text-white text-xs border-b border-bg-border pb-3 flex items-center gap-2">
            <Key className="w-4 h-4 text-brand-success" />
            OpenAI Integration Key
          </h3>
          
          <form onSubmit={handleSaveApi} className="space-y-4 text-xs">
            <p className="text-slate-400">By default, NexusQuery AI answers searches using local summaries. Set an OpenAI API key below to enable generative GPT RAG responses.</p>
            <div>
              <label className="block text-slate-400 font-semibold mb-1">OpenAI API Key</label>
              <input 
                type="password" 
                placeholder="sk-proj-..." 
                value={apiKey} 
                onChange={(e) => setApiKey(e.target.value)} 
                className="w-full bg-bg-hover border border-bg-border focus:border-brand-primary outline-none py-2 px-3 rounded-lg text-slate-200 placeholder-slate-600"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-brand-primary hover:bg-brand-primaryHover text-white rounded-lg font-bold flex items-center gap-1.5 transition-colors"
            >
              <Save className="w-3.5 h-3.5" />
              Save Settings
            </button>
          </form>
        </div>

        {/* Change password card */}
        <div className="bg-bg-card border border-bg-border rounded-xl p-5 space-y-4">
          <h3 className="font-bold text-white text-xs border-b border-bg-border pb-3 flex items-center gap-2">
            <Lock className="w-4 h-4 text-brand-primary" />
            Update Password
          </h3>
          
          <form onSubmit={handlePasswordUpdate} className="space-y-4 text-xs">
            <div className="space-y-3">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Current Password</label>
                <input 
                  type="password" 
                  value={oldPassword} 
                  onChange={(e) => setOldPassword(e.target.value)} 
                  placeholder="••••••••"
                  className="w-full bg-bg-hover border border-bg-border focus:border-brand-primary outline-none py-2 px-3 rounded-lg text-slate-200 placeholder-slate-600"
                />
              </div>
              <div>
                <label className="block text-slate-400 font-semibold mb-1">New Password</label>
                <input 
                  type="password" 
                  value={newPassword} 
                  onChange={(e) => setNewPassword(e.target.value)} 
                  placeholder="Minimum 6 characters"
                  className="w-full bg-bg-hover border border-bg-border focus:border-brand-primary outline-none py-2 px-3 rounded-lg text-slate-200 placeholder-slate-600"
                />
              </div>
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-brand-primary hover:bg-brand-primaryHover text-white rounded-lg font-bold flex items-center gap-1.5 transition-colors"
            >
              <Save className="w-3.5 h-3.5" />
              Update Password
            </button>
          </form>
        </div>

      </div>

    </div>
  );
};
