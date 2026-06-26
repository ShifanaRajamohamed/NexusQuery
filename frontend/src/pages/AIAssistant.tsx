import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  MessageSquare, 
  Send, 
  Sparkles, 
  FileText, 
  GitBranch, 
  BookOpen, 
  ArrowRight,
  ShieldAlert,
  CornerDownRight,
  HelpCircle,
  ExternalLink,
  ChevronRight,
  Maximize2
} from 'lucide-react';

interface Citation {
  chunk_id: number;
  document_id: number;
  title: string;
  type: string;
  source_url?: string;
  file_path?: string;
  chunk_content: string;
  confidence: number;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  citations?: Citation[];
  confidence_score?: number;
  related_questions?: string[];
  isStreaming?: boolean;
}

export const AIAssistant: React.FC = () => {
  const { token } = useAuth();
  const location = useLocation();

  // Chat message list
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: "Hello! I am **NexusQuery AI**, your enterprise knowledge operating system. I can search corporate documents, codebase repositories, Confluence wikis, and SOP policies. How can I help you today?\n\n**Try asking:**\n- *How do I deploy this application?*\n- *Explain our leave policy.*\n- *Where is JWT implemented?*",
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Citation details drawer
  const [activeCitation, setActiveCitation] = useState<Citation | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Read prefilled query parameters (?q=...)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const q = params.get('q');
    if (q) {
      handleSendMessage(q);
    }
  }, [location.search]);

  const handleSendMessage = async (textToSend: string) => {
    const queryText = textToSend.trim();
    if (!queryText) return;

    setInput('');
    setLoading(true);

    const userMsgId = Date.now().toString();
    const assistantMsgId = (Date.now() + 1).toString();

    // 1. Add User Message
    const userMsg: Message = { id: userMsgId, role: 'user', content: queryText };
    // 2. Add empty streaming Assistant Message
    const initialAssistantMsg: Message = { 
      id: assistantMsgId, 
      role: 'assistant', 
      content: '', 
      isStreaming: true 
    };

    setMessages(prev => [...prev, userMsg, initialAssistantMsg]);

    try {
      // Stream response using fetch ReadableStream
      const response = await fetch('http://localhost:8000/api/chat/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ query: queryText })
      });

      if (!response.ok) {
        throw new Error(`HTTP Error ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let accumulatedAnswer = '';

      if (reader) {
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;

          const chunkText = decoder.decode(value);
          // Split chunk text by double newlines since SSE streams double newlines
          const lines = chunkText.split('\n\n');
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const parsed = JSON.parse(line.substring(6));
                
                // Case 1: SSE Streaming text tokens
                if (parsed.token) {
                  accumulatedAnswer += parsed.token;
                  setMessages(prev => prev.map(msg => 
                    msg.id === assistantMsgId 
                      ? { ...msg, content: accumulatedAnswer } 
                      : msg
                  ));
                }
                
                // Case 2: SSE finished with metadata payload (Done)
                if (parsed.done) {
                  setMessages(prev => prev.map(msg => 
                    msg.id === assistantMsgId 
                      ? { 
                          ...msg, 
                          content: msg.content.trim() || accumulatedAnswer.trim(),
                          isStreaming: false,
                          confidence_score: parsed.confidence_score,
                          citations: parsed.citations,
                          related_questions: parsed.related_questions
                        } 
                      : msg
                  ));
                }
              } catch (jsonErr) {
                // Ignore incomplete JSON chunks during buffer segments
              }
            }
          }
        }
      }
    } catch (error: any) {
      console.error(error);
      setMessages(prev => prev.map(msg => 
        msg.id === assistantMsgId 
          ? { 
              ...msg, 
              content: `Error connecting to backend: ${error.message || 'Verification failed.'}. Please make sure backend is online.`, 
              isStreaming: false 
            } 
          : msg
      ));
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendMessage(input);
  };

  return (
    <div className="h-[calc(100vh-100px)] flex gap-6 overflow-hidden">
      
      {/* Chat workspace area */}
      <div className="flex-1 bg-bg-card border border-bg-border rounded-xl flex flex-col overflow-hidden h-full">
        {/* Workspace header */}
        <div className="p-4 border-b border-bg-border shrink-0 flex items-center gap-3 bg-bg-hover/20">
          <div className="w-8 h-8 rounded-lg bg-brand-primary flex items-center justify-center text-white">
            <Sparkles className="w-4 h-4 text-indigo-100" />
          </div>
          <div>
            <h3 className="font-extrabold text-white text-sm">Enterprise Assistant Chat</h3>
            <p className="text-[10px] text-slate-500 font-semibold tracking-wider uppercase">Copilot Interface</p>
          </div>
        </div>

        {/* Message scroll container */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.map((msg) => (
            <div 
              key={msg.id} 
              className={`flex gap-4 max-w-3xl ${msg.role === 'user' ? 'ml-auto flex-row-reverse' : ''}`}
            >
              {/* Avatar */}
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold ${
                msg.role === 'user' 
                  ? 'bg-brand-accent/20 text-brand-accent border border-brand-accent/40' 
                  : 'bg-brand-primary/20 text-brand-primary border border-brand-primary/40'
              }`}>
                {msg.role === 'user' ? 'ME' : 'AI'}
              </div>

              <div className="space-y-4">
                {/* Bubble Text */}
                <div className={`p-4 rounded-2xl text-xs leading-relaxed ${
                  msg.role === 'user' 
                    ? 'bg-brand-primary text-white font-medium shadow-md shadow-brand-primary/10' 
                    : 'bg-bg-hover/40 border border-bg-border/60 text-slate-200 select-text whitespace-pre-line'
                }`}>
                  {msg.content}
                  {msg.isStreaming && (
                    <span className="inline-block w-1.5 h-3 ml-1 bg-brand-primary animate-pulse"></span>
                  )}
                </div>

                {/* Metadata details (citations, confidence, suggestions) */}
                {msg.role === 'assistant' && !msg.isStreaming && (msg.citations || msg.confidence_score) && (
                  <div className="pl-2 space-y-4 max-w-2xl">
                    
                    {/* Confidence score pill */}
                    {msg.confidence_score !== undefined && (
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Confidence Score:</span>
                        <span className={`px-2 py-0.5 rounded font-extrabold text-[10px] border ${
                          msg.confidence_score >= 0.8
                            ? 'bg-brand-success/10 text-brand-success border-brand-success/20'
                            : msg.confidence_score >= 0.5
                            ? 'bg-brand-warning/10 text-brand-warning border-brand-warning/20'
                            : 'bg-brand-danger/10 text-brand-danger border-brand-danger/20'
                        }`}>
                          {parseInt((msg.confidence_score * 100).toString())}%
                        </span>
                      </div>
                    )}

                    {/* Inline clickable citations list */}
                    {msg.citations && msg.citations.length > 0 && (
                      <div className="space-y-2">
                        <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block">Source Documents</span>
                        <div className="flex flex-wrap gap-2">
                          {msg.citations.map((cit, idx) => (
                            <button 
                              key={cit.chunk_id}
                              onClick={() => setActiveCitation(cit)}
                              className="px-3 py-1.5 bg-bg-hover hover:bg-bg-hover/80 border border-bg-border rounded-xl text-slate-300 hover:text-white transition-all text-[11px] font-medium flex items-center gap-1.5"
                            >
                              {cit.type === 'file' && <FileText className="w-3.5 h-3.5 text-brand-primary" />}
                              {cit.type === 'git' && <GitBranch className="w-3.5 h-3.5 text-brand-success" />}
                              {cit.type === 'wiki' && <BookOpen className="w-3.5 h-3.5 text-brand-warning" />}
                              <span className="truncate max-w-[120px] font-bold">[{idx + 1}] {cit.title}</span>
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Follow-up question suggestion buttons */}
                    {msg.related_questions && msg.related_questions.length > 0 && (
                      <div className="space-y-2 pt-2">
                        <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider flex items-center gap-1">
                          <HelpCircle className="w-3 h-3 text-brand-primary" /> Suggested Follow-up
                        </span>
                        <div className="space-y-1.5">
                          {msg.related_questions.map((q, idx) => (
                            <button 
                              key={idx}
                              onClick={() => handleSendMessage(q)}
                              className="w-full text-left px-3 py-2 bg-bg-hover/10 hover:bg-bg-hover/50 border border-bg-border/60 hover:border-brand-primary/40 rounded-xl text-slate-300 hover:text-white transition-all flex items-center justify-between group"
                            >
                              <span>{q}</span>
                              <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-white transition-colors" />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                  </div>
                )}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input box */}
        <form onSubmit={handleFormSubmit} className="p-4 border-t border-bg-border shrink-0 flex gap-2 bg-bg-hover/20">
          <input
            type="text"
            required
            disabled={loading}
            placeholder="Ask natural language questions from documents, codebase directories or policies..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-1 bg-bg-hover border border-bg-border focus:border-brand-primary/80 focus:ring-1 focus:ring-brand-primary outline-none py-2.5 px-4 rounded-xl text-xs text-slate-200 placeholder-slate-600 disabled:opacity-50"
          />
          <button 
            type="submit" 
            disabled={loading || !input}
            className="px-5 py-2.5 bg-brand-primary hover:bg-brand-primaryHover disabled:bg-brand-primary/50 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-brand-primary/10 transition-colors shrink-0"
          >
            {loading ? 'Thinking...' : 'Send'}
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>

      {/* Citation Inspector Side drawer (visible when activeCitation is set) */}
      {activeCitation && (
        <div className="w-96 bg-bg-card border border-bg-border rounded-xl p-5 flex flex-col justify-between overflow-y-auto h-full animate-fade-in shrink-0">
          <div className="space-y-5">
            <div className="flex items-center justify-between border-b border-bg-border pb-3">
              <div>
                <h4 className="font-extrabold text-white text-sm">Source Document inspector</h4>
                <p className="text-[9px] uppercase tracking-wider font-semibold text-slate-500 mt-0.5">Citation details</p>
              </div>
              <button 
                onClick={() => setActiveCitation(null)}
                className="px-2.5 py-1.5 bg-bg-hover hover:bg-bg-hover/80 border border-bg-border text-slate-300 rounded-lg text-[10px]"
              >
                Close
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-3 bg-bg-hover/20 border border-bg-border rounded-xl space-y-2">
                <div className="flex items-center gap-2">
                  {activeCitation.type === 'file' && <FileText className="w-4 h-4 text-brand-primary" />}
                  {activeCitation.type === 'git' && <GitBranch className="w-4 h-4 text-brand-success" />}
                  {activeCitation.type === 'wiki' && <BookOpen className="w-4 h-4 text-brand-warning" />}
                  <span className="font-bold text-slate-200">{activeCitation.title}</span>
                </div>
                
                {activeCitation.file_path && (
                  <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                    <CornerDownRight className="w-3 h-3 text-slate-500" />
                    Path: {activeCitation.file_path}
                  </div>
                )}
                {activeCitation.source_url && (
                  <a 
                    href={activeCitation.source_url} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="text-[10px] text-brand-primary hover:underline flex items-center gap-0.5 font-semibold mt-1"
                  >
                    View website link <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Indexed Content snippet</span>
                <p className="text-slate-300 bg-bg-dark/45 border border-bg-border/40 p-3 rounded-xl font-mono text-[11px] leading-relaxed mt-1.5 max-h-[300px] overflow-y-auto whitespace-pre-wrap select-text border-l-2 border-l-brand-primary">
                  {activeCitation.chunk_content}
                </p>
              </div>

              {activeCitation.confidence && (
                <div className="flex items-center justify-between text-[10px] text-slate-500 font-semibold border-t border-bg-border/60 pt-3">
                  <span>Match Strength</span>
                  <span className="text-slate-300">{parseInt((activeCitation.confidence * 100).toString())}% Cosine Similarity</span>
                </div>
              )}

            </div>
          </div>
        </div>
      )}

    </div>
  );
};
