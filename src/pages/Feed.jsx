// src/pages/Feed.jsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, orderBy, limit as fbLimit, onSnapshot, query as fbQuery } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../context/AuthContext';
import { usePlayer } from '../context/PlayerContext';
import {
  Heart, Upload, UserPlus, Award, TrendingUp, Music,
  Play, Pause, Zap, MessageCircle,
} from 'lucide-react';
import CreatorBadge from '../components/common/CreatorBadge';
import '../styles/pages.css';

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
  award: '#f59e0b',
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

function FeedCard({ item }) {
  const navigate = useNavigate();
  const { play, pause, currentTrack, isPlaying } = usePlayer();
  const Icon = FEED_ICONS[item.type] || Zap;
  const color = FEED_COLORS[item.type] || 'var(--accent)';
  const isCurrent = currentTrack?.id === item.trackId && isPlaying;

  return (
    <div className="feed-card animate-fade-in">
      <div className="feed-card-left">
        <div className="feed-card-avatar" onClick={() => item.uid && navigate(`/profile/${item.uid}`)}>
          {item.avatarUrl ? (
            <img src={item.avatarUrl} alt={item.username} />
          ) : (
            <div className="feed-card-avatar-fallback" style={{ background: color }}>
              {(item.username || 'A').slice(0, 1).toUpperCase()}
            </div>
          )}
          <div className="feed-card-type-icon" style={{ background: color }}>
            <Icon size={10} color="#fff" />
          </div>
        </div>
      </div>

      <div className="feed-card-body">
        <div className="feed-card-header">
          <span
            className="feed-card-username"
            onClick={() => item.uid && navigate(`/profile/${item.uid}`)}
          >
            {item.username || 'Creator'}
          </span>
          <span className="feed-card-message">{item.message}</span>
          <span className="feed-card-time">{timeAgo(item.createdAt)}</span>
        </div>

        {/* Track embed for upload/like events */}
        {item.trackId && item.trackTitle && (
          <div
            className="feed-card-track"
            onClick={() => navigate(`/track/${item.trackId}`)}
          >
            {item.trackCoverUrl ? (
              <img src={item.trackCoverUrl} alt={item.trackTitle} className="feed-card-track-cover" />
            ) : (
              <div className="feed-card-track-cover feed-card-track-placeholder">
                <Music size={14} color="rgba(255,255,255,0.5)" />
              </div>
            )}
            <div className="feed-card-track-info">
              <div className="feed-card-track-title">{item.trackTitle}</div>
              <div className="feed-card-track-artist">{item.username}</div>
            </div>
            {item.type === 'upload' && (
              <button
                className="feed-card-play-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  // Mini play from feed — navigate to track page
                  navigate(`/track/${item.trackId}`);
                }}
              >
                <Play size={12} fill="#fff" />
              </button>
            )}
          </div>
        )}

        {/* Level up display */}
        {item.type === 'levelup' && item.newLevel && (
          <div className="feed-card-levelup">
            <CreatorBadge level={item.newLevel} size="md" />
          </div>
        )}

        {/* Follow target */}
        {item.type === 'follow' && item.targetUsername && (
          <div
            className="feed-card-follow-target"
            onClick={() => item.targetUid && navigate(`/profile/${item.targetUid}`)}
          >
            @{item.targetUsername}
          </div>
        )}
      </div>
    </div>
  );
}

export default function Feed() {
  const { user } = useAuth();
  const [feed, setFeed] = useState([]);
  const [filter, setFilter] = useState('all');

  // Real-time listener
  useEffect(() => {
    const q = fbQuery(
      collection(db, 'liveFeed'),
      orderBy('createdAt', 'desc'),
      fbLimit(50)
    );
    const unsub = onSnapshot(q, (snap) => {
      const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setFeed(items);
    });
    return () => unsub();
  }, []);

  const filteredFeed = filter === 'all'
    ? feed
    : feed.filter((item) => {
      if (filter === 'uploads') return item.type === 'upload';
      if (filter === 'likes') return item.type === 'like';
      if (filter === 'follows') return item.type === 'follow';
      if (filter === 'awards') return item.type === 'award' || item.type === 'levelup';
      return true;
    });

  const FILTERS = [
    { id: 'all', label: 'All Activity' },
    { id: 'uploads', label: 'Uploads' },
    { id: 'likes', label: 'Likes' },
    { id: 'follows', label: 'Follows' },
    { id: 'awards', label: 'Awards' },
  ];

  return (
    <div className="page feed-page animate-fade-in">
      <div className="feed-hero">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <MessageCircle size={24} color="var(--accent)" />
          <h1>Community Feed</h1>
        </div>
        <p className="feed-hero-sub">See what's happening in the BookmarkChat community right now</p>

        <div className="live-badge" style={{ marginTop: 12 }}>
          <span className="live-dot" />
          LIVE UPDATES
        </div>
      </div>

      {/* Filters */}
      <div className="feed-filters">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            className={`feed-filter-btn${filter === f.id ? ' active' : ''}`}
            onClick={() => setFilter(f.id)}
            id={`feed-filter-${f.id}`}
          >
            {f.label}
            {f.id !== 'all' && (
              <span className="feed-filter-count">
                {feed.filter((item) => {
                  if (f.id === 'uploads') return item.type === 'upload';
                  if (f.id === 'likes') return item.type === 'like';
                  if (f.id === 'follows') return item.type === 'follow';
                  if (f.id === 'awards') return item.type === 'award' || item.type === 'levelup';
                  return false;
                }).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Feed List */}
      <div className="feed-list-page">
        {filteredFeed.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📡</div>
            <p>No activity yet. Be the first to make some noise!</p>
          </div>
        ) : (
          filteredFeed.map((item) => (
            <FeedCard key={item.id} item={item} />
          ))
        )}
      </div>
    </div>
  );
}
