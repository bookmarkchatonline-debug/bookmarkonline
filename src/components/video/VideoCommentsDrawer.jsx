import { useState, useEffect } from 'react';
import { X, Send, Heart, Trash2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
  getVideoComments, 
  addVideoComment, 
  deleteVideoComment, 
  toggleCommentLike, 
  hasLikedComment 
} from '../../firebase/videos';
import { getUserProfile } from '../../firebase/firestore';
import toast from 'react-hot-toast';
import '../../styles/videofeed.css';

function timeAgo(timestamp) {
  if (!timestamp?.seconds) return 'Just now';
  const seconds = Date.now() / 1000 - timestamp.seconds;
  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d`;
  return `${Math.floor(seconds / 604800)}w`;
}

export default function VideoCommentsDrawer({ isOpen, onClose, videoId, onCommentAdded }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [commentLikes, setCommentLikes] = useState({});

  useEffect(() => {
    if (isOpen && videoId) {
      loadComments();
    }
  }, [isOpen, videoId]);

  const loadComments = async () => {
    setLoading(true);
    try {
      const data = await getVideoComments(videoId);
      setComments(data);
      if (user) {
        const likes = {};
        for (const comment of data) {
          likes[comment.id] = await hasLikedComment(user.uid, comment.id);
        }
        setCommentLikes(likes);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      toast.error('Please login to comment');
      return;
    }
    if (!commentText.trim()) return;

    try {
      setSubmitting(true);
      const userProfile = await getUserProfile(user.uid);
      await addVideoComment(
        videoId,
        user.uid,
        userProfile?.username || 'Anonymous',
        userProfile?.avatarUrl || null,
        commentText.trim()
      );
      setCommentText('');
      if (onCommentAdded) onCommentAdded();
      await loadComments();
      toast.success('Comment added');
    } catch (err) {
      console.error(err);
      toast.error('Failed to add comment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (commentId) => {
    if (!window.confirm('Delete this comment?')) return;
    try {
      await deleteVideoComment(commentId, videoId);
      setComments(prev => prev.filter(c => c.id !== commentId));
      toast.success('Comment deleted');
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete comment');
    }
  };

  const handleLike = async (commentId) => {
    if (!user) {
      toast.error('Please login to like comments');
      return;
    }
    try {
      const newLiked = await toggleCommentLike(user.uid, commentId);
      setCommentLikes(prev => ({ ...prev, [commentId]: newLiked }));
      setComments(prev => prev.map(c => {
        if (c.id === commentId) {
          return { ...c, likes: newLiked ? (c.likes || 0) + 1 : Math.max(0, (c.likes || 0) - 1) };
        }
        return c;
      }));
    } catch (err) {
      console.error(err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="video-comments-overlay" onClick={onClose}>
      <div className="video-comments-drawer" onClick={e => e.stopPropagation()}>
        <div className="video-comments-header">
          <h3>Comments</h3>
          <button className="btn-icon" onClick={onClose} aria-label="Close comments">
            <X size={20} />
          </button>
        </div>
        
        <div className="video-comments-list">
          {loading ? (
            <div className="video-comments-loading"><div className="spinner" /></div>
          ) : comments.length === 0 ? (
            <div className="video-comments-empty">No comments yet. Be the first!</div>
          ) : (
            comments.map(comment => (
              <div key={comment.id} className="video-comment-item">
                <div 
                  className="video-comment-avatar"
                  onClick={() => { onClose(); navigate(`/profile/${comment.uid}`); }}
                >
                  {comment.avatarUrl ? (
                    <img src={comment.avatarUrl} alt={comment.username} />
                  ) : (
                    <div className="video-comment-avatar-placeholder">
                      {comment.username?.charAt(0)?.toUpperCase() || 'A'}
                    </div>
                  )}
                </div>
                <div className="video-comment-content">
                  <div className="video-comment-top">
                    <span 
                      className="video-comment-username"
                      onClick={() => { onClose(); navigate(`/profile/${comment.uid}`); }}
                    >
                      {comment.username || 'Anonymous'}
                    </span>
                    <span className="video-comment-time">{timeAgo(comment.createdAt)}</span>
                  </div>
                  <div className="video-comment-text">{comment.text}</div>
                  <div className="video-comment-actions">
                    {user?.uid === comment.uid && (
                      <button className="video-comment-action-btn" onClick={() => handleDelete(comment.id)}>
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
                <button 
                  className={`video-comment-like-btn ${commentLikes[comment.id] ? 'active' : ''}`}
                  onClick={() => handleLike(comment.id)}
                  aria-label="Like comment"
                >
                  <Heart size={14} fill={commentLikes[comment.id] ? 'currentColor' : 'none'} />
                  <span>{comment.likes || 0}</span>
                </button>
              </div>
            ))
          )}
        </div>

        <div className="video-comments-footer">
          {user ? (
            <form className="video-comment-form" onSubmit={handleSubmit}>
              <input
                type="text"
                className="video-comment-input"
                placeholder="Add a comment..."
                value={commentText}
                onChange={e => setCommentText(e.target.value)}
              />
              <button 
                type="submit" 
                className="video-comment-submit" 
                disabled={!commentText.trim() || submitting}
                aria-label="Submit comment"
              >
                <Send size={18} />
              </button>
            </form>
          ) : (
            <div className="video-comment-login">
              Please <span onClick={() => { onClose(); navigate('/login'); }}>login</span> to comment
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
