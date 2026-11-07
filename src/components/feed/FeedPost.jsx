import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Heart, Upload, UserPlus, Award, TrendingUp, Music,
  Play, Pause, Zap, Share2
} from 'lucide-react';
import { usePlayer } from '../../context/PlayerContext';
import CreatorBadge from '../common/CreatorBadge';
import LikeButton from '../track/LikeButton';
import ShareToChatModal from '../track/ShareToChatModal';

const FEED_ICONS = {
  upload: Upload,
  like: Heart,
  follow: UserPlus,
  award: Award,
  levelup: TrendingUp,
  milestone: Zap,
};

const FEED_COLORS = {
  upload: '#a855f7',
  like: '#ef4444',
  follow: '#3b82f6',
  award: '#facc15',
  levelup: '#22c55e',
  milestone: '#06b6d4',
};

function timeAgo(timestamp) {
  if (!timestamp?.seconds) return 'just now';
  const diff = Date.now() / 1000 - timestamp.seconds;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(timestamp.seconds * 1000).toLocaleDateString();
}

export default function FeedPost({ item }) {
  const navigate = useNavigate();
  const { play, currentTrack, isPlaying } = usePlayer();
  const [shareModalOpen, setShareModalOpen] = useState(false);

  const Icon = FEED_ICONS[item.type] || Zap;
  const color = FEED_COLORS[item.type] || 'var(--accent)';
  const isCurrent = currentTrack?.id === item.trackId && isPlaying;
  
  const hasMusicContent = item.trackId && item.trackTitle && (item.type === 'upload' || item.type === 'like');

  const handlePlay = (e) => {
    e.stopPropagation();
    if (item.trackId) {
      // Create a track object shape for the player
      play({
        id: item.trackId,
        title: item.trackTitle,
        username: item.username,
        uid: item.uid,
        coverUrl: item.trackCoverUrl,
      });
    }
  };

  return (
    <article className="feed-post animate-fade-in">
      {/* 1. Header (Creator Identity & Context) */}
      <header className="feed-post-header">
        <div 
          className="feed-post-creator"
          onClick={() => item.uid && navigate(`/profile/${item.uid}`)}
          role="button"
          tabIndex={0}
          aria-label={`Go to ${item.username}'s profile`}
        >
          {item.avatarUrl ? (
            <img src={item.avatarUrl} alt={item.username} className="feed-post-avatar" loading="lazy" />
          ) : (
            <div className="feed-post-avatar fallback" style={{ background: color }}>
              {(item.username || 'A')[0].toUpperCase()}
            </div>
          )}
          <div className="feed-post-meta">
            <div className="feed-post-name-row">
              <span className="feed-post-name">{item.username || 'Creator'}</span>
              {item.creatorLevel && <CreatorBadge level={item.creatorLevel} size="sm" showLabel={false} />}
            </div>
            <div className="feed-post-context">
              <Icon size={12} className="feed-post-context-icon" style={{ color }} />
              <span>{item.message}</span>
              <span style={{ margin: '0 4px', opacity: 0.3 }}>•</span>
              <time className="feed-post-time">{timeAgo(item.createdAt)}</time>
            </div>
          </div>
        </div>
      </header>

      {/* 2. Content (Music Preview or Text) */}
      {hasMusicContent ? (
        <div 
          className="feed-post-content"
          onClick={() => navigate(`/track/${item.trackId}`)}
          role="button"
          tabIndex={0}
          aria-label={`Go to track ${item.trackTitle}`}
        >
          <div className="feed-post-artwork-wrap">
            {item.trackCoverUrl ? (
              <img src={item.trackCoverUrl} alt={item.trackTitle} className="feed-post-artwork" loading="lazy" />
            ) : (
              <div className="feed-post-artwork placeholder"><Music size={40} /></div>
            )}
            <div className="feed-post-play-overlay">
              <button 
                className="feed-post-play-btn"
                onClick={handlePlay}
                aria-label={isCurrent ? "Pause Track" : "Play Track"}
              >
                {isCurrent ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" />}
              </button>
            </div>
          </div>
          <div className="feed-post-track-info">
            <div className="feed-post-track-text">
              <div className="feed-post-track-title">{item.trackTitle}</div>
              <div className="feed-post-track-artist">{item.username}</div>
            </div>
          </div>
        </div>
      ) : item.type === 'follow' && item.targetUsername ? (
        <div className="feed-post-text-content">
          <span>
            Started following <span className="feed-post-target" onClick={() => navigate(`/profile/${item.targetUid}`)}>@{item.targetUsername}</span>
          </span>
        </div>
      ) : item.type === 'levelup' && item.newLevel ? (
        <div className="feed-post-text-content" style={{ alignItems: 'flex-start' }}>
          <CreatorBadge level={item.newLevel} size="md" />
        </div>
      ) : null}

      {/* 3. Actions (Like, Share) */}
      {hasMusicContent && (
        <footer className="feed-post-actions">
          {/* We must pass initialLikes gracefully. If liveFeed doesn't store track likes count reliably, it defaults to 0 but will re-sync with Firestore inside LikeButton if needed. */}
          <LikeButton trackId={item.trackId} initialLikes={item.trackLikes || 0} />
          
          <button 
            className="feed-post-action-btn share"
            onClick={() => setShareModalOpen(true)}
            aria-label="Share track"
          >
            <Share2 size={18} /> Share
          </button>

          <ShareToChatModal 
            isOpen={shareModalOpen}
            onClose={() => setShareModalOpen(false)}
            track={{
              id: item.trackId,
              title: item.trackTitle,
              username: item.username,
              uid: item.uid,
              coverUrl: item.trackCoverUrl
            }}
          />
        </footer>
      )}
    </article>
  );
}
