import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  BookOpen, 
  PlusCircle, 
  RefreshCw, 
  Globe, 
  CheckCircle, 
  Search, 
  CornerDownRight,
  Database,
  ArrowUpRight
} from 'lucide-react';

export const WikiQuery: React.FC = () => {
  const { api } = useAuth();

  // Lists and add state
  const [wikis, setWikis] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  
  // Connection states
  const [wikiTitle, setWikiTitle] = useState('');
  const [wikiType, setWikiType] = useState('Confluence');
  const [wikiUrl, setWikiUrl] = useState('');
  const [connectLoading, setConnectLoading] = useState(false);

  // Wiki searches
  const [wikiSearchQuery, setWikiSearchQuery] = useState('');
  const [wikiSearchResults, setWikiSearchResults] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);

  const fetchWikis = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/wiki/list');
      setWikis(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWikis();
  }, []);

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wikiTitle || !wikiUrl) return;
    setConnectLoading(true);
    try {
      await api.post('/api/wiki/connect', {
        title: wikiTitle,
        type: wikiType,
        source_url: wikiUrl
      });
      setWikiTitle('');
      setWikiUrl('');
      setShowAddModal(false);
      fetchWikis();
    } catch (err: any) {
      alert(err.response?.data?.detail || "Connection failed");
    } finally {
      setConnectLoading(false);
    }
  };

  const handleSync = async (wikiId: number) => {
    try {
      await api.post(`/api/wiki/${wikiId}/sync`);
      fetchWikis();
    } catch (e) {
      console.error(e);
    }
  };

  const handleWikiSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wikiSearchQuery) return;
    setSearchLoading(true);
    try {
      const res = await api.post('/api/chat/query', { query: `Wiki: ${wikiSearchQuery}` });
      setWikiSearchResults(res.data.citations);
    } catch (e: any) {
      console.error(e);
      alert(e.response?.data?.detail || "Search failed");
    } finally {
      setSearchLoading(false);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-brand-primary" />
            WikiQuery Integrations
          </h2>
          <p className="text-slate-400 text-xs mt-1">Connect corporate documentation channels, Notion workspaces, or Confluence directories.</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-brand-primary hover:bg-brand-primaryHover text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-brand-primary/10 transition-colors"
        >
          <PlusCircle className="w-3.5 h-3.5" />
          Add Wiki Integration
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Side: integrations lists */}
        <div className="lg:col-span-1 bg-bg-card border border-bg-border rounded-xl p-5 space-y-4">
          <h3 className="font-bold text-white text-xs border-b border-bg-border pb-3">Workspace Integrations</h3>
          
          <div className="space-y-3.5">
            {loading ? (
              <div className="text-center py-6 text-slate-500">Loading integrations...</div>
            ) : wikis.length === 0 ? (
              <div className="text-center py-6 text-slate-500 text-xs">No workspaces connected yet.</div>
            ) : (
              wikis.map((wiki) => (
                <div key={wiki.id} className="p-3.5 bg-bg-hover/20 border border-bg-border rounded-xl flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3 overflow-hidden pr-2">
                    <div className="w-8 h-8 rounded-lg bg-bg-hover flex items-center justify-center shrink-0 border border-bg-border/60">
                      <Globe className="w-4 h-4 text-brand-primary" />
                    </div>
                    <div className="overflow-hidden">
                      <h4 className="font-bold text-slate-200 truncate">{wiki.title}</h4>
                      <p className="text-[10px] text-slate-500 uppercase font-semibold mt-0.5 tracking-wider">{wiki.type}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase ${
                      wiki.status === 'Ready' 
                        ? 'bg-brand-success/10 text-brand-success' 
                        : 'bg-brand-warning/10 text-brand-warning animate-pulse'
                    }`}>
                      {wiki.status}
                    </span>
                    <button 
                      onClick={() => handleSync(wiki.id)}
                      className="p-1.5 hover:bg-bg-hover rounded hover:text-white transition-colors"
                    >
                      <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Side: Wiki query bar and citations search */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-bg-card border border-bg-border rounded-xl p-5 space-y-5">
            <h3 className="font-bold text-white text-xs border-b border-bg-border pb-3 flex items-center gap-2">
              <Search className="w-4 h-4 text-brand-primary" />
              Query Integrations
            </h3>

            <form onSubmit={handleWikiSearch} className="flex gap-2">
              <input
                type="text"
                required
                placeholder="Ask questions (e.g. explain vacation policy or deployment guidelines)..."
                value={wikiSearchQuery}
                onChange={(e) => setWikiSearchQuery(e.target.value)}
                className="flex-1 bg-bg-hover border border-bg-border focus:border-brand-primary outline-none py-2 px-3.5 rounded-xl text-xs text-slate-200 placeholder-slate-600"
              />
              <button type="submit" className="px-5 py-2 bg-brand-primary hover:bg-brand-primaryHover text-white rounded-xl text-xs font-semibold">
                Search Wikis
              </button>
            </form>

            <div className="space-y-4">
              {searchLoading ? (
                <div className="flex flex-col items-center justify-center py-20 text-slate-500 gap-2">
                  <div className="w-6 h-6 border-2 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-xs">Crawling indexed articles...</p>
                </div>
              ) : wikiSearchResults.length > 0 ? (
                wikiSearchResults.map((match, i) => (
                  <div key={i} className="bg-bg-hover/20 border border-bg-border rounded-xl p-4 space-y-3">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-slate-300 flex items-center gap-1.5">
                        <CornerDownRight className="w-3.5 h-3.5 text-brand-primary" /> {match.title}
                      </span>
                      {match.source_url && (
                        <a 
                          href={match.source_url} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="text-brand-primary hover:underline text-[10px] font-semibold flex items-center gap-0.5"
                        >
                          View source <ArrowUpRight className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                    <p className="text-slate-300 font-mono text-[11px] leading-relaxed bg-bg-dark/45 border border-bg-border/40 p-2.5 rounded-lg">
                      {match.chunk_content}
                    </p>
                  </div>
                ))
              ) : (
                <div className="text-center py-16 text-slate-500 text-xs flex flex-col items-center gap-1">
                  <Database className="w-8 h-8 stroke-[1.2] text-slate-600 mb-1" />
                  No query results displayed yet. Connect Confluence or Notion sources to search wiki SOPs.
                </div>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* Add wiki Integration modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleConnect} className="w-full max-w-md bg-bg-card border border-bg-border shadow-2xl rounded-2xl p-6 space-y-4 text-xs">
            <h3 className="font-extrabold text-white text-base">Add Workspace Integration</h3>
            <p className="text-slate-400 text-[10px]">Index directories by inputting your corporate credentials or Confluence/Notion API URLs.</p>
            
            <div className="space-y-3">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Integration Title</label>
                <input 
                  type="text" 
                  required 
                  placeholder="Confluence Engineering Wiki" 
                  value={wikiTitle} 
                  onChange={(e) => setWikiTitle(e.target.value)} 
                  className="w-full bg-bg-hover border border-bg-border focus:border-brand-primary outline-none py-2 px-3 rounded-lg text-slate-200 placeholder-slate-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Source Type</label>
                  <select 
                    value={wikiType} 
                    onChange={(e) => setWikiType(e.target.value)} 
                    className="w-full bg-bg-hover border border-bg-border focus:border-brand-primary outline-none py-2 px-2.5 rounded-lg text-slate-200"
                  >
                    <option value="Confluence">Confluence</option>
                    <option value="Notion">Notion</option>
                    <option value="Wiki">Custom Wiki</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Sync Schedule</label>
                  <select className="w-full bg-bg-hover border border-bg-border focus:border-brand-primary outline-none py-2 px-2.5 rounded-lg text-slate-200">
                    <option value="realtime">Real-time Hook</option>
                    <option value="daily">Daily Crawl</option>
                    <option value="weekly">Weekly Sync</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Workspace Link (URL)</label>
                <input 
                  type="url" 
                  required 
                  placeholder="https://company.atlassian.net/wiki" 
                  value={wikiUrl} 
                  onChange={(e) => setWikiUrl(e.target.value)} 
                  className="w-full bg-bg-hover border border-bg-border focus:border-brand-primary outline-none py-2 px-3 rounded-lg text-slate-200 placeholder-slate-600"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-3">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="flex-1 py-2 border border-bg-border hover:bg-bg-hover rounded-xl font-bold text-slate-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={connectLoading}
                className="flex-1 py-2 bg-brand-primary hover:bg-brand-primaryHover disabled:bg-brand-primary/50 text-white font-bold rounded-xl"
              >
                {connectLoading ? 'Connecting Workspace...' : 'Integrate Sync'}
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
};
