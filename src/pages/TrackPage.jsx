// src/pages/TrackPage.jsx
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Play, Pause, SkipBack, SkipForward, Share2, Music, ListPlus } from 'lucide-react';
import { getTrack } from '../firebase/firestore';
import { usePlayer } from '../context/PlayerContext';
import { useAuth } from '../context/AuthContext';
import LikeButton from '../components/track/LikeButton';
import toast from 'react-hot-toast';
import '../styles/components.css';
import '../styles/pages.css';

function formatTime(secs) {
  if (!secs || isNaN(secs)) return '0:00';
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function TrackPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    play, togglePlay, currentTrack, isPlaying,
    progress, duration, currentTime, seek,
    skipNext, skipPrev, addToQueue, queue,
  } = usePlayer();

  const [track,   setTrack]   = useState(null);
  const [loading, setLoading] = useState(true);

  const isCurrent  = currentTrack?.id === id;
  const showPlaying = isCurrent && isPlaying;

  useEffect(() => {
    let active = true;
    getTrack(id).then((t) => {
      if (active) {
        setTrack(t);
        setLoading(false);
        if (t) play(t);
      }
    });
    return () => { active = false; };
  }, [id, play]);

  const handlePlayPause = () => {
    if (isCurrent) togglePlay();
    else if (track) play(track);
  };

  const handleProgressClick = (e) => {
    if (!isCurrent) return;
    const rect = e.currentTarget.getBoundingClientRect();
    seek(((e.clientX - rect.left) / rect.width) * 100);
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Link copied to clipboard!');
  };

  const handleAddToQueue = () => {
    if (!track) return;
    addToQueue(track);
    toast(`Added to queue`, { icon: '🎵', duration: 1800 });
  };

  if (loading) {
    return (
      <div className="now-playing-page">
        <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
          <div className="spinner" style={{ width: 48, height: 48 }} />
        </div>
      </div>
    );
  }

  if (!track) {
    return (
      <div className="page">
        <div className="empty-state">
          <div className="empty-state-icon">🎵</div>
          <p>Track not found.</p>
          <button className="btn btn-ghost" onClick={() => navigate('/')}>Go Home</button>
        </div>
      </div>
    );
  }

  const currentProgress = isCurrent ? progress : 0;
  const currentDur      = isCurrent ? duration  : (track.duration || 0);
  const currentPos      = isCurrent ? currentTime : 0;

  return (
    <div className="now-playing-page animate-fade-in">
      {/* ── Main ─────────────────────────────────────────────────────────── */}
      <div className="vinyl-wrap">
        {/* Vinyl disc */}
        <div className={`vinyl-disc${showPlaying ? ' spinning' : ''}`}>
          {track.coverUrl ? (
            <img src={track.coverUrl} alt={track.title} className="vinyl-cover" />
          ) : (
            <div style={{
              width: '100%', height: '100%',
              background: 'linear-gradient(135deg, #1a0a2e, #2d1b4e)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Music size={60} color="rgba(168,85,247,0.4)" />
            </div>
          )}
          <div className="vinyl-hole" />
        </div>

        {/* Track info */}
        <div className="now-playing-info">
          <div className="now-playing-label">
            <span className="now-playing-dot" />
            NOW STREAMING
          </div>
          <h1 className="now-playing-title">{track.title}</h1>
          <div
            className="now-playing-artist"
            style={{ cursor: 'pointer' }}
            onClick={() => navigate(`/profile/${track.uid}`)}
          >
            {track.username}
          </div>
          <div className="now-playing-tags">
            {track.tags?.map((t) => (
              <span key={t} className="tag">#{t}</span>
            ))}
          </div>
        </div>

        {/* Equalizer bars (visible while playing) */}
        {showPlaying && (
          <div className="np-eq-bars" aria-hidden="true">
            {Array.from({ length: 5 }).map((_, i) => (
              <span key={i} className="np-eq-bar" style={{ animationDelay: `${i * 0.12}s` }} />
            ))}
          </div>
        )}

        {/* Controls */}
        <div className="now-playing-controls" style={{ width: '100%', maxWidth: 460 }}>
          {/* Progress */}
          <div className="now-playing-progress">
            <span className="player-time">{formatTime(currentPos)}</span>
            <div
              className="player-progress-bar"
              style={{ flex: 1, cursor: isCurrent ? 'pointer' : 'default' }}
              onClick={handleProgressClick}
              role="progressbar"
              aria-valuenow={currentProgress}
            >
              <div className="player-progress-fill" style={{ width: `${currentProgress}%` }} />
            </div>
            <span className="player-time">{formatTime(currentDur)}</span>
          </div>

          {/* Buttons */}
          <div className="now-playing-btns">
            <button
              className="np-btn"
              onClick={skipPrev}
              aria-label="Previous / Restart"
              title="Previous / Restart"
            >
              <SkipBack size={22} />
            </button>
            <button
              className="np-play-btn"
              onClick={handlePlayPause}
              aria-label={showPlaying ? 'Pause' : 'Play'}
              id="np-play-btn"
            >
              {showPlaying ? <Pause size={22} fill="#fff" /> : <Play size={22} fill="#fff" />}
            </button>
            <button
              className={`np-btn${queue.length === 0 ? ' np-btn-disabled' : ''}`}
              onClick={skipNext}
              aria-label="Next"
              title={queue.length === 0 ? 'Queue is empty' : 'Next track'}
              disabled={queue.length === 0}
            >
              <SkipForward size={22} />
            </button>
          </div>

          {/* Actions */}
          <div className="now-playing-actions">
            <LikeButton trackId={track.id} initialLikes={track.likes || 0} size="lg" />
            <button className="np-action" onClick={handleShare} aria-label="Share">
              <Share2 size={18} />
              <span>SHARE</span>
            </button>
            <button className="np-action" onClick={handleAddToQueue} aria-label="Add to queue">
              <ListPlus size={18} />
              <span>QUEUE</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Side panel ───────────────────────────────────────────────────── */}
      <div>
        {/* Live queue up next */}
        <div className="side-panel">
          <div className="side-panel-title">
            Up Next
            {queue.length > 0 && (
              <span style={{ marginLeft: 8, fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 400 }}>
                {queue.length} in queue
              </span>
            )}
          </div>
          {queue.length === 0 ? (
            <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem', padding: '8px 0' }}>
              Queue is empty — add tracks with the + button
            </div>
          ) : (
            queue.slice(0, 5).map((t) => (
              <div
                key={t.id}
                className="up-next-item"
                onClick={() => navigate(`/track/${t.id}`)}
                role="button"
                tabIndex={0}
              >
                {t.coverUrl ? (
                  <img src={t.coverUrl} alt={t.title} className="up-next-cover" />
                ) : (
                  <div className="up-next-cover" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Music size={16} color="#fff" />
                  </div>
                )}
                <div className="up-next-info">
                  <div className="up-next-title">{t.title}</div>
                  <div className="up-next-artist">{t.username}</div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* About track */}
        <div className="side-panel" style={{ marginTop: 16 }}>
          <div className="side-panel-title">About This Snippet</div>
          <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            <div style={{ marginBottom: 8 }}>
              <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>By: </span>
              <span
                style={{ color: 'var(--accent)', cursor: 'pointer' }}
                onClick={() => navigate(`/profile/${track.uid}`)}
              >
                {track.username}
              </span>
            </div>
            {track.duration && (
              <div style={{ marginBottom: 8 }}>
                <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Duration: </span>
                {formatTime(track.duration)}
              </div>
            )}
            <div style={{ marginBottom: 8 }}>
              <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Likes: </span>
              {track.likes || 0}
            </div>
            {track.tags && track.tags.length > 0 && (
              <div>
                <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Tags: </span>
                {track.tags.map((t) => `#${t}`).join(' ')}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
