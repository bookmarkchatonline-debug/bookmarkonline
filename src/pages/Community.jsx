// src/pages/Community.jsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query as fbQuery, orderBy, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../context/AuthContext';
import { MessageSquare, Plus, Clock, MessageCircle } from 'lucide-react';
import '../styles/pages.css';

function timeAgo(timestamp) {
  if (!timestamp?.seconds) return 'just now';
  const diff = Date.now() / 1000 - timestamp.seconds;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(timestamp.seconds * 1000).toLocaleDateString();
}

export default function Community() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [discussions, setDiscussions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const q = fbQuery(collection(db, 'discussions'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setDiscussions(items);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleCreateTopic = async (e) => {
    e.preventDefault();
    if (!user) {
      alert("Please sign in to post a topic.");
      navigate('/login');
      return;
    }
    if (!newTitle.trim() || !newContent.trim()) return;

    setSubmitting(true);
    try {
      const docRef = await addDoc(collection(db, 'discussions'), {
        title: newTitle.trim(),
        content: newContent.trim(),
        uid: user.uid,
        username: profile?.username || 'Anonymous',
        avatarUrl: profile?.avatarUrl || null,
        creatorLevel: profile?.creatorLevel || 'Rising Artist',
        createdAt: serverTimestamp(),
        repliesCount: 0,
      });
      setIsCreating(false);
      setNewTitle('');
      setNewContent('');
      navigate(`/community/${docRef.id}`);
    } catch (err) {
      console.error("Error creating discussion:", err);
      alert("Failed to create topic.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page community-page animate-fade-in">
      <div className="artist-dir-hero" style={{ paddingBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <MessageSquare size={28} color="var(--accent)" />
          <h1>Community Discussions</h1>
        </div>
        <p>Connect, collaborate, and share with other independent artists.</p>
        
        <button 
          className="btn btn-primary" 
          style={{ marginTop: '20px' }}
          onClick={() => {
            if (!user) navigate('/login');
            else setIsCreating(!isCreating);
          }}
        >
          {isCreating ? 'Cancel' : <><Plus size={16} /> New Topic</>}
        </button>
      </div>

      {isCreating && (
        <div className="form-card animate-fade-in" style={{ marginBottom: '30px', padding: '24px', background: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border)' }}>
          <h2 style={{ margin: '0 0 20px 0', fontSize: '1.25rem' }}>Create a New Topic</h2>
          <form onSubmit={handleCreateTopic}>
            <div className="form-group">
              <label>Title</label>
              <input 
                type="text" 
                className="input" 
                placeholder="What's on your mind?"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                maxLength={100}
                required
              />
            </div>
            <div className="form-group">
              <label>Details</label>
              <textarea 
                className="input" 
                placeholder="Share details, ask for collaboration, or discuss topics..."
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                rows={4}
                required
              />
            </div>
            <button type="submit" className="btn btn-primary" disabled={submitting || !newTitle.trim() || !newContent.trim()}>
              {submitting ? 'Posting...' : 'Post Topic'}
            </button>
          </form>
        </div>
      )}

      {/* Discussions List */}
      <div className="discussions-list" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {loading ? (
          <div className="empty-state">Loading discussions...</div>
        ) : discussions.length === 0 ? (
          <div className="empty-state">
            <MessageSquare size={32} style={{ opacity: 0.5, marginBottom: '10px' }} />
            <p>No topics yet. Be the first to start a conversation!</p>
          </div>
        ) : (
          discussions.map(topic => (
            <div 
              key={topic.id} 
              className="feed-card" 
              style={{ cursor: 'pointer', transition: 'transform 0.2s, border-color 0.2s', padding: '20px' }}
              onClick={() => navigate(`/community/${topic.id}`)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <h3 style={{ margin: '0 0 8px 0', fontSize: '1.1rem', color: 'var(--text-primary)' }}>
                    {topic.title}
                  </h3>
                  <p style={{ margin: '0 0 12px 0', color: 'var(--text-secondary)', fontSize: '0.95rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {topic.content}
                  </p>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {topic.avatarUrl ? (
                        <img src={topic.avatarUrl} alt={topic.username} style={{ width: 20, height: 20, borderRadius: '50%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'var(--accent)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 'bold' }}>
                          {(topic.username || 'A').charAt(0).toUpperCase()}
                        </div>
                      )}
                      <span style={{ color: 'var(--text-secondary)' }}>{topic.username}</span>
                    </div>
                    <span>•</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Clock size={12} /> {timeAgo(topic.createdAt)}
                    </span>
                    <span>•</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <MessageCircle size={12} /> {topic.repliesCount || 0} replies
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
