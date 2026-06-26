import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Rss, 
  ArrowUp, 
  Bookmark, 
  MessageSquare, 
  Send, 
  User, 
  Tag, 
  Check, 
  Megaphone, 
  HelpCircle,
  TrendingUp,
  Award
} from 'lucide-react';

interface FeedProps {
  forceTrending?: boolean;
  forceBookmarks?: boolean;
}

export const Feed: React.FC<FeedProps> = ({ forceTrending = false, forceBookmarks = false }) => {
  const { api, user } = useAuth();

  // Feed posts state
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Form upload state
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [type, setType] = useState('Post'); // Announcement, Post, Question
  const [postTags, setPostTags] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);

  // Active commenting post ID
  const [activeCommentPost, setActiveCommentPost] = useState<number | null>(null);
  const [commentInput, setCommentInput] = useState('');

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/feed/posts');
      let data = res.data;

      // Filter or sort based on routing props
      if (forceTrending) {
        data.sort((a: any, b: any) => b.upvotes - a.upvotes);
      } else if (forceBookmarks) {
        // Mock filtering bookmarks
        data = data.filter((p: any, idx: number) => idx % 2 === 0);
      }

      setPosts(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [forceTrending, forceBookmarks]);

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content) return;
    setSubmitLoading(true);
    try {
      await api.post('/api/feed/post', {
        title,
        content,
        type,
        tags: postTags || undefined
      });
      setTitle('');
      setContent('');
      setPostTags('');
      fetchPosts();
    } catch (err: any) {
      alert(err.response?.data?.detail || "Failed to publish post");
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleVote = async (postId: number, voteType: 'upvote' | 'downvote') => {
    try {
      const res = await api.post(`/api/feed/posts/${postId}/vote`, null, {
        params: { vote_type: voteType }
      });
      // Update local upvote count
      setPosts(prev => prev.map(p => 
        p.id === postId 
          ? { 
              ...p, 
              upvotes: res.data.upvotes,
              has_upvoted: voteType === 'upvote' ? !p.has_upvoted : p.has_upvoted 
            } 
          : p
      ));
    } catch (e) {
      console.error(e);
    }
  };

  const handleBookmarkToggle = (postId: number) => {
    // Simulated bookmark switch
    setPosts(prev => prev.map(p => 
      p.id === postId ? { ...p, has_bookmarked: !p.has_bookmarked, bookmarks: p.has_bookmarked ? p.bookmarks - 1 : p.bookmarks + 1 } : p
    ));
  };

  const handleCommentSubmit = async (e: React.FormEvent, postId: number) => {
    e.preventDefault();
    if (!commentInput.trim()) return;

    try {
      const res = await api.post(`/api/feed/posts/${postId}/comment`, {
        content: commentInput
      });
      
      // Inject comments dynamically into posts list
      setPosts(prev => prev.map(p => 
        p.id === postId 
          ? { ...p, comments: [...(p.comments || []), res.data] } 
          : p
      ));
      setCommentInput('');
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      
      {/* Header */}
      <div>
        <h2 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
          {forceTrending ? <TrendingUp className="w-5 h-5 text-brand-success" /> : forceBookmarks ? <Bookmark className="w-5 h-5 text-brand-accent" /> : <Rss className="w-5 h-5 text-brand-primary" />}
          {forceTrending ? 'Trending Knowledge Board' : forceBookmarks ? 'My Bookmarked knowledge' : 'Collaborative Enterprise Feed'}
        </h2>
        <p className="text-slate-400 text-xs mt-1">
          {forceTrending ? 'Top rated employee posts and announcements sorting by upvotes.' : forceBookmarks ? 'Articles and topics pinned to your profile.' : 'Share announcements, ask organizational questions, and collaborate.'}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Feed Column */}
        <div className="lg:col-span-2 space-y-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-500 gap-2">
              <div className="w-6 h-6 border-2 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
              <p className="text-xs">Loading feed...</p>
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-20 text-slate-500 border border-bg-border rounded-xl bg-bg-card text-xs">
              No feed posts matching this category found.
            </div>
          ) : (
            posts.map((post) => (
              <div key={post.id} className="bg-bg-card border border-bg-border rounded-xl p-5 space-y-4 hover:border-slate-700 transition-all select-text">
                
                {/* Meta details */}
                <div className="flex justify-between items-start text-xs text-slate-400">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-brand-primary/10 border border-brand-primary/30 flex items-center justify-center text-brand-primary font-bold text-[10px]">
                      {post.author_username ? post.author_username[0].toUpperCase() : 'U'}
                    </div>
                    <span className="font-bold text-slate-300">{post.author_username}</span>
                    <span>•</span>
                    <span className="text-slate-500">{new Date(post.created_at).toLocaleDateString()}</span>
                  </div>

                  <span className={`px-2 py-0.5 rounded text-[8px] font-extrabold uppercase flex items-center gap-1 ${
                    post.type === 'Announcement'
                      ? 'bg-brand-primary/10 text-brand-primary border border-brand-primary/20'
                      : post.type === 'Question'
                      ? 'bg-brand-warning/10 text-brand-warning border border-brand-warning/20'
                      : 'bg-bg-hover text-slate-400 border border-bg-border'
                  }`}>
                    {post.type === 'Announcement' && <Megaphone className="w-2.5 h-2.5" />}
                    {post.type === 'Question' && <HelpCircle className="w-2.5 h-2.5" />}
                    {post.type}
                  </span>
                </div>

                {/* Title and Content */}
                <div className="space-y-2">
                  <h3 className="font-extrabold text-white text-base leading-tight hover:text-brand-primary cursor-pointer">{post.title}</h3>
                  <p className="text-slate-300 text-xs leading-relaxed whitespace-pre-wrap">{post.content}</p>
                </div>

                {/* Tags */}
                {post.tags && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {post.tags.split(',').map((tag: string, ti: number) => (
                      <span key={ti} className="px-2 py-0.5 bg-bg-hover text-slate-400 rounded-full text-[10px] flex items-center gap-1">
                        <Tag className="w-2.5 h-2.5 text-slate-500" />
                        {tag.trim()}
                      </span>
                    ))}
                  </div>
                )}

                {/* Footer Controls (Upvotes, Pinned bookmarks, commenting toggles) */}
                <div className="flex items-center gap-6 border-t border-bg-border/60 pt-3.5 text-xs text-slate-400">
                  
                  {/* Upvote Button */}
                  <button 
                    onClick={() => handleVote(post.id, 'upvote')}
                    className={`flex items-center gap-1.5 hover:text-brand-success transition-colors ${
                      post.has_upvoted ? 'text-brand-success font-bold' : ''
                    }`}
                  >
                    <ArrowUp className="w-4 h-4" />
                    <span>Upvote ({post.upvotes})</span>
                  </button>

                  {/* Comments Toggle */}
                  <button 
                    onClick={() => setActiveCommentPost(activeCommentPost === post.id ? null : post.id)}
                    className={`flex items-center gap-1.5 hover:text-white transition-colors ${
                      activeCommentPost === post.id ? 'text-brand-primary font-bold' : ''
                    }`}
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>Comment ({post.comments ? post.comments.length : 0})</span>
                  </button>

                  {/* Bookmark Button */}
                  <button 
                    onClick={() => handleBookmarkToggle(post.id)}
                    className={`flex items-center gap-1.5 hover:text-brand-accent transition-colors ml-auto ${
                      post.has_bookmarked ? 'text-brand-accent font-bold' : ''
                    }`}
                  >
                    <Bookmark className={`w-4 h-4 ${post.has_bookmarked ? 'fill-brand-accent text-brand-accent' : ''}`} />
                    <span>{post.has_bookmarked ? 'Bookmarked' : 'Bookmark'}</span>
                  </button>

                </div>

                {/* Expand comments Drawer */}
                {activeCommentPost === post.id && (
                  <div className="mt-4 border-t border-bg-border/40 pt-4 space-y-4">
                    {/* Add comments Form */}
                    <form onSubmit={(e) => handleCommentSubmit(e, post.id)} className="flex gap-2 text-xs">
                      <input 
                        type="text" 
                        required
                        placeholder="Write a response..." 
                        value={commentInput} 
                        onChange={(e) => setCommentInput(e.target.value)} 
                        className="flex-1 bg-bg-hover border border-bg-border focus:border-brand-primary outline-none py-1.5 px-3 rounded-lg text-slate-200"
                      />
                      <button type="submit" className="p-2 bg-brand-primary hover:bg-brand-primaryHover text-white rounded-lg transition-colors">
                        <Send className="w-3.5 h-3.5" />
                      </button>
                    </form>

                    {/* Comments List */}
                    {post.comments && post.comments.length > 0 && (
                      <div className="space-y-3 pl-3 border-l border-bg-border">
                        {post.comments.map((comment: any) => (
                          <div key={comment.id} className="text-xs space-y-1 bg-bg-hover/20 p-2.5 rounded-lg">
                            <div className="flex justify-between text-[10px] text-slate-500 font-semibold">
                              <span className="text-slate-300 font-bold flex items-center gap-1">
                                <User className="w-2.5 h-2.5 text-slate-500" /> {comment.username}
                              </span>
                              <span>{new Date(comment.created_at).toLocaleDateString()}</span>
                            </div>
                            <p className="text-slate-300">{comment.content}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

              </div>
            ))
          )}
        </div>

        {/* Right Column: Publishing form (If not in filtered views) */}
        {!forceTrending && !forceBookmarks && (
          <div className="lg:col-span-1 bg-bg-card border border-bg-border rounded-xl p-5 space-y-4 h-fit">
            <h3 className="font-bold text-white text-xs border-b border-bg-border pb-3 flex items-center gap-2">
              <Megaphone className="w-4 h-4 text-brand-primary" />
              Publish to Feed
            </h3>
            
            <form onSubmit={handleCreatePost} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Post Title</label>
                <input 
                  type="text" 
                  required 
                  placeholder="Ask a question or name announcement..." 
                  value={title} 
                  onChange={(e) => setTitle(e.target.value)} 
                  className="w-full bg-bg-hover border border-bg-border focus:border-brand-primary outline-none py-2 px-3 rounded-lg text-slate-200 placeholder-slate-600"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Scope Category</label>
                <select 
                  value={type} 
                  onChange={(e) => setType(e.target.value)} 
                  className="w-full bg-bg-hover border border-bg-border focus:border-brand-primary outline-none py-2 px-2.5 rounded-lg text-slate-200"
                >
                  <option value="Post">Standard Post</option>
                  <option value="Announcement">Official Announcement</option>
                  <option value="Question">Natural Question</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Write Content</label>
                <textarea 
                  required 
                  placeholder="Share details or state details of your query..." 
                  value={content} 
                  onChange={(e) => setContent(e.target.value)} 
                  className="w-full bg-bg-hover border border-bg-border focus:border-brand-primary outline-none py-2 px-3 rounded-lg text-slate-200 placeholder-slate-600 h-28 resize-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Topics / Tags (comma-separated)</label>
                <input 
                  type="text" 
                  placeholder="deployment, oauth, leave" 
                  value={postTags} 
                  onChange={(e) => setPostTags(e.target.value)} 
                  className="w-full bg-bg-hover border border-bg-border focus:border-brand-primary outline-none py-2 px-3 rounded-lg text-slate-200 placeholder-slate-600"
                />
              </div>

              <button
                type="submit"
                disabled={submitLoading || !title || !content}
                className="w-full py-2 bg-brand-primary hover:bg-brand-primaryHover disabled:bg-brand-primary/50 text-white font-bold rounded-xl transition-colors"
              >
                {submitLoading ? 'Publishing Post...' : 'Publish to Feed'}
              </button>
            </form>
          </div>
        )}

      </div>

    </div>
  );
};
