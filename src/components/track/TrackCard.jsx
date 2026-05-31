// src/components/track/TrackCard.jsx
import { useNavigate } from 'react-router-dom';
import { Play, Pause, Music, Flame, TrendingUp, Trash2 } from 'lucide-react';
import { usePlayer } from '../../context/PlayerContext';
import { useAuth } from '../../context/AuthContext';
import { deleteTrack } from '../../firebase/firestore';
import toast from 'react-hot-toast';
import LikeButton from './LikeButton';
import CreatorBadge from '../common/CreatorBadge';
import '../../styles/components.css';

function isNewTrack(createdAt) {
  if (!createdAt?.seconds) return false;
  const hoursSince = (Date.now() / 1000 - createdAt.seconds) / 3600;
  return hoursSince < 24;
}

export default function TrackCard({ track, rank, showRank = false, onTrackDeleted }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { play, pause, currentTrack, isPlaying } = usePlayer();
  const isCurrent = currentTrack?.id === track.id;
  const showPlaying = isCurrent && isPlaying;
  const isNew = isNewTrack(track.createdAt);
  const isOwner = user?.uid === track.uid;

  const handlePlayPause = (e) => {
    e.stopPropagation();
    if (isCurrent && isPlaying) pause();
    else play(track);
  };

  const handleDelete = async (e) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this track? This cannot be undone.')) return;
    
    try {
      await deleteTrack(track.id, user.uid);
      toast.success('Track deleted');
      if (onTrackDeleted) onTrackDeleted(track.id);
    } catch (err) {
      toast.error('Failed to delete track');
      console.error(err);
    }
  };

  return (
    <div
      className={`track-card ${isCurrent ? 'track-card-active' : ''} ${showRank && rank <= 3 ? 'track-card-podium' : ''}`}
      onClick={() => navigate(`/track/${track.id}`)}
      role="button"
      tabIndex={0}
      id={`track-${track.id}`}
    >
      {/* Rank */}
      {showRank && (
        <div className={`track-rank rank-${rank <= 3 ? rank : 'default'}`}>
          {rank}
        </div>
      )}

      {/* Cover */}
      <div className="track-cover-wrap">
        {track.coverUrl ? (
          <img src={track.coverUrl} alt={track.title} className="track-cover" />
        ) : (
          <div className="track-cover track-cover-placeholder">
            <Music size={16} color="rgba(255,255,255,0.4)" />
          </div>
        )}

        {/* Play overlay */}
        <button className="track-play-overlay" onClick={handlePlayPause} aria-label={showPlaying ? 'Pause' : 'Play'}>
          {showPlaying ? <Pause size={14} fill="#fff" /> : <Play size={14} fill="#fff" />}
        </button>

        {/* Playing indicator */}
        {showPlaying && (
          <div className="track-eq-bars">
            {[1, 2, 3].map((i) => (
              <span key={i} className="track-eq-bar" style={{ animationDelay: `${i * 0.1}s` }} />
            ))}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="track-info">
        <div className="track-title-row">
          <span className="track-title">{track.title || 'Untitled'}</span>
          {isNew && <span className="track-new-badge">NEW</span>}
          {(track.likes || 0) >= 10 && <Flame size={12} className="track-trending-icon" />}
        </div>
        <div className="track-artist-row">
          <span
            className="track-artist"
            onClick={(e) => { e.stopPropagation(); navigate(`/profile/${track.uid}`); }}
          >
            {track.username || 'Anonymous'}
          </span>
        </div>
        {track.tags && track.tags.length > 0 && (
          <div className="track-tags-row">
            {track.tags.slice(0, 3).map((t) => (
              <span key={t} className="track-tag">#{t}</span>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="track-actions" onClick={(e) => e.stopPropagation()} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <LikeButton trackId={track.id} initialLikes={track.likes || 0} />
        {isOwner && (
          <button 
            className="btn-icon" 
            onClick={handleDelete} 
            title="Delete Track"
            style={{ color: 'var(--text-muted)' }}
          >
            <Trash2 size={16} />
          </button>
        )}
      </div>
    </div>
  );
}
