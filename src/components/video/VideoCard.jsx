// src/components/video/VideoCard.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Eye, ThumbsUp, MessageCircle, Trash2, Video } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { deleteVideo } from '../../firebase/videos';
import toast from 'react-hot-toast';
import '../../styles/videocard.css';

function formatViews(views) {
  if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M`;
  if (views >= 1000) return `${(views / 1000).toFixed(1)}K`;
  return views || 0;
}

function formatDuration(seconds) {
  if (!seconds) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
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

export default function VideoCard({ video, onVideoDeleted }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isOwner = user?.uid === video.uid;
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async (e) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this video? This cannot be undone.')) return;
    
    setIsDeleting(true);
    try {
      await deleteVideo(video.id, user.uid);
      toast.success('Video deleted');
      if (onVideoDeleted) onVideoDeleted(video.id);
    } catch (err) {
      toast.error('Failed to delete video');
      console.error(err);
    } finally {
      setIsDeleting(false);
    }
  };


  return (
    <div className="video-card" onClick={() => navigate(`/video/${video.id}`)}>
      {/* Thumbnail */}
      <div className="video-thumbnail">
        {video.thumbnailUrl ? (
          <img src={video.thumbnailUrl} alt={video.title} />
        ) : (
          <div className="video-thumbnail-placeholder">
            <Video size={32} color="rgba(255,255,255,0.4)" />
          </div>
        )}
        
        {/* Play overlay */}
        <div className="video-thumbnail-overlay">
          <Play size={32} fill="white" />
        </div>
        
        {/* Duration */}
        {video.duration && (
          <div className="video-duration">
            {formatDuration(video.duration)}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="video-info">
        <div className="video-info-header">
          {/* Avatar */}
          <div
            className="video-avatar"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/profile/${video.uid}`);
            }}
          >
            {video.avatarUrl ? (
              <img src={video.avatarUrl} alt={video.username} />
            ) : (
              <div className="video-avatar-placeholder">
                {video.username?.charAt(0)?.toUpperCase() || 'A'}
              </div>
            )}
          </div>

          {/* Title and meta */}
          <div className="video-info-details">
            <h3 className="video-title">{video.title || 'Untitled Video'}</h3>
            <div className="video-meta">
              <span
                className="video-username"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/profile/${video.uid}`);
                }}
              >
                {video.username || 'Anonymous'}
              </span>
              <span className="video-meta-dot">•</span>
              <span className="video-views">{formatViews(video.views)} views</span>
              <span className="video-meta-dot">•</span>
              <span className="video-time">{timeAgo(video.createdAt)}</span>
            </div>
          </div>

          {/* Actions */}
          {isOwner && (
            <button
              className="video-delete-btn"
              onClick={handleDelete}
              disabled={isDeleting}
              title="Delete Video"
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>

        {/* Engagement stats */}
        <div className="video-engagement">
          <div className="video-stat">
            <ThumbsUp size={14} />
            <span>{formatViews(video.likes)}</span>
          </div>
          <div className="video-stat">
            <MessageCircle size={14} />
            <span>{formatViews(video.commentCount || 0)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
