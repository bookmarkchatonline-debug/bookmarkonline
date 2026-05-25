// src/components/layout/Player.jsx
import { usePlayer } from '../../context/PlayerContext';
import { useAuth } from '../../context/AuthContext';
import { toggleLike, hasLiked } from '../../firebase/firestore';
import {
  Play, Pause, SkipBack, SkipForward,
  Volume2, VolumeX, Heart, Music, ListMusic,
} from 'lucide-react';
import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import QueueDrawer from './QueueDrawer';
import '../../styles/layout.css';

function formatTime(secs) {
  if (!secs || isNaN(secs)) return '0:00';
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function Player() {
  const {
    currentTrack, isPlaying, progress, duration, currentTime, volume,
    queue, togglePlay, seek, changeVolume, skipNext, skipPrev,
  } = usePlayer();
  const { user } = useAuth();
  const navigate  = useNavigate();
  const [liked,        setLiked]       = useState(false);
  const [queueOpen,    setQueueOpen]   = useState(false);
  const [muted,        setMuted]       = useState(false);
  const prevVolRef = useRef(0.8);

  // Check initial like state whenever track changes
  useEffect(() => {
    if (user && currentTrack) {
      hasLiked(user.uid, currentTrack.id).then(setLiked);
    } else {
      setLiked(false);
    }
  }, [user, currentTrack?.id]);

  const handleLike = useCallback(async (e) => {
    e.stopPropagation();
    if (!user) { toast.error('Sign in to like tracks'); return; }
    const newState = await toggleLike(user.uid, currentTrack.id);
    setLiked(newState);
    toast(newState ? '❤️ Liked!' : '💔 Unliked', { duration: 1200 });
  }, [user, currentTrack]);

  const handleProgressClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    seek(((e.clientX - rect.left) / rect.width) * 100);
  };

  const handleVolumeClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const v = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    prevVolRef.current = v;
    setMuted(false);
    changeVolume(v);
  };

  const toggleMute = () => {
    if (muted) {
      changeVolume(prevVolRef.current || 0.8);
      setMuted(false);
    } else {
      prevVolRef.current = volume;
      changeVolume(0);
      setMuted(true);
    }
  };

  // ─── Empty state ──────────────────────────────────────────────────────────
  if (!currentTrack) {
    return (
      <div className="player" style={{ justifyContent: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--text-muted)', fontSize: '0.875rem' }}>
          <Music size={18} />
          <span>Select a track to start listening</span>
        </div>
      </div>
    );
  }

  const displayVol = muted ? 0 : volume;

  return (
    <>
      <div className="player">
        {/* ── Track Info ─────────────────────────────────────────────────── */}
        <div
          className="player-track"
          style={{ cursor: 'pointer' }}
          onClick={() => navigate(`/track/${currentTrack.id}`)}
          title="View track"
        >
          {currentTrack.coverUrl ? (
            <img src={currentTrack.coverUrl} alt={currentTrack.title} className="player-cover" />
          ) : (
            <div className="player-cover-placeholder">
              <Music size={18} color="#fff" />
            </div>
          )}
          <div className="player-track-info">
            <div className="player-title">
              <span className={currentTrack.title.length > 22 ? 'marquee' : ''}>
                {currentTrack.title}
              </span>
            </div>
            <div className="player-artist">{currentTrack.username}</div>
          </div>
        </div>

        {/* ── Controls ───────────────────────────────────────────────────── */}
        <div className="player-controls">
          <div className="player-btns">
            <button
              className="player-btn"
              onClick={skipPrev}
              aria-label="Previous"
              title="Previous / Restart"
            >
              <SkipBack size={18} />
            </button>
            <button
              className="player-play-btn"
              onClick={togglePlay}
              aria-label={isPlaying ? 'Pause' : 'Play'}
              id="player-play-btn"
            >
              {isPlaying ? <Pause size={18} fill="#fff" /> : <Play size={18} fill="#fff" />}
            </button>
            <button
              className={`player-btn${queue.length === 0 ? ' player-btn-disabled' : ''}`}
              onClick={skipNext}
              aria-label="Next"
              title={queue.length === 0 ? 'Queue is empty' : 'Skip to next'}
              disabled={queue.length === 0}
            >
              <SkipForward size={18} />
            </button>
          </div>

          {/* Progress bar */}
          <div className="player-progress">
            <span className="player-time">{formatTime(currentTime)}</span>
            <div
              className="player-progress-bar"
              onClick={handleProgressClick}
              role="progressbar"
              aria-valuenow={progress}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div className="player-progress-fill" style={{ width: `${progress}%` }} />
            </div>
            <span className="player-time">{formatTime(duration)}</span>
          </div>
        </div>

        {/* ── Extras ─────────────────────────────────────────────────────── */}
        <div className="player-extras">
          {/* Like */}
          <button
            onClick={handleLike}
            className="btn-icon"
            aria-label={liked ? 'Unlike track' : 'Like track'}
            style={{ color: liked ? 'var(--accent)' : 'var(--text-secondary)' }}
          >
            <Heart size={18} fill={liked ? 'var(--accent)' : 'none'} />
          </button>

          {/* Queue toggle */}
          <button
            className="btn-icon player-queue-btn"
            onClick={() => setQueueOpen((v) => !v)}
            aria-label="Toggle queue"
            title="Queue"
            style={{ position: 'relative', color: queueOpen ? 'var(--accent)' : 'var(--text-secondary)' }}
          >
            <ListMusic size={18} />
            {queue.length > 0 && (
              <span className="queue-badge">{queue.length > 9 ? '9+' : queue.length}</span>
            )}
          </button>

          {/* Volume */}
          <div className="player-volume">
            <button
              onClick={toggleMute}
              style={{ color: 'var(--text-muted)', flexShrink: 0, display: 'flex' }}
              aria-label={muted ? 'Unmute' : 'Mute'}
            >
              {muted || volume === 0 ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </button>
            <div
              className="player-volume-bar"
              onClick={handleVolumeClick}
              role="slider"
              aria-label="Volume"
              aria-valuenow={Math.round(displayVol * 100)}
            >
              <div className="player-volume-fill" style={{ width: `${displayVol * 100}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* Queue Drawer */}
      <QueueDrawer isOpen={queueOpen} onClose={() => setQueueOpen(false)} />
    </>
  );
}
