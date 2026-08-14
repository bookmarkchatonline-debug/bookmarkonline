// src/pages/VideoPage.jsx
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ThumbsUp, 
  Share2, 
  Flag, 
  MessageCircle,
  Send,
  Heart,
  MoreVertical,
  Trash2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import VideoPlayer from '../components/video/VideoPlayer';
import VideoCard from '../components/video/VideoCard';
import {
  getVideo,
  incrementVideoViews,
  toggleVideoLike,
  hasLikedVideo,
  addVideoComment,
  getVideoComments,
  deleteVideoComment,
  toggleCommentLike,
  hasLikedComment,
  getUserVideos,
} from '../firebase/videos';
import { getUserProfile } from '../firebase/firestore';
import toast from 'react-hot-toast';
import '../styles/videopage.css';

function formatViews(views) {
  if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M`;
  if (views >= 1000) return `${(views / 1000).toFixed(1)}K`;
  return views || 0;
}

function timeAgo(timestamp) {
  if (!timestamp?.seconds) return 'Just now';
  const seconds = Date.now() / 1000 - timestamp.seconds;
  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  if (seconds < 2592000) return `${Math.floor(seconds / 604800)}w ago`;
  if (seconds < 31536000) return `${Math.floor(seconds / 2592000)}mo ago`;
  return `${Math.floor(seconds / 31536000)}y ago`;
}

export default function VideoPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [video, setVideo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [showDescription, setShowDescription] = useState(false);
  const [relatedVideos, setRelatedVideos] = useState([]);
  const [commentLikes, setCommentLikes] = useState({});


  useEffect(() => {
    loadVideo();
  }, [id]);

  const loadVideo = async () => {
    try {
      setLoading(true);
      const videoData = await getVideo(id);
      if (!videoData) {
        toast.error('Video not found');
        navigate('/videos');
        return;
      }
      setVideo(videoData);
      setLikeCount(videoData.likes || 0);

      // Increment view count
      await incrementVideoViews(id);

      // Check if liked
      if (user) {
        const isLiked = await hasLikedVideo(user.uid, id);
        setLiked(isLiked);
      }

      // Load comments
      const commentsData = await getVideoComments(id);
      setComments(commentsData);

      // Load comment likes
      if (user) {
        const likes = {};
        for (const comment of commentsData) {
          const isLiked = await hasLikedComment(user.uid, comment.id);
          likes[comment.id] = isLiked;
        }
        setCommentLikes(likes);
      }

      // Load related videos
      if (videoData.uid) {
        const userVids = await getUserVideos(videoData.uid);
        setRelatedVideos(userVids.filter(v => v.id !== id).slice(0, 6));
      }
    } catch (err) {
      console.error('Failed to load video:', err);
      toast.error('Failed to load video');
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async () => {
    if (!user) {
      toast.error('Please login to like videos');
      return;
    }

    try {
      const newLiked = await toggleVideoLike(user.uid, id);
      setLiked(newLiked);
      setLikeCount(prev => newLiked ? prev + 1 : prev - 1);
    } catch (err) {
      console.error('Failed to toggle like:', err);
      toast.error('Failed to like video');
    }
  };


  const handleSubmitComment = async (e) => {
    e.preventDefault();
    if (!user) {
      toast.error('Please login to comment');
      return;
    }
    if (!commentText.trim()) return;

    try {
      setSubmittingComment(true);
      const userProfile = await getUserProfile(user.uid);
      await addVideoComment(
        id,
        user.uid,
        userProfile?.username || 'Anonymous',
        userProfile?.avatarUrl || null,
        commentText.trim()
      );
      setCommentText('');
      // Reload comments
      const commentsData = await getVideoComments(id);
      setComments(commentsData);
      setVideo(prev => ({ ...prev, commentCount: (prev.commentCount || 0) + 1 }));
      toast.success('Comment added');
    } catch (err) {
      console.error('Failed to add comment:', err);
      toast.error('Failed to add comment');
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Delete this comment?')) return;
    try {
      await deleteVideoComment(commentId, id);
      setComments(prev => prev.filter(c => c.id !== commentId));
      setVideo(prev => ({ ...prev, commentCount: Math.max(0, (prev.commentCount || 0) - 1) }));
      toast.success('Comment deleted');
    } catch (err) {
      console.error('Failed to delete comment:', err);
      toast.error('Failed to delete comment');
    }
  };

  const handleCommentLike = async (commentId) => {
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
      console.error('Failed to like comment:', err);
      toast.error('Failed to like comment');
    }
  };


  const handleShare = () => {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({ title: video.title, url });
    } else {
      navigator.clipboard.writeText(url);
      toast.success('Link copied to clipboard');
    }
  };

  if (loading) {
    return (
      <div className="video-page-loading">
        <div className="spinner" />
      </div>
    );
  }

  if (!video) {
    return (
      <div className="video-page-error">
        <h2>Video not found</h2>
      </div>
    );
  }

  return (
    <div className="video-page">
      <div className="video-page-content">
        <div className="video-page-main">
          {/* Video Player */}
          <VideoPlayer
            videoUrl={video.videoUrl}
            thumbnailUrl={video.thumbnailUrl}
            captions={video.captions || []}
          />

          {/* Video Info */}
          <div className="video-info-section">
            <h1 className="video-page-title">{video.title}</h1>
            
            <div className="video-meta-section">
              <div className="video-meta-stats">
                <span>{formatViews(video.views || 0)} views</span>
                <span>•</span>
                <span>{timeAgo(video.createdAt)}</span>
              </div>

              <div className="video-actions-row">
                <button
                  className={`video-action-btn ${liked ? 'active' : ''}`}
                  onClick={handleLike}
                >
                  <ThumbsUp size={20} fill={liked ? 'currentColor' : 'none'} />
                  <span>{formatViews(likeCount)}</span>
                </button>

                <button className="video-action-btn" onClick={handleShare}>
                  <Share2 size={20} />
                  <span>Share</span>
                </button>


              </div>
            </div>
          </div>


          {/* Creator Info */}
          <div className="video-creator-section">
            <div
              className="video-creator-info"
              onClick={() => navigate(`/profile/${video.uid}`)}
            >
              <div className="video-creator-avatar">
                {video.avatarUrl ? (
                  <img src={video.avatarUrl} alt={video.username} />
                ) : (
                  <div className="video-creator-avatar-placeholder">
                    {video.username?.charAt(0)?.toUpperCase() || 'A'}
                  </div>
                )}
              </div>
              <div className="video-creator-details">
                <div className="video-creator-name">{video.username || 'Anonymous'}</div>
                <div className="video-creator-stats">Subscriber count</div>
              </div>
            </div>
            <button className="video-subscribe-btn">Subscribe</button>
          </div>

          {/* Description */}
          {video.description && (
            <div className="video-description-section">
              <div className={`video-description ${showDescription ? 'expanded' : ''}`}>
                {video.description}
              </div>
              {video.description.length > 200 && (
                <button
                  className="video-description-toggle"
                  onClick={() => setShowDescription(!showDescription)}
                >
                  {showDescription ? 'Show less' : 'Show more'}
                </button>
              )}
            </div>
          )}

          {/* Comments Section */}
          <div className="video-comments-section">
            <div className="video-comments-header">
              <h2>{video.commentCount || 0} Comments</h2>
            </div>

            {/* Comment Form */}
            {user ? (
              <form className="video-comment-form" onSubmit={handleSubmitComment}>
                <div className="video-comment-input-wrap">
                  <input
                    type="text"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Add a comment..."
                    className="video-comment-input"
                  />
                  <button
                    type="submit"
                    className="video-comment-submit"
                    disabled={!commentText.trim() || submittingComment}
                  >
                    <Send size={18} />
                  </button>
                </div>
              </form>
            ) : (
              <div className="video-comment-login">
                Please <span onClick={() => navigate('/login')}>login</span> to comment
              </div>
            )}


            {/* Comments List */}
            <div className="video-comments-list">
              {comments.map((comment) => (
                <div key={comment.id} className="video-comment">
                  <div
                    className="video-comment-avatar"
                    onClick={() => navigate(`/profile/${comment.uid}`)}
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
                    <div className="video-comment-header">
                      <span
                        className="video-comment-username"
                        onClick={() => navigate(`/profile/${comment.uid}`)}
                      >
                        {comment.username}
                      </span>
                      <span className="video-comment-time">{timeAgo(comment.createdAt)}</span>
                    </div>
                    <div className="video-comment-text">{comment.text}</div>
                    <div className="video-comment-actions">
                      <button
                        className={`video-comment-like ${commentLikes[comment.id] ? 'active' : ''}`}
                        onClick={() => handleCommentLike(comment.id)}
                      >
                        <Heart
                          size={14}
                          fill={commentLikes[comment.id] ? 'currentColor' : 'none'}
                        />
                        <span>{comment.likes || 0}</span>
                      </button>
                      {user?.uid === comment.uid && (
                        <button
                          className="video-comment-delete"
                          onClick={() => handleDeleteComment(comment.id)}
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar - Related Videos */}
        <div className="video-page-sidebar">
          <h3 className="video-sidebar-title">More from {video.username}</h3>
          <div className="video-sidebar-list">
            {relatedVideos.map((relatedVideo) => (
              <VideoCard key={relatedVideo.id} video={relatedVideo} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
