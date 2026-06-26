import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  UploadCloud, 
  Check, 
  X, 
  Clock, 
  AlertCircle,
  FileText,
  GitBranch,
  BookOpen,
  Send,
  Eye,
  User,
  ExternalLink,
  CornerDownRight,
  ShieldCheck
} from 'lucide-react';

export const Contribute: React.FC = () => {
  const { api, user } = useAuth();

  // Contributions state
  const [contributions, setContributions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Form states
  const [title, setTitle] = useState('');
  const [itemType, setItemType] = useState('document'); // document, repo, wiki
  const [url, setUrl] = useState('');
  const [dept, setDept] = useState('Engineering');
  const [tags, setTags] = useState('');
  const [perm, setPerm] = useState('Public');
  const [submitLoading, setSubmitLoading] = useState(false);

  // Review states
  const [activeReview, setActiveReview] = useState<any | null>(null);
  const [reviewComments, setReviewComments] = useState('');
  const [reviewLoading, setReviewLoading] = useState(false);

  const fetchContributions = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/contribute/list');
      setContributions(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContributions();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;
    setSubmitLoading(true);
    try {
      await api.post('/api/contribute/submit', {
        title,
        item_type: itemType,
        source_url: url || undefined,
        department: dept,
        tags: tags || undefined,
        permission: perm
      });
      setTitle('');
      setUrl('');
      setTags('');
      fetchContributions();
    } catch (err: any) {
      alert(err.response?.data?.detail || "Submission failed");
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleReviewAction = async (status: 'Approved' | 'Rejected' | 'ChangesRequested') => {
    if (!activeReview) return;
    setReviewLoading(true);
    try {
      await api.post(`/api/contribute/${activeReview.id}/review`, {
        status,
        comments: reviewComments || undefined
      });
      setActiveReview(null);
      setReviewComments('');
      fetchContributions();
    } catch (err: any) {
      alert(err.response?.data?.detail || "Review update failed");
    } finally {
      setReviewLoading(false);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      
      {/* Page Header */}
      <div>
        <h2 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
          <UploadCloud className="w-5 h-5 text-brand-primary" />
          Knowledge Contribution Portal
        </h2>
        <p className="text-slate-400 text-xs mt-1">Submit new directories, codebase links, or SOP files for index verification.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Submission Form */}
        <div className="lg:col-span-1 bg-bg-card border border-bg-border rounded-xl p-5 space-y-4 h-fit">
          <h3 className="font-bold text-white text-xs border-b border-bg-border pb-3 flex items-center gap-2">
            <Send className="w-4 h-4 text-brand-primary" />
            Contribute Resource
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Title</label>
              <input 
                type="text" 
                required 
                placeholder="Product Management SOP" 
                value={title} 
                onChange={(e) => setTitle(e.target.value)} 
                className="w-full bg-bg-hover border border-bg-border focus:border-brand-primary outline-none py-2 px-3 rounded-lg text-slate-200 placeholder-slate-600"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Item Type</label>
                <select 
                  value={itemType} 
                  onChange={(e) => setItemType(e.target.value)} 
                  className="w-full bg-bg-hover border border-bg-border focus:border-brand-primary outline-none py-2 px-2.5 rounded-lg text-slate-200"
                >
                  <option value="document">File Document</option>
                  <option value="repo">Code Repository</option>
                  <option value="wiki">Wiki URL Link</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Department</label>
                <select 
                  value={dept} 
                  onChange={(e) => setDept(e.target.value)} 
                  className="w-full bg-bg-hover border border-bg-border focus:border-brand-primary outline-none py-2 px-2.5 rounded-lg text-slate-200"
                >
                  <option value="Engineering">Engineering</option>
                  <option value="HR">HR</option>
                  <option value="Finance">Finance</option>
                  <option value="Operations">Operations</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1">Resource Link / URL (Optional)</label>
              <input 
                type="url" 
                placeholder="https://github.com/company/repo" 
                value={url} 
                onChange={(e) => setUrl(e.target.value)} 
                className="w-full bg-bg-hover border border-bg-border focus:border-brand-primary outline-none py-2 px-3 rounded-lg text-slate-200 placeholder-slate-600"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Tags</label>
                <input 
                  type="text" 
                  placeholder="pm, rules" 
                  value={tags} 
                  onChange={(e) => setTags(e.target.value)} 
                  className="w-full bg-bg-hover border border-bg-border focus:border-brand-primary outline-none py-2 px-3 rounded-lg text-slate-200 placeholder-slate-600"
                />
              </div>
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Permission</label>
                <select 
                  value={perm} 
                  onChange={(e) => setPerm(e.target.value)} 
                  className="w-full bg-bg-hover border border-bg-border focus:border-brand-primary outline-none py-2 px-2.5 rounded-lg text-slate-200"
                >
                  <option value="Public">Public</option>
                  <option value="Department">Department Only</option>
                  <option value="Admin">Admin Only</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitLoading || !title}
              className="w-full py-2 bg-brand-primary hover:bg-brand-primaryHover disabled:bg-brand-primary/50 text-white font-bold rounded-xl transition-colors"
            >
              {submitLoading ? 'Submitting Proposal...' : 'Propose Contribution'}
            </button>
          </form>
        </div>

        {/* Right Column: Pending Contributions Feed */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-bg-card border border-bg-border rounded-xl p-6">
            <h3 className="font-bold text-white text-sm border-b border-bg-border/60 pb-3">Review & Status Feed</h3>
            
            {loading ? (
              <div className="text-center py-16 text-slate-500">Retrieving proposal logs...</div>
            ) : contributions.length === 0 ? (
              <div className="text-center py-16 text-slate-500 text-xs">No pending contributions found.</div>
            ) : (
              <div className="mt-4 space-y-3.5">
                {contributions.map((item) => (
                  <div key={item.id} className="p-4 bg-bg-hover/20 border border-bg-border rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
                    <div className="flex gap-3 items-start overflow-hidden">
                      <div className="w-8 h-8 rounded-lg bg-bg-hover flex items-center justify-center shrink-0 border border-bg-border/60">
                        {item.item_type === 'document' && <FileText className="w-4 h-4 text-brand-primary" />}
                        {item.item_type === 'repo' && <GitBranch className="w-4 h-4 text-brand-success" />}
                        {item.item_type === 'wiki' && <BookOpen className="w-4 h-4 text-brand-warning" />}
                      </div>
                      <div className="overflow-hidden">
                        <h4 className="font-bold text-slate-200 truncate">{item.title}</h4>
                        <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1.5 flex-wrap">
                          <span>By: ID {item.contributor_id}</span>
                          <span>•</span>
                          <span>Dept: {item.department}</span>
                          {item.source_url && (
                            <>
                              <span>•</span>
                              <a href={item.source_url} target="_blank" rel="noreferrer" className="text-brand-primary hover:underline flex items-center gap-0.5 font-semibold">
                                Link <ExternalLink className="w-2.5 h-2.5" />
                              </a>
                            </>
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0 self-end md:self-auto">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase flex items-center gap-1 ${
                        item.status === 'Approved' 
                          ? 'bg-brand-success/10 text-brand-success border border-brand-success/20' 
                          : item.status === 'Rejected'
                          ? 'bg-brand-danger/10 text-brand-danger border border-brand-danger/20'
                          : 'bg-brand-warning/10 text-brand-warning border border-brand-warning/20'
                      }`}>
                        {item.status === 'Approved' && <Check className="w-3 h-3" />}
                        {item.status === 'Rejected' && <X className="w-3 h-3" />}
                        {item.status === 'Pending' && <Clock className="w-3 h-3 animate-pulse" />}
                        {item.status}
                      </span>

                      {/* Review Actions Gate (visible to Team Lead / Admin on Pending entries) */}
                      {item.status === 'Pending' && user && ['Admin', 'Team Lead'].includes(user.role) && (
                        <button
                          onClick={() => setActiveReview(item)}
                          className="px-3 py-1.5 bg-brand-primary hover:bg-brand-primaryHover text-white rounded-lg font-bold flex items-center gap-0.5"
                        >
                          Review <Eye className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Review Dialog modal */}
      {activeReview && (
        <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-bg-card border border-bg-border shadow-2xl rounded-2xl p-6 space-y-4 text-xs text-slate-300">
            <h3 className="font-extrabold text-white text-base flex items-center gap-1.5">
              <ShieldCheck className="w-5 h-5 text-brand-primary" />
              Evaluate Contribution
            </h3>
            
            <div className="space-y-3.5 bg-bg-hover/10 p-3.5 border border-bg-border/60 rounded-xl">
              <p className="font-bold text-slate-200">Title: {activeReview.title}</p>
              <div className="text-[10px] text-slate-400 space-y-1.5">
                <p>Type: {activeReview.item_type.toUpperCase()}</p>
                <p>Department scope: {activeReview.department}</p>
                {activeReview.source_url && <p className="truncate">Resource: {activeReview.source_url}</p>}
              </div>
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1">Reviewer Remarks / Feedback</label>
              <textarea 
                placeholder="Write feedback comments, requests for changes, or explanation of rejection..." 
                value={reviewComments} 
                onChange={(e) => setReviewComments(e.target.value)} 
                className="w-full bg-bg-hover border border-bg-border focus:border-brand-primary outline-none py-2 px-3 rounded-lg text-slate-200 placeholder-slate-600 h-20 resize-none"
              />
            </div>

            <div className="flex flex-wrap gap-2.5 pt-3">
              <button
                onClick={() => setActiveReview(null)}
                className="flex-1 py-2 border border-bg-border hover:bg-bg-hover rounded-xl font-bold text-slate-400"
              >
                Cancel
              </button>
              
              <button
                onClick={() => handleReviewAction('Rejected')}
                disabled={reviewLoading}
                className="px-4 py-2 bg-brand-danger/10 border border-brand-danger/30 hover:bg-brand-danger hover:text-white text-brand-danger rounded-xl font-bold transition-all"
              >
                Reject
              </button>
              
              <button
                onClick={() => handleReviewAction('Approved')}
                disabled={reviewLoading}
                className="px-4 py-2 bg-brand-success hover:bg-emerald-600 text-white rounded-xl font-bold transition-all"
              >
                Approve
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
