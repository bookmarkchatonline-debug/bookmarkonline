// src/components/track/TrackCard.jsx
import { useNavigate } from 'react-router-dom';
import { Play, Pause, Music, ListPlus } from 'lucide-react';
import { usePlayer } from '../../context/PlayerContext';
import LikeButton from './LikeButton';
import toast from 'react-hot-toast';

function formatTime(secs) {
  if (!secs) return '--:--';
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function timeAgo(ts) {
  if (!ts?.seconds) return '';
  const diff = Date.now() / 1000 - ts.seconds;
  if (diff < 60)    return 'just now';
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function TrackCard({ track, rank, showRank = false }) {
  const navigate = useNavigate();
  const { play, pause, currentTrack, isPlaying, addToQueue } = usePlayer();
  const isCurrentlyPlaying = currentTrack?.id === track.id && isPlaying;

  const handlePlay = (e) => {
    e.stopPropagation();
    if (isCurrentlyPlaying) pause();
    else play(track);
  };

  const handleAddToQueue = (e) => {
    e.stopPropagation();
    addToQueue(track);
    toast(`Added "${track.title}" to queue`, {
      icon: '🎵',
      duration: 1800,
    });
  };

  return (
    <div
      className={`track-card${isCurrentlyPlaying ? ' playing' : ''}`}
      onClick={() => navigate(`/track/${track.id}`)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && navigate(`/track/${track.id}`)}
      aria-label={`${track.title} by ${track.username}`}
    >
      {/* Rank */}
      {showRank && (
        <span className="track-card-rank">{rank}</span>
      )}

      {/* Cover + play overlay */}
      <div className="track-card-cover">
        {track.coverUrl ? (
          <img src={track.coverUrl} alt={track.title} />
        ) : (
          <div className="track-card-cover-placeholder">
            <Music size={18} color="#fff" />
          </div>
        )}
        <div className="track-card-play-overlay">
          <button
            onClick={handlePlay}
            style={{
              width: 30, height: 30,
              background: 'var(--accent-grad)',
              borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff',
            }}
            aria-label={isCurrentlyPlaying ? 'Pause' : 'Play'}
          >
            {isCurrentlyPlaying ? <Pause size={13} fill="#fff" /> : <Play size={13} fill="#fff" />}
          </button>

          {/* Add to Queue button */}
          <button
            onClick={handleAddToQueue}
            className="track-card-queue-btn"
            aria-label="Add to queue"
            title="Add to queue"
          >
            <ListPlus size={13} />
          </button>
        </div>
      </div>

      {/* Info */}
      <div className="track-card-info">
        <div className="track-card-title">{track.title}</div>
        <div className="track-card-artist">{track.username}</div>
        {track.tags && track.tags.length > 0 && (
          <div className="track-card-tags">
            {track.tags.slice(0, 3).map((tag) => (
              <span key={tag} className="track-card-tag">#{tag}</span>
            ))}
          </div>
        )}
      </div>

      {/* Meta */}
      <div className="track-card-meta">
        <LikeButton trackId={track.id} initialLikes={track.likes || 0} />
        {track.duration && (
          <span className="track-card-duration">{formatTime(track.duration)}</span>
        )}
        <span className="track-card-time">{timeAgo(track.createdAt)}</span>
      </div>
    </div>
  );
}
