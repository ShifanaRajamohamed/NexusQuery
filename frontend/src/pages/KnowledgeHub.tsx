import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  UploadCloud, 
  Globe, 
  FileText, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  FolderOpen,
  Search,
  BookOpen,
  Sparkles,
  ChevronRight,
  User,
  Shield,
  Tag
} from 'lucide-react';

export const KnowledgeHub: React.FC = () => {
  const { api, user } = useAuth();

  // Page states
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  // URL Form state
  const [urlInput, setUrlInput] = useState('');
  const [urlTitle, setUrlTitle] = useState('');
  const [urlDept, setUrlDept] = useState('Engineering');
  const [urlTags, setUrlTags] = useState('');
  const [urlPerm, setUrlPerm] = useState('Public');

  // File Upload Form state
  const [fileDept, setFileDept] = useState('Engineering');
  const [fileTags, setFileTags] = useState('');
  const [filePerm, setFilePerm] = useState('Public');

  // Upload/parsing status
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'parsing' | 'done' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  // Selected document for chunk preview (DataBloom)
  const [previewDoc, setPreviewDoc] = useState<any | null>(null);
  const [docChunks, setDocChunks] = useState<any[]>([]);
  const [chunksLoading, setChunksLoading] = useState(false);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/knowledge/list');
      setItems(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    setUploadStatus('uploading');
    setErrorMsg('');

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('department', fileDept);
    if (fileTags) formData.append('tags', fileTags);
    formData.append('permission', filePerm);

    try {
      // Simulate progress switching
      setTimeout(() => {
        setUploadStatus('parsing');
      }, 1000);

      await api.post('/api/knowledge/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setUploadStatus('done');
      setSelectedFile(null);
      setFileTags('');
      fetchItems();
      setTimeout(() => setUploadStatus('idle'), 3000);
    } catch (err: any) {
      setUploadStatus('error');
      setErrorMsg(err.response?.data?.detail || 'Upload failed');
    }
  };

  const handleUrlSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput) return;

    setUploadStatus('parsing');
    setErrorMsg('');

    try {
      await api.post('/api/knowledge/index-url', null, {
        params: {
          url: urlInput,
          title: urlTitle || urlInput,
          department: urlDept,
          tags: urlTags || undefined,
          permission: urlPerm
        }
      });
      setUploadStatus('done');
      setUrlInput('');
      setUrlTitle('');
      setUrlTags('');
      fetchItems();
      setTimeout(() => setUploadStatus('idle'), 3000);
    } catch (err: any) {
      setUploadStatus('error');
      setErrorMsg(err.response?.data?.detail || 'URL Indexing failed');
    }
  };

  const handleViewChunks = async (doc: any) => {
    setPreviewDoc(doc);
    setChunksLoading(true);
    try {
      const res = await api.get(`/api/knowledge/${doc.id}/chunks`);
      setDocChunks(res.data);
    } catch (e: any) {
      console.error(e);
      alert(e.response?.data?.detail || "Could not retrieve chunks");
      setPreviewDoc(null);
    } finally {
      setChunksLoading(false);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      
      {/* Page Header */}
      <div>
        <h2 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
          <FolderOpen className="w-5 h-5 text-brand-primary" />
          Centralized Knowledge Hub
        </h2>
        <p className="text-slate-400 text-xs mt-1">Upload and index documents or website URLs into the AI search pipeline.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Upload Panels (Files and URLs) */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* File Upload Widget */}
          <div className="bg-bg-card border border-bg-border rounded-xl p-5 space-y-4">
            <h3 className="font-bold text-white text-sm flex items-center gap-2">
              <UploadCloud className="w-4 h-4 text-brand-primary" />
              Upload Files
            </h3>
            
            <form onSubmit={handleFileUpload} className="space-y-4">
              <label className="border border-dashed border-bg-border hover:border-brand-primary/50 transition-colors rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer text-center group">
                <UploadCloud className="w-8 h-8 text-slate-500 group-hover:text-brand-primary transition-colors mb-2" />
                <span className="text-xs text-slate-300 font-semibold truncate max-w-[200px]">
                  {selectedFile ? selectedFile.name : 'Select PDF, Word, PowerPoint, Text, MD'}
                </span>
                <span className="text-[10px] text-slate-500 mt-1">Max file size 20MB</span>
                <input type="file" onChange={handleFileChange} className="hidden" accept=".pdf,.docx,.pptx,.txt,.md,.html" />
              </label>

              <div className="space-y-3.5 text-xs">
                <div>
                  <label className="block text-slate-400 font-medium mb-1.5">Department</label>
                  <select value={fileDept} onChange={(e) => setFileDept(e.target.value)} className="w-full bg-bg-hover border border-bg-border rounded-lg p-2 text-slate-200 outline-none">
                    <option value="Engineering">Engineering</option>
                    <option value="HR">HR</option>
                    <option value="Finance">Finance</option>
                    <option value="Operations">Operations</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 font-medium mb-1.5">Tags (comma-separated)</label>
                  <input type="text" placeholder="policy, onboarding" value={fileTags} onChange={(e) => setFileTags(e.target.value)} className="w-full bg-bg-hover border border-bg-border rounded-lg p-2 text-slate-200 outline-none placeholder-slate-600" />
                </div>

                <div>
                  <label className="block text-slate-400 font-medium mb-1.5">Permission</label>
                  <select value={filePerm} onChange={(e) => setFilePerm(e.target.value)} className="w-full bg-bg-hover border border-bg-border rounded-lg p-2 text-slate-200 outline-none">
                    <option value="Public">Public (Everyone)</option>
                    <option value="Department">Department Only</option>
                    <option value="Admin">Admin Only</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={!selectedFile || uploadStatus === 'uploading' || uploadStatus === 'parsing'}
                className="w-full py-2 bg-brand-primary hover:bg-brand-primaryHover disabled:bg-brand-primary/45 rounded-lg text-xs font-semibold text-white transition-colors"
              >
                {uploadStatus === 'uploading' && 'UPLOADING FILE...'}
                {uploadStatus === 'parsing' && 'AI PIPELINE PARSING...'}
                {uploadStatus !== 'uploading' && uploadStatus !== 'parsing' && 'START INDEXING'}
              </button>
            </form>
          </div>

          {/* URL Indexing Widget */}
          <div className="bg-bg-card border border-bg-border rounded-xl p-5 space-y-4">
            <h3 className="font-bold text-white text-sm flex items-center gap-2">
              <Globe className="w-4 h-4 text-brand-success" />
              Index Web URLs
            </h3>
            
            <form onSubmit={handleUrlSubmit} className="space-y-4">
              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Source URL</label>
                  <input type="url" required placeholder="https://docs.example.com" value={urlInput} onChange={(e) => setUrlInput(e.target.value)} className="w-full bg-bg-hover border border-bg-border rounded-lg p-2 text-slate-200 outline-none placeholder-slate-600" />
                </div>

                <div>
                  <label className="block text-slate-400 font-medium mb-1">Title</label>
                  <input type="text" required placeholder="Documentation Hub" value={urlTitle} onChange={(e) => setUrlTitle(e.target.value)} className="w-full bg-bg-hover border border-bg-border rounded-lg p-2 text-slate-200 outline-none placeholder-slate-600" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 font-medium mb-1">Department</label>
                    <select value={urlDept} onChange={(e) => setUrlDept(e.target.value)} className="w-full bg-bg-hover border border-bg-border rounded-lg p-2 text-slate-200 outline-none">
                      <option value="Engineering">Engineering</option>
                      <option value="HR">HR</option>
                      <option value="Finance">Finance</option>
                      <option value="Operations">Operations</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-400 font-medium mb-1">Permission</label>
                    <select value={urlPerm} onChange={(e) => setUrlPerm(e.target.value)} className="w-full bg-bg-hover border border-bg-border rounded-lg p-2 text-slate-200 outline-none">
                      <option value="Public">Public</option>
                      <option value="Department">Department</option>
                      <option value="Admin">Admin</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 font-medium mb-1">Tags</label>
                  <input type="text" placeholder="docs, website" value={urlTags} onChange={(e) => setUrlTags(e.target.value)} className="w-full bg-bg-hover border border-bg-border rounded-lg p-2 text-slate-200 outline-none placeholder-slate-600" />
                </div>
              </div>

              <button
                type="submit"
                disabled={!urlInput || uploadStatus === 'parsing'}
                className="w-full py-2 bg-brand-success hover:bg-emerald-600 disabled:bg-brand-success/45 rounded-lg text-xs font-semibold text-white transition-colors"
              >
                {uploadStatus === 'parsing' ? 'SCRAPING & INDEXING...' : 'INDEX WEB URL'}
              </button>
            </form>
          </div>

          {/* Status Message display */}
          {uploadStatus !== 'idle' && (
            <div className={`p-4 rounded-xl text-xs flex gap-3 items-center border ${
              uploadStatus === 'done' 
                ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-400' 
                : uploadStatus === 'error'
                ? 'bg-red-950/20 border-red-500/30 text-red-400'
                : 'bg-indigo-950/20 border-brand-primary/30 text-slate-300'
            }`}>
              {uploadStatus === 'done' && <CheckCircle className="w-5 h-5 shrink-0" />}
              {(uploadStatus === 'uploading' || uploadStatus === 'parsing') && <Clock className="w-5 h-5 shrink-0 animate-spin" />}
              {uploadStatus === 'error' && <AlertTriangle className="w-5 h-5 shrink-0" />}
              
              <div>
                <p className="font-bold">
                  {uploadStatus === 'uploading' && 'Uploading File...'}
                  {uploadStatus === 'parsing' && 'AI Processing Pipeline Active'}
                  {uploadStatus === 'done' && 'Knowledge Index Updated'}
                  {uploadStatus === 'error' && 'Index Job Failed'}
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  {uploadStatus === 'parsing' && 'Running: extract text → dynamic cleaning → semantic chunking → vector FAISS embeds → MySQL metadata mapping.'}
                  {uploadStatus === 'done' && 'Document parsed, embedded, and mapped successfully.'}
                  {uploadStatus === 'error' && errorMsg}
                </p>
              </div>
            </div>
          )}

        </div>

        {/* Indexed Knowledge Table (List View) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-bg-card border border-bg-border rounded-xl p-6">
            <h3 className="font-bold text-white text-sm border-b border-bg-border/60 pb-3">Indexed Knowledge Base</h3>
            
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-500 gap-2">
                <div className="w-6 h-6 border-2 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
                <p className="text-xs">Fetching records...</p>
              </div>
            ) : items.length === 0 ? (
              <div className="text-center py-20 text-slate-500 text-xs">
                No files or URLs have been indexed yet. Start by uploading files or scraping URLs.
              </div>
            ) : (
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="text-slate-500 border-b border-bg-border/60">
                      <th className="pb-3 font-semibold">Title</th>
                      <th className="pb-3 font-semibold">Type</th>
                      <th className="pb-3 font-semibold">Department</th>
                      <th className="pb-3 font-semibold">Permission</th>
                      <th className="pb-3 font-semibold">Created</th>
                      <th className="pb-3 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item) => (
                      <tr key={item.id} className="border-b border-bg-border/40 last:border-0 hover:bg-bg-hover/20 transition-all">
                        <td className="py-3.5 font-medium text-slate-200 max-w-[200px] truncate">{item.title}</td>
                        <td className="py-3.5 text-slate-400 capitalize">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            item.type === 'file' ? 'bg-brand-primary/10 text-brand-primary' : 'bg-brand-success/10 text-brand-success'
                          }`}>
                            {item.type}
                          </span>
                        </td>
                        <td className="py-3.5 text-slate-300">{item.department}</td>
                        <td className="py-3.5 text-slate-400">{item.permission}</td>
                        <td className="py-3.5 text-slate-500">{new Date(item.created_at).toLocaleDateString()}</td>
                        <td className="py-3.5 text-right">
                          <button
                            onClick={() => handleViewChunks(item)}
                            className="px-3 py-1.5 bg-bg-hover hover:bg-brand-primary hover:text-white rounded-lg border border-bg-border hover:border-brand-primary transition-all text-[11px] font-bold flex items-center gap-1 ml-auto"
                          >
                            DataBloom
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* DataBloom Chunk Drawer (Slide-out details panel) */}
      {previewDoc && (
        <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm flex justify-end">
          <div className="w-[500px] bg-bg-card border-l border-bg-border h-full p-6 flex flex-col justify-between text-xs overflow-y-auto">
            <div>
              <div className="flex items-center justify-between border-b border-bg-border pb-4 mb-6">
                <div>
                  <h3 className="font-extrabold text-white text-base">DataBloom Chunk Analyzer</h3>
                  <p className="text-[10px] text-slate-400 mt-0.5 truncate max-w-[350px]">Analyzing: {previewDoc.title}</p>
                </div>
                <button 
                  onClick={() => setPreviewDoc(null)} 
                  className="px-2.5 py-1.5 bg-bg-hover hover:bg-bg-hover/80 text-slate-300 hover:text-white rounded-lg font-bold border border-bg-border"
                >
                  Close
                </button>
              </div>

              {chunksLoading ? (
                <div className="flex flex-col items-center justify-center py-20 text-slate-500 gap-2">
                  <div className="w-6 h-6 border-2 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-xs">Generating previews...</p>
                </div>
              ) : docChunks.length === 0 ? (
                <div className="text-center py-20 text-slate-500">No chunks indexed. Click trigger index again.</div>
              ) : (
                <div className="space-y-6">
                  {docChunks.map((chunk, i) => (
                    <div key={chunk.id} className="bg-bg-hover/20 border border-bg-border rounded-xl p-4.5 space-y-4">
                      
                      {/* Header */}
                      <div className="flex items-center justify-between border-b border-bg-border/60 pb-2">
                        <span className="font-bold text-slate-500">Chunk #{i + 1}</span>
                        <div className="flex items-center gap-1.5 text-brand-accent">
                          <Sparkles className="w-3.5 h-3.5 animate-pulse-subtle" />
                          <span className="text-[10px] font-extrabold uppercase">{chunk.topic || 'Engineering'}</span>
                        </div>
                      </div>

                      {/* Content block */}
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Raw Text Fragment</span>
                        <p className="text-slate-300 bg-bg-dark/45 border border-bg-border/40 p-2.5 rounded-lg font-mono text-[11px] leading-relaxed mt-1.5 max-h-36 overflow-y-auto">
                          {chunk.content}
                        </p>
                      </div>

                      {/* Summary */}
                      {chunk.summary && (
                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">AI Summary</span>
                          <p className="text-slate-300 italic mt-1 font-medium">"{chunk.summary}"</p>
                        </div>
                      )}

                      {/* Keywords & Named entities */}
                      <div className="grid grid-cols-2 gap-4 pt-1.5">
                        {chunk.keywords && (
                          <div className="space-y-1">
                            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider flex items-center gap-1">
                              <Tag className="w-3 h-3 text-brand-primary" /> Keywords
                            </span>
                            <div className="flex flex-wrap gap-1">
                              {chunk.keywords.split(',').map((kw: string, ki: number) => (
                                <span key={ki} className="px-1.5 py-0.5 bg-brand-primary/10 text-brand-primary rounded text-[9px] font-bold truncate max-w-[100px]">{kw.trim()}</span>
                              ))}
                            </div>
                          </div>
                        )}
                        {chunk.named_entities && (
                          <div className="space-y-1">
                            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider flex items-center gap-1">
                              <User className="w-3 h-3 text-brand-success" /> Entities
                            </span>
                            <div className="flex flex-wrap gap-1">
                              {chunk.named_entities.split(',').map((ent: string, ei: number) => (
                                <span key={ei} className="px-1.5 py-0.5 bg-brand-success/10 text-brand-success rounded text-[9px] font-bold truncate max-w-[100px]">{ent.trim()}</span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Embedding indicator */}
                      <div className="border-t border-bg-border/60 pt-2.5 flex items-center justify-between text-[9px] text-slate-500 font-semibold">
                        <span className="flex items-center gap-1"><Shield className="w-3 h-3 text-slate-600" /> Vector: Cosine Float32</span>
                        <span>FAISS ID: {chunk.faiss_id ?? 'N/A'} • Size: 384d</span>
                      </div>

                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
