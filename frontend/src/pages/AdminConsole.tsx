import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Shield, 
  Users, 
  Activity, 
  RefreshCw, 
  Check, 
  X, 
  Trash2, 
  Edit3, 
  Eye, 
  Database,
  Terminal,
  Lock,
  Clock
} from 'lucide-react';

export const AdminConsole: React.FC = () => {
  const { api, user } = useAuth();

  // Admin lists states
  const [usersList, setUsersList] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [auditsLoading, setAuditsLoading] = useState(false);

  // Operations state
  const [reindexing, setReindexing] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const fetchUsers = async () => {
    setUsersLoading(true);
    try {
      const res = await api.get('/api/admin/users');
      setUsersList(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setUsersLoading(false);
    }
  };

  const fetchAudits = async () => {
    setAuditsLoading(true);
    try {
      const res = await api.get('/api/admin/audit-logs');
      setAuditLogs(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setAuditsLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'Admin') {
      fetchUsers();
      fetchAudits();
    }
  }, [user]);

  const handleRoleChange = async (userId: number, nextRole: string) => {
    try {
      await api.put(`/api/admin/users/${userId}/role`, null, { params: { role: nextRole } });
      setActionSuccess(`User role updated successfully to ${nextRole}`);
      fetchUsers();
      fetchAudits();
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err: any) {
      alert(err.response?.data?.detail || "Failed to update role");
    }
  };

  const handleToggleStatus = async (userId: number, currentActive: boolean) => {
    try {
      await api.put(`/api/admin/users/${userId}/status`, null, { params: { is_active: !currentActive } });
      setActionSuccess(`User status updated to ${!currentActive ? 'Active' : 'Deactivated'}`);
      fetchUsers();
      fetchAudits();
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err: any) {
      alert(err.response?.data?.detail || "Failed to adjust status");
    }
  };

  const triggerReindex = async () => {
    setReindexing(true);
    try {
      await api.post('/api/admin/reindex');
      setActionSuccess("Vector database re-indexing triggered in background!");
      fetchAudits();
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (err: any) {
      alert(err.response?.data?.detail || "Failed to trigger re-index");
    } finally {
      setReindexing(false);
    }
  };

  const defaultAudits = [
    { id: 1, username: 'Admin', action: 'ADMIN_TRIGGER_REINDEX', details: 'Triggered full FAISS vector database re-index job', timestamp: new Date().toISOString() },
    { id: 2, username: 'System', action: 'FAISS_INIT', details: 'FAISS vector database indexes initialized', timestamp: new Date(Date.now() - 3600000).toISOString() },
    { id: 3, username: 'John Doe', action: 'USER_LOGIN', details: 'Logged in from API', timestamp: new Date(Date.now() - 7200000).toISOString() }
  ];

  return (
    <div className="space-y-8 pb-12">
      
      {/* Page Header */}
      <div>
        <h2 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
          <Shield className="w-5 h-5 text-brand-primary" />
          Admin Console
        </h2>
        <p className="text-slate-400 text-xs mt-1">Configure workspace rules, adjust user role scopes, audit systems logs, and refresh indexes.</p>
      </div>

      {actionSuccess && (
        <div className="p-3 bg-emerald-950/20 border border-emerald-500/30 rounded-xl text-emerald-400 text-xs flex gap-2 items-center">
          <Check className="w-4 h-4" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Grid: Re-indexing widget and users list */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* User Management Panel */}
        <div className="lg:col-span-2 bg-bg-card border border-bg-border rounded-xl p-6 space-y-4">
          <h3 className="font-bold text-white text-xs border-b border-bg-border pb-3 flex items-center gap-2">
            <Users className="w-4 h-4 text-brand-primary" />
            User Management & Scopes
          </h3>

          <div className="overflow-x-auto text-xs">
            {usersLoading ? (
              <div className="text-center py-10">Fetching users...</div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-slate-500 border-b border-bg-border/60">
                    <th className="pb-3 font-semibold">User</th>
                    <th className="pb-3 font-semibold">Department</th>
                    <th className="pb-3 font-semibold">Role</th>
                    <th className="pb-3 font-semibold">Status</th>
                    <th className="pb-3 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {usersList.map((u) => (
                    <tr key={u.id} className="border-b border-bg-border/40 last:border-0 hover:bg-bg-hover/20 transition-all">
                      <td className="py-3 font-medium text-slate-200">
                        <p>{u.username}</p>
                        <p className="text-[10px] text-slate-500">{u.email}</p>
                      </td>
                      <td className="py-3 text-slate-300">{u.department}</td>
                      <td className="py-3 text-slate-400">
                        <select 
                          value={u.role} 
                          onChange={(e) => handleRoleChange(u.id, e.target.value)}
                          className="bg-bg-hover border border-bg-border rounded px-1.5 py-0.5 text-slate-300 outline-none"
                        >
                          <option value="Employee">Employee</option>
                          <option value="Team Lead">Team Lead</option>
                          <option value="Admin">Admin</option>
                        </select>
                      </td>
                      <td className="py-3">
                        <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase ${
                          u.is_active ? 'bg-brand-success/10 text-brand-success' : 'bg-brand-danger/10 text-brand-danger'
                        }`}>
                          {u.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        <button
                          onClick={() => handleToggleStatus(u.id, u.is_active)}
                          className={`px-2.5 py-1 rounded text-[10px] font-bold transition-all ${
                            u.is_active 
                              ? 'bg-red-950/20 text-red-400 border border-red-500/20 hover:bg-brand-danger hover:text-white hover:border-brand-danger' 
                              : 'bg-emerald-950/20 text-emerald-400 border border-emerald-500/20 hover:bg-brand-success hover:text-white hover:border-brand-success'
                          }`}
                        >
                          {u.is_active ? 'Deactivate' : 'Activate'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Index Control Panel */}
        <div className="lg:col-span-1 bg-bg-card border border-bg-border rounded-xl p-5 space-y-4 h-fit">
          <h3 className="font-bold text-white text-xs border-b border-bg-border pb-3 flex items-center gap-2">
            <Database className="w-4 h-4 text-brand-success" />
            FAISS Index Management
          </h3>

          <div className="p-3 bg-bg-hover/20 border border-bg-border rounded-xl space-y-2 text-xs">
            <div className="flex justify-between items-center text-[10px]">
              <span className="text-slate-500 uppercase font-bold">Vector Database</span>
              <span className="text-brand-success font-semibold">ONLINE</span>
            </div>
            <p className="text-slate-300">Total embeddings are split in 384 dimensions matching local transformer specs.</p>
          </div>

          <button
            onClick={triggerReindex}
            disabled={reindexing}
            className="w-full py-2 bg-brand-primary hover:bg-brand-primaryHover disabled:bg-brand-primary/50 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-md shadow-brand-primary/10 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${reindexing ? 'animate-spin' : ''}`} />
            {reindexing ? 'RE-INDEXING DATABASE...' : 'FORCE RE-INDEX FAISS'}
          </button>
        </div>

      </div>

      {/* Audit Logs Table */}
      <div className="bg-bg-card border border-bg-border rounded-xl p-6 space-y-4">
        <h3 className="font-bold text-white text-xs border-b border-bg-border pb-3 flex items-center gap-2">
          <Activity className="w-4 h-4 text-brand-warning animate-pulse-subtle" />
          Audit Logs
        </h3>

        <div className="overflow-x-auto text-xs max-h-[300px]">
          {auditsLoading ? (
            <div className="text-center py-10">Fetching audits...</div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-slate-500 border-b border-bg-border/60">
                  <th className="pb-3 font-semibold">Timestamp</th>
                  <th className="pb-3 font-semibold">User</th>
                  <th className="pb-3 font-semibold">Action</th>
                  <th className="pb-3 font-semibold">Details</th>
                </tr>
              </thead>
              <tbody>
                {(auditLogs.length > 0 ? auditLogs : defaultAudits).map((log) => (
                  <tr key={log.id} className="border-b border-bg-border/40 last:border-0 hover:bg-bg-hover/20 transition-all font-mono text-[10.5px]">
                    <td className="py-2.5 text-slate-500">{new Date(log.timestamp).toLocaleString()}</td>
                    <td className="py-2.5 text-slate-300 font-bold">{log.username}</td>
                    <td className="py-2.5">
                      <span className="px-1.5 py-0.5 bg-bg-hover text-brand-primary border border-bg-border rounded text-[9px] font-bold">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-2.5 text-slate-400">{log.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

    </div>
  );
};
