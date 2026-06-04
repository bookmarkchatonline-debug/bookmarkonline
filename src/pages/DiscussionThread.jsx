// src/pages/DiscussionThread.jsx
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, query as fbQuery, orderBy, onSnapshot, addDoc, serverTimestamp, increment, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, MessageCircle, Clock } from 'lucide-react';
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

export default function DiscussionThread() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  
  const [topic, setTopic] = useState(null);
  const [replies, setReplies] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [newReply, setNewReply] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!id) return;

    // Fetch the topic once
    const fetchTopic = async () => {
      try {
        const docRef = doc(db, 'discussions', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setTopic({ id: docSnap.id, ...docSnap.data() });
        } else {
          console.log("No such topic!");
        }
      } catch (err) {
        console.error("Error fetching topic:", err);
      }
    };
    
    fetchTopic();

    // Listen to replies
    const q = fbQuery(collection(db, 'discussions', id, 'replies'), orderBy('createdAt', 'asc'));
    const unsub = onSnapshot(q, (snap) => {
      const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setReplies(items);
      setLoading(false);
    });

    return () => unsub();
  }, [id]);

  const handlePostReply = async (e) => {
    e.preventDefault();
    if (!user) {
      alert("Please sign in to reply.");
      navigate('/login');
      return;
    }
    if (!newReply.trim()) return;

    setSubmitting(true);
    try {
      // Add reply to subcollection
      await addDoc(collection(db, 'discussions', id, 'replies'), {
        content: newReply.trim(),
        uid: user.uid,
        username: profile?.username || 'Anonymous',
        avatarUrl: profile?.avatarUrl || null,
        creatorLevel: profile?.creatorLevel || 'Rising Artist',
        createdAt: serverTimestamp(),
      });
      
      // Update replies count on the parent discussion doc
      const docRef = doc(db, 'discussions', id);
      await updateDoc(docRef, {
        repliesCount: increment(1)
      });
      
      setNewReply('');
    } catch (err) {
      console.error("Error posting reply:", err);
      alert("Failed to post reply.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading && !topic) {
    return <div className="page" style={{ padding: '40px', textAlign: 'center' }}>Loading discussion...</div>;
  }

  if (!topic && !loading) {
    return <div className="page" style={{ padding: '40px', textAlign: 'center' }}>Topic not found.</div>;
  }

  return (
    <div className="page animate-fade-in" style={{ maxWidth: '800px', margin: '0 auto' }}>
      <button 
        className="btn btn-ghost" 
        style={{ marginBottom: '20px', paddingLeft: 0 }}
        onClick={() => navigate('/community')}
      >
        <ArrowLeft size={16} /> Back to Community
      </button>

      {topic && (
        <div style={{ background: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border)', padding: '24px', marginBottom: '24px' }}>
          <h1 style={{ margin: '0 0 16px 0', fontSize: '1.5rem' }}>{topic.title}</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            {topic.avatarUrl ? (
              <img src={topic.avatarUrl} alt={topic.username} style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }} />
            ) : (
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--accent)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                {(topic.username || 'A').charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{topic.username}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Clock size={12} /> {timeAgo(topic.createdAt)}
              </div>
            </div>
          </div>
          <div style={{ lineHeight: '1.6', color: 'var(--text-primary)', whiteSpace: 'pre-wrap' }}>
            {topic.content}
          </div>
        </div>
      )}

      {/* Replies */}
      <h3 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <MessageCircle size={18} /> Replies ({replies.length})
      </h3>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '32px' }}>
        {replies.length === 0 ? (
          <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', background: 'var(--bg-card)', borderRadius: '12px', border: '1px dashed var(--border)' }}>
            No replies yet. Be the first to reply!
          </div>
        ) : (
          replies.map(reply => (
            <div key={reply.id} style={{ background: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border)', padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                {reply.avatarUrl ? (
                  <img src={reply.avatarUrl} alt={reply.username} style={{ width: 24, height: 24, borderRadius: '50%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--accent)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 'bold' }}>
                    {(reply.username || 'A').charAt(0).toUpperCase()}
                  </div>
                )}
                <span style={{ fontWeight: '500', color: 'var(--text-primary)' }}>{reply.username}</span>
                <span>•</span>
                <span>{timeAgo(reply.createdAt)}</span>
              </div>
              <div style={{ lineHeight: '1.5', color: 'var(--text-primary)', whiteSpace: 'pre-wrap' }}>
                {reply.content}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Reply Form */}
      <div style={{ background: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border)', padding: '20px', marginBottom: '40px' }}>
        <h4 style={{ margin: '0 0 16px 0' }}>Add a reply</h4>
        <form onSubmit={handlePostReply}>
          <textarea 
            className="input" 
            placeholder={user ? "Write your reply..." : "Sign in to reply..."}
            value={newReply}
            onChange={(e) => setNewReply(e.target.value)}
            rows={3}
            disabled={!user || submitting}
            style={{ marginBottom: '16px', width: '100%', resize: 'vertical' }}
            required
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button 
              type="submit" 
              className="btn btn-primary" 
              disabled={submitting || !newReply.trim() || !user}
            >
              {submitting ? 'Posting...' : 'Post Reply'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
