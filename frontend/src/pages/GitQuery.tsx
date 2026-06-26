import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  GitBranch, 
  PlusCircle, 
  Folder, 
  FileCode, 
  RefreshCw, 
  Search, 
  BookOpen, 
  ExternalLink,
  ChevronDown,
  ChevronRight,
  Code2,
  Terminal,
  Activity
} from 'lucide-react';

export const GitQuery: React.FC = () => {
  const { api } = useAuth();

  // Page list and connection states
  const [repos, setRepos] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [repoName, setRepoName] = useState('');
  const [repoUrl, setRepoUrl] = useState('');
  const [connectLoading, setConnectLoading] = useState(false);

  // Selected Repository & Explorer states
  const [activeRepo, setActiveRepo] = useState<any | null>(null);
  const [fileTree, setFileTree] = useState<any[]>([]);
  const [selectedFile, setSelectedFile] = useState<any | null>(null);
  const [expandedDirs, setExpandedDirs] = useState<{ [key: string]: boolean }>({});
  const [treeLoading, setTreeLoading] = useState(false);

  // Search inside repository
  const [gitSearchQuery, setGitSearchQuery] = useState('');
  const [gitSearchResults, setGitSearchResults] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);

  const fetchRepos = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/git/list');
      setRepos(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRepos();
  }, []);

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!repoName || !repoUrl) return;
    setConnectLoading(true);
    try {
      await api.post('/api/git/connect', {
        name: repoName,
        clone_url: repoUrl
      });
      setRepoName('');
      setRepoUrl('');
      setShowConnectModal(false);
      fetchRepos();
    } catch (err: any) {
      alert(err.response?.data?.detail || "Connection failed");
    } finally {
      setConnectLoading(false);
    }
  };

  const handleSync = async (repoId: number) => {
    try {
      await api.post(`/api/git/${repoId}/sync`);
      fetchRepos();
    } catch (e) {
      console.error(e);
    }
  };

  const handleSelectRepo = async (repo: any) => {
    setActiveRepo(repo);
    setSelectedFile(null);
    setFileTree([]);
    setGitSearchResults([]);
    setGitSearchQuery('');
    
    if (repo.status !== 'Ready') return;

    setTreeLoading(true);
    try {
      const res = await api.get(`/api/git/${repo.id}/tree`);
      setFileTree(res.data);
    } catch (e: any) {
      console.error(e);
      alert(e.response?.data?.detail || "Failed to load directory tree");
    } finally {
      setTreeLoading(false);
    }
  };

  const handleFileClick = async (filePath: string) => {
    if (!activeRepo) return;
    try {
      const res = await api.get(`/api/git/${activeRepo.id}/file`, {
        params: { path: filePath }
      });
      setSelectedFile(res.data);
    } catch (e: any) {
      console.error(e);
      alert(e.response?.data?.detail || "Failed to retrieve code file");
    }
  };

  const handleGitSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gitSearchQuery || !activeRepo) return;
    setSearchLoading(true);
    try {
      const res = await api.post('/api/chat/query', { query: `Repository: ${activeRepo.name} ${gitSearchQuery}` });
      setGitSearchResults(res.data.citations);
    } catch (e: any) {
      console.error(e);
      alert(e.response?.data?.detail || "Search failed");
    } finally {
      setSearchLoading(false);
    }
  };

  const toggleDir = (dirPath: string) => {
    setExpandedDirs(prev => ({
      ...prev,
      [dirPath]: !prev[dirPath]
    }));
  };

  // Directory tree builder component (Recursive)
  const renderTree = (nodes: any[]) => {
    return nodes.map((node) => {
      if (node.type === 'directory') {
        const isExpanded = !!expandedDirs[node.path];
        return (
          <div key={node.path} className="pl-3.5 space-y-1">
            <button 
              onClick={() => toggleDir(node.path)}
              className="flex items-center gap-1.5 py-1 text-slate-300 hover:text-white transition-colors"
            >
              {isExpanded ? <ChevronDown className="w-3.5 h-3.5 text-slate-500" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-500" />}
              <Folder className="w-3.5 h-3.5 text-brand-primary" />
              <span className="font-medium truncate max-w-[150px]">{node.name}</span>
            </button>
            {isExpanded && node.children && (
              <div className="border-l border-bg-border pl-1.5 ml-2.5">
                {renderTree(node.children)}
              </div>
            )}
          </div>
        );
      } else {
        return (
          <div key={node.path} className="pl-3.5">
            <button 
              onClick={() => handleFileClick(node.path)}
              className="flex items-center gap-1.5 py-1 text-slate-400 hover:text-white transition-colors truncate max-w-[190px]"
            >
              <FileCode className="w-3.5 h-3.5 text-slate-500" />
              <span>{node.name}</span>
            </button>
          </div>
        );
      }
    });
  };

  return (
    <div className="space-y-8 pb-12 h-[calc(100vh-100px)] flex flex-col">
      
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <GitBranch className="w-5 h-5 text-brand-success" />
            GitQuery Code Repository Search
          </h2>
          <p className="text-slate-400 text-xs mt-1">Connect Git repos, chunk code files, generate embeddings, and query repositories.</p>
        </div>
        <button
          onClick={() => setShowConnectModal(true)}
          className="px-4 py-2 bg-brand-primary hover:bg-brand-primaryHover text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-brand-primary/10 transition-colors"
        >
          <PlusCircle className="w-3.5 h-3.5" />
          Connect Repository
        </button>
      </div>

      {/* Main Workspace Layout */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-6 overflow-hidden">
        
        {/* Sidebar: Repositories List */}
        <div className="lg:col-span-1 bg-bg-card border border-bg-border rounded-xl p-4 flex flex-col overflow-hidden h-full">
          <h3 className="font-bold text-white text-xs border-b border-bg-border pb-3 flex items-center gap-2 shrink-0">
            <GitBranch className="w-3.5 h-3.5 text-brand-success" />
            Repositories
          </h3>
          <div className="flex-1 overflow-y-auto mt-3.5 space-y-2">
            {loading ? (
              <div className="text-center py-6 text-slate-500 text-xs">Loading repos...</div>
            ) : repos.length === 0 ? (
              <div className="text-center py-6 text-slate-500 text-xs">No repositories connected.</div>
            ) : (
              repos.map((repo) => (
                <button
                  key={repo.id}
                  onClick={() => handleSelectRepo(repo)}
                  className={`w-full text-left p-3 rounded-xl border transition-all text-xs space-y-2 flex flex-col justify-between ${
                    activeRepo?.id === repo.id
                      ? 'bg-brand-primary/10 border-brand-primary'
                      : 'bg-bg-hover/20 border-bg-border hover:border-slate-700'
                  }`}
                >
                  <div className="flex justify-between w-full">
                    <span className="font-bold text-slate-200 truncate pr-2">{repo.name}</span>
                    <span className={`px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase ${
                      repo.status === 'Ready' 
                        ? 'bg-brand-success/10 text-brand-success' 
                        : repo.status === 'Failed'
                        ? 'bg-brand-danger/10 text-brand-danger'
                        : 'bg-brand-warning/10 text-brand-warning animate-pulse'
                    }`}>
                      {repo.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-500 w-full pt-1.5 border-t border-bg-border/60">
                    <span className="truncate max-w-[100px]">{repo.clone_url}</span>
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleSync(repo.id); }}
                      className="p-1 hover:bg-bg-hover rounded hover:text-white"
                    >
                      <RefreshCw className="w-3 h-3" />
                    </button>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Center/Right Layout: Code Explorer and search */}
        <div className="lg:col-span-3 flex gap-6 overflow-hidden h-full">
          
          {activeRepo ? (
            <>
              {/* File Tree Explorer (collapsible) */}
              <div className="w-64 bg-bg-card border border-bg-border rounded-xl p-4 flex flex-col overflow-hidden h-full">
                <h4 className="font-bold text-white text-xs border-b border-bg-border pb-3 shrink-0 flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-slate-400" />
                  Code Explorer
                </h4>
                
                <div className="flex-1 overflow-y-auto mt-3 text-xs space-y-1">
                  {treeLoading ? (
                    <div className="text-center py-6 text-slate-500">Loading files...</div>
                  ) : fileTree.length === 0 ? (
                    <div className="text-center py-6 text-slate-500">Repository status is "{activeRepo.status}"</div>
                  ) : (
                    renderTree(fileTree)
                  )}
                </div>
              </div>

              {/* Document/Code Editor Display */}
              <div className="flex-1 bg-bg-card border border-bg-border rounded-xl p-5 flex flex-col overflow-hidden h-full">
                {/* Search Bar Specific to active repo */}
                <form onSubmit={handleGitSearch} className="mb-4 shrink-0 flex gap-2.5">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type="text"
                      placeholder={`Search inside codebase ${activeRepo.name} (e.g. explain jwt auth)...`}
                      value={gitSearchQuery}
                      onChange={(e) => setGitSearchQuery(e.target.value)}
                      className="w-full bg-bg-hover border border-bg-border focus:border-brand-primary outline-none py-2 pl-10 pr-4 rounded-xl text-xs text-slate-200 placeholder-slate-600"
                    />
                  </div>
                  <button type="submit" className="px-4 py-2 bg-brand-primary hover:bg-brand-primaryHover text-white rounded-xl text-xs font-semibold">
                    Query Repo
                  </button>
                </form>

                {/* Content Panel (Toggles between Code View and Search Results) */}
                <div className="flex-1 overflow-y-auto">
                  {searchLoading ? (
                    <div className="flex flex-col items-center justify-center py-20 text-slate-500 gap-2">
                      <div className="w-6 h-6 border-2 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
                      <p className="text-xs">Analyzing code queries...</p>
                    </div>
                  ) : gitSearchResults.length > 0 ? (
                    /* Search results inside code */
                    <div className="space-y-4">
                      <h4 className="font-bold text-white text-xs border-b border-bg-border pb-2 flex items-center gap-1.5">
                        <Activity className="w-3.5 h-3.5 text-brand-success" />
                        Code Matches
                      </h4>
                      {gitSearchResults.map((match, i) => (
                        <div key={i} className="bg-bg-hover/20 border border-bg-border rounded-xl p-4 space-y-3.5">
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-bold text-slate-300 flex items-center gap-1">
                              <FileCode className="w-3.5 h-3.5 text-slate-500" /> {match.file_path || 'Code File'}
                            </span>
                            <button 
                              onClick={() => handleFileClick(match.file_path)}
                              className="text-brand-primary hover:underline text-[10px] font-semibold flex items-center gap-0.5"
                            >
                              Open file <ExternalLink className="w-3 h-3" />
                            </button>
                          </div>
                          <pre className="p-3 bg-bg-dark/45 border border-bg-border/40 rounded-lg text-slate-300 font-mono text-[11px] leading-relaxed overflow-x-auto">
                            {match.chunk_content}
                          </pre>
                        </div>
                      ))}
                    </div>
                  ) : selectedFile ? (
                    /* File Code Viewer */
                    <div className="space-y-3 h-full flex flex-col">
                      <div className="flex justify-between items-center text-xs border-b border-bg-border pb-3 shrink-0">
                        <span className="font-bold text-slate-200 flex items-center gap-2">
                          <Code2 className="w-4 h-4 text-brand-primary" />
                          {selectedFile.name}
                        </span>
                        <span className="text-slate-500 font-mono">{selectedFile.path}</span>
                      </div>
                      <pre className="flex-1 p-4 bg-bg-dark/30 border border-bg-border/30 rounded-xl text-slate-300 font-mono text-[11.5px] leading-relaxed overflow-auto select-text">
                        <code>{selectedFile.content}</code>
                      </pre>
                    </div>
                  ) : (
                    /* Dashboard instructions */
                    <div className="flex flex-col items-center justify-center py-24 text-slate-500 text-center space-y-2">
                      <Code2 className="w-10 h-10 stroke-[1.2] text-slate-600 mb-1" />
                      <p className="text-xs font-semibold text-slate-400">Code Inspection Panel</p>
                      <p className="text-[10px] max-w-sm text-slate-500">Select any file from the explorer tree on the left, or write queries inside the search bar above to fetch code embeddings.</p>
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 bg-bg-card border border-bg-border rounded-xl flex flex-col items-center justify-center text-center p-8 text-slate-500 space-y-2.5">
              <GitBranch className="w-12 h-12 stroke-[1.1] text-slate-600 mb-1.5" />
              <p className="text-sm font-semibold text-slate-400">GitQuery Playground</p>
              <p className="text-xs max-w-md">Please select a connected repository from the list on the left to browse its file tree, read source code files, or query code chunk search matches.</p>
            </div>
          )}

        </div>

      </div>

      {/* Connection modal */}
      {showConnectModal && (
        <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleConnect} className="w-full max-w-md bg-bg-card border border-bg-border shadow-2xl rounded-2xl p-6 space-y-4 text-xs">
            <h3 className="font-extrabold text-white text-base">Connect Git Repository</h3>
            <p className="text-slate-400 text-[10px]">Add repository cloning details to parse, chunk, and embed source code files.</p>
            
            <div className="space-y-3">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Repository Name</label>
                <input 
                  type="text" 
                  required 
                  placeholder="nexus-api" 
                  value={repoName} 
                  onChange={(e) => setRepoName(e.target.value)} 
                  className="w-full bg-bg-hover border border-bg-border focus:border-brand-primary outline-none py-2 px-3 rounded-lg text-slate-200 placeholder-slate-600"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Clone URL (HTTPS or SSH)</label>
                <input 
                  type="text" 
                  required 
                  placeholder="https://github.com/nexusquery/backend.git" 
                  value={repoUrl} 
                  onChange={(e) => setRepoUrl(e.target.value)} 
                  className="w-full bg-bg-hover border border-bg-border focus:border-brand-primary outline-none py-2 px-3 rounded-lg text-slate-200 placeholder-slate-600"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-3">
              <button
                type="button"
                onClick={() => setShowConnectModal(false)}
                className="flex-1 py-2 border border-bg-border hover:bg-bg-hover rounded-xl font-bold text-slate-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={connectLoading}
                className="flex-1 py-2 bg-brand-primary hover:bg-brand-primaryHover disabled:bg-brand-primary/50 text-white font-bold rounded-xl"
              >
                {connectLoading ? 'Cloning Repo...' : 'Clone & Index'}
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
};
