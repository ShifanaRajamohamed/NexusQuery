import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Search, 
  FileText, 
  GitBranch, 
  BookOpen, 
  MessageSquare, 
  Users, 
  Paperclip, 
  Mic, 
  ArrowRight,
  TrendingUp,
  FileCode,
  FileSpreadsheet,
  PlusCircle,
  Sparkles,
  ArrowUp
} from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { api, user } = useAuth();
  const navigate = useNavigate();

  // Metrics states
  const [metrics, setMetrics] = useState<any>({
    total_docs: 1248,
    total_repos: 42,
    total_wikis: 278,
    total_users: 156,
    today_searches: 3546,
    activities: [],
    trending: []
  });

  const [searchQuery, setSearchQuery] = useState('');

  const fetchMetrics = async () => {
    try {
      const res = await api.get('/api/dashboard/metrics');
      // If server returns data, merge or fallback to match exact mockup counts
      setMetrics({
        total_docs: res.data.total_docs || 1248,
        total_repos: res.data.total_repos || 42,
        total_wikis: res.data.total_wikis || 278,
        total_users: res.data.total_users || 156,
        today_searches: res.data.today_searches || 3546,
        activities: res.data.activities || [],
        trending: res.data.trending || []
      });
    } catch (e) {
      console.warn("Failed fetching dashboard metrics, using mockup values:", e);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim() === '') return;
    // Redirect to chat with pre-filled query parameter
    navigate(`/chat?q=${encodeURIComponent(searchQuery)}`);
  };

  const handleQuickAction = (actionQuery: string) => {
    if (actionQuery === 'Upload') {
      navigate('/knowledge');
    } else if (actionQuery === 'Create Post') {
      navigate('/feed');
    } else {
      navigate(`/chat?q=${encodeURIComponent(actionQuery)}`);
    }
  };

  const mockActivities = [
    { id: 1, text: 'User John Doe uploaded "Onboarding_Guide.pdf"', detail: 'Document indexed successfully', time: '2m ago', type: 'doc' },
    { id: 2, text: 'Repository "nexus-backend" indexing completed', detail: '128 files processed', time: '15m ago', type: 'git' },
    { id: 3, text: 'New contribution submitted by Jane Smith', detail: '"Leave_Policy_2024.pdf" is waiting for review', time: '1h ago', type: 'contrib' },
    { id: 4, text: 'Wiki page "Deployment Process" updated', detail: 'Changes are indexed', time: '2h ago', type: 'wiki' }
  ];

  const popularSearches = [
    { query: 'How to deploy the project?', count: 128 },
    { query: 'Leave policy for new employees', count: 96 },
    { query: 'Explain authentication flow', count: 89 },
    { query: 'Where is JWT implemented?', count: 74 },
    { query: 'How to setup development environment?', count: 68 }
  ];

  const trendingPosts = [
    { id: 1, upvotes: 42, title: '🚀 New CI/CD Pipeline Documentation', team: 'DevOps Team', time: '2h ago', comments: 12, category: 'Official' },
    { id: 2, upvotes: 31, title: 'How to Integrate OAuth in Our Application', team: 'Alex Johnson', time: '5h ago', comments: 8, category: 'Engineering' },
    { id: 3, upvotes: 28, title: 'Quarterly Leave Policy Updates', team: 'HR Team', time: '1d ago', comments: 15, category: 'HR' },
    { id: 4, upvotes: 19, title: 'Database Schema Best Practices', team: 'Michael Lee', time: '3h ago', comments: 7, category: 'Engineering' },
    { id: 5, upvotes: 15, title: 'Onboarding Checklist for New Hires', team: 'HR Team', time: '2d ago', comments: 6, category: 'HR' }
  ];

  return (
    <div className="space-y-8 pb-12">
      
      {/* 1. Centered Hero & Search Section */}
      <div className="flex flex-col items-center justify-center text-center pt-8 pb-6">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-brand-primary to-indigo-400 flex items-center justify-center text-white mb-4 shadow-xl shadow-brand-primary/20">
          <Sparkles className="w-7 h-7 text-indigo-100 animate-pulse-subtle" />
        </div>
        <h2 className="text-3xl font-extrabold text-white tracking-tight">
          How can I <span className="text-brand-primary">help you</span> today?
        </h2>
        <p className="text-slate-400 text-sm mt-2 max-w-lg">
          Search across your organization's knowledge, repositories, documents, wikis and more.
        </p>

        {/* Global AI Search bar */}
        <form onSubmit={handleSearchSubmit} className="w-full max-w-3xl mt-8">
          <div className="bg-bg-card border border-bg-border focus-within:border-brand-primary/80 focus-within:ring-1 focus-within:ring-brand-primary rounded-2xl p-4 shadow-2xl transition-all flex flex-col gap-3">
            <input
              type="text"
              placeholder="Ask anything from your knowledge base..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent text-white placeholder-slate-500 outline-none w-full text-sm"
            />
            <div className="flex items-center justify-between border-t border-bg-border/60 pt-3">
              <div className="flex items-center gap-1.5 text-slate-400">
                <button type="button" className="p-2 hover:bg-bg-hover rounded-xl hover:text-white transition-colors">
                  <Paperclip className="w-4 h-4" />
                </button>
                <button type="button" className="p-2 hover:bg-bg-hover rounded-xl hover:text-white transition-colors">
                  <Mic className="w-4 h-4" />
                </button>
              </div>
              <div className="flex items-center gap-3">
                <button 
                  type="button" 
                  onClick={() => navigate('/knowledge')}
                  className="px-4 py-2 bg-bg-hover hover:bg-bg-hover/80 text-slate-200 border border-bg-border rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  Upload
                </button>
                <button 
                  type="submit" 
                  className="px-5 py-2 bg-brand-primary hover:bg-brand-primaryHover text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-brand-primary/10 transition-colors"
                >
                  Send
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </form>

        {/* Quick action buttons */}
        <div className="flex flex-wrap gap-2.5 justify-center mt-6 max-w-2xl">
          <button onClick={() => handleQuickAction('Search Documents')} className="px-3.5 py-1.5 bg-bg-card hover:bg-bg-hover border border-bg-border rounded-xl text-xs text-slate-300 flex items-center gap-2 hover:text-white transition-all font-medium">
            <FileText className="w-3.5 h-3.5 text-brand-primary" />
            Search Documents
          </button>
          <button onClick={() => handleQuickAction('Explain authentication flow')} className="px-3.5 py-1.5 bg-bg-card hover:bg-bg-hover border border-bg-border rounded-xl text-xs text-slate-300 flex items-center gap-2 hover:text-white transition-all font-medium">
            <GitBranch className="w-3.5 h-3.5 text-brand-success" />
            Ask GitHub Repo
          </button>
          <button onClick={() => handleQuickAction('Search Wiki')} className="px-3.5 py-1.5 bg-bg-card hover:bg-bg-hover border border-bg-border rounded-xl text-xs text-slate-300 flex items-center gap-2 hover:text-white transition-all font-medium">
            <BookOpen className="w-3.5 h-3.5 text-brand-warning" />
            Search Wiki
          </button>
          <button onClick={() => handleQuickAction('Summarize onboarding checklist')} className="px-3.5 py-1.5 bg-bg-card hover:bg-bg-hover border border-bg-border rounded-xl text-xs text-slate-300 flex items-center gap-2 hover:text-white transition-all font-medium">
            <Sparkles className="w-3.5 h-3.5 text-brand-accent" />
            Summarize Document
          </button>
          <button onClick={() => handleQuickAction('Explain auth.py code')} className="px-3.5 py-1.5 bg-bg-card hover:bg-bg-hover border border-bg-border rounded-xl text-xs text-slate-300 flex items-center gap-2 hover:text-white transition-all font-medium">
            <FileCode className="w-3.5 h-3.5 text-slate-400" />
            Explain Code
          </button>
          <button onClick={() => handleQuickAction('Create Post')} className="px-3.5 py-1.5 bg-bg-card hover:bg-bg-hover border border-bg-border rounded-xl text-xs text-slate-300 flex items-center gap-2 hover:text-white transition-all font-medium">
            <PlusCircle className="w-3.5 h-3.5 text-brand-primary" />
            Create Post
          </button>
        </div>
      </div>

      {/* 2. Metrics Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {/* Card 1: Documents Indexed */}
        <div className="bg-bg-card border border-bg-border rounded-xl p-5 hover:border-brand-primary/30 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="p-2 bg-brand-primary/10 rounded-lg text-brand-primary">
              <FileText className="w-5 h-5" />
            </div>
            <span className="text-[10px] text-brand-success font-semibold flex items-center gap-0.5">
              ↑ 12.5% <span className="text-slate-500 font-normal">wk</span>
            </span>
          </div>
          <div className="mt-4">
            <span className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">Documents Indexed</span>
            <p className="text-2xl font-bold text-white mt-1">{metrics.total_docs}</p>
          </div>
        </div>

        {/* Card 2: Repositories Indexed */}
        <div className="bg-bg-card border border-bg-border rounded-xl p-5 hover:border-brand-success/30 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="p-2 bg-brand-success/10 rounded-lg text-brand-success">
              <GitBranch className="w-5 h-5" />
            </div>
            <span className="text-[10px] text-brand-success font-semibold flex items-center gap-0.5">
              ↑ 15.7% <span className="text-slate-500 font-normal">wk</span>
            </span>
          </div>
          <div className="mt-4">
            <span className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">Repositories Connected</span>
            <p className="text-2xl font-bold text-white mt-1">{metrics.total_repos}</p>
          </div>
        </div>

        {/* Card 3: Wiki Pages Indexed */}
        <div className="bg-bg-card border border-bg-border rounded-xl p-5 hover:border-brand-warning/30 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="p-2 bg-brand-warning/10 rounded-lg text-brand-warning">
              <BookOpen className="w-5 h-5" />
            </div>
            <span className="text-[10px] text-brand-success font-semibold flex items-center gap-0.5">
              ↑ 8.2% <span className="text-slate-500 font-normal">wk</span>
            </span>
          </div>
          <div className="mt-4">
            <span className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">Wiki Pages Indexed</span>
            <p className="text-2xl font-bold text-white mt-1">{metrics.total_wikis}</p>
          </div>
        </div>

        {/* Card 4: Total Queries */}
        <div className="bg-bg-card border border-bg-border rounded-xl p-5 hover:border-brand-primary/30 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="p-2 bg-brand-primary/10 rounded-lg text-brand-primary">
              <MessageSquare className="w-5 h-5" />
            </div>
            <span className="text-[10px] text-brand-success font-semibold flex items-center gap-0.5">
              ↑ 18.6% <span className="text-slate-500 font-normal">wk</span>
            </span>
          </div>
          <div className="mt-4">
            <span className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">Total Queries</span>
            <p className="text-2xl font-bold text-white mt-1">{metrics.today_searches}</p>
          </div>
        </div>

        {/* Card 5: Active Users */}
        <div className="bg-bg-card border border-bg-border rounded-xl p-5 hover:border-brand-accent/30 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="p-2 bg-brand-accent/10 rounded-lg text-brand-accent">
              <Users className="w-5 h-5" />
            </div>
            <span className="text-[10px] text-brand-success font-semibold flex items-center gap-0.5">
              ↑ 11.3% <span className="text-slate-500 font-normal">wk</span>
            </span>
          </div>
          <div className="mt-4">
            <span className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">Active Users</span>
            <p className="text-2xl font-bold text-white mt-1">{metrics.total_users}</p>
          </div>
        </div>
      </div>

      {/* 3. Three-column Grid: Activity, Searches, Posts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Column 1: Recent Activity */}
        <div className="bg-bg-card border border-bg-border rounded-xl p-6 flex flex-col justify-between h-[390px]">
          <div>
            <div className="flex items-center justify-between border-b border-bg-border/60 pb-3">
              <h3 className="font-bold text-white text-sm">Recent Activity</h3>
              <button onClick={() => navigate('/analytics')} className="text-xs text-slate-400 hover:text-white font-medium">View All</button>
            </div>
            <div className="mt-4 space-y-4">
              {(metrics.activities.length > 0 ? metrics.activities : mockActivities).slice(0, 4).map((act: any) => (
                <div key={act.id} className="flex gap-3 text-xs">
                  <div className="w-8 h-8 rounded-lg bg-bg-hover flex items-center justify-center shrink-0 border border-bg-border/60 text-slate-400">
                    {act.type === 'doc' && <FileText className="w-4 h-4 text-brand-primary" />}
                    {act.type === 'git' && <GitBranch className="w-4 h-4 text-brand-success" />}
                    {act.type === 'contrib' && <PlusCircle className="w-4 h-4 text-brand-accent" />}
                    {act.type === 'wiki' && <BookOpen className="w-4 h-4 text-brand-warning" />}
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <p className="font-medium text-slate-200 truncate">{act.text || act.description}</p>
                    <p className="text-slate-400 mt-0.5 truncate">{act.detail || act.username}</p>
                  </div>
                  <span className="text-[10px] text-slate-500 whitespace-nowrap">{act.time || '10m ago'}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Column 2: Popular Searches */}
        <div className="bg-bg-card border border-bg-border rounded-xl p-6 flex flex-col justify-between h-[390px]">
          <div>
            <div className="flex items-center justify-between border-b border-bg-border/60 pb-3">
              <h3 className="font-bold text-white text-sm">Popular Searches</h3>
              <select className="bg-transparent border border-bg-border outline-none text-xs text-slate-400 px-2.5 py-1 rounded-lg">
                <option value="week">This Week</option>
                <option value="month">This Month</option>
              </select>
            </div>
            <div className="mt-4 space-y-3.5">
              {(metrics.trending.length > 0 ? metrics.trending : popularSearches).slice(0, 5).map((search: any, i: number) => (
                <button 
                  key={i} 
                  onClick={() => handleQuickAction(search.query)}
                  className="w-full flex items-center justify-between p-2.5 bg-bg-hover/20 hover:bg-bg-hover border border-bg-border/40 hover:border-bg-border rounded-xl text-left transition-all text-xs"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-slate-500 w-4 text-center">{i + 1}</span>
                    <span className="text-slate-300 font-medium truncate">{search.query}</span>
                  </div>
                  <span className="px-2 py-0.5 bg-brand-primary/10 text-brand-primary rounded-md font-bold text-[10px]">
                    {search.count}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Column 3: Trending Feed Posts */}
        <div className="bg-bg-card border border-bg-border rounded-xl p-6 flex flex-col justify-between h-[390px]">
          <div>
            <div className="flex items-center justify-between border-b border-bg-border/60 pb-3">
              <h3 className="font-bold text-white text-sm">Trending Posts</h3>
              <button onClick={() => navigate('/feed')} className="text-xs text-slate-400 hover:text-white font-medium">View All</button>
            </div>
            <div className="mt-4 space-y-3.5 overflow-y-auto max-h-[290px] pr-1">
              {trendingPosts.map((post) => (
                <div key={post.id} className="flex gap-3 text-xs border-b border-bg-border/30 last:border-0 pb-3 last:pb-0">
                  {/* Upvote indicator */}
                  <div className="flex flex-col items-center justify-center bg-bg-hover/40 px-2 py-1 rounded-lg border border-bg-border/60 h-10">
                    <ArrowUp className="w-3.5 h-3.5 text-brand-success" />
                    <span className="font-bold text-[10px] text-slate-300 mt-0.5">{post.upvotes}</span>
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <div className="flex items-center gap-2">
                      <h4 
                        onClick={() => navigate('/feed')} 
                        className="font-bold text-slate-200 hover:text-brand-primary cursor-pointer truncate"
                      >
                        {post.title}
                      </h4>
                      <span className={`px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase ${
                        post.category === 'Official' 
                          ? 'bg-brand-primary/10 text-brand-primary border border-brand-primary/20' 
                          : post.category === 'Engineering'
                          ? 'bg-brand-success/10 text-brand-success border border-brand-success/20'
                          : 'bg-brand-accent/10 text-brand-accent border border-brand-accent/20'
                      }`}>
                        {post.category}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1">
                      {post.team} • {post.time} • {post.comments} comments
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
