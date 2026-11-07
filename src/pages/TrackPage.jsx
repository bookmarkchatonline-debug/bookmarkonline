import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Play, Pause, Share2, Music, ListPlus } from 'lucide-react';
import { getTrack } from '../firebase/firestore';
import { usePlayer } from '../context/PlayerContext';
import LikeButton from '../components/track/LikeButton';
import ShareToChatModal from '../components/track/ShareToChatModal';
import toast from 'react-hot-toast';
import '../styles/track-page.css';

function formatTime(secs) {
  if (!secs || isNaN(secs)) return '0:00';
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function TrackPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    play, togglePlay, currentTrack, isPlaying, addToQueue, queue
  } = usePlayer();

  const [track, setTrack] = useState(null);
  const [loading, setLoading] = useState(true);
  const [shareOpen, setShareOpen] = useState(false);

  const isCurrent = currentTrack?.id === id;
  const showPlaying = isCurrent && isPlaying;

  useEffect(() => {
    let active = true;
    setLoading(true);
    getTrack(id).then((t) => {
      if (active) {
        setTrack(t);
        setLoading(false);
      }
    });
    return () => { active = false; };
  }, [id]);

  const handlePlayPause = () => {
    if (isCurrent) {
      togglePlay();
    } else if (track) {
      play({
        id: track.id,
        title: track.title,
        username: track.username,
        uid: track.uid,
        coverUrl: track.coverUrl,
        audioUrl: track.audioUrl,
        duration: track.duration,
      });
    }
  };

  const handleAddToQueue = () => {
    if (!track) return;
    addToQueue(track);
    toast(`Added to queue`, { icon: '🎵', duration: 1800 });
  };

  if (loading) {
    return (
      <div className="track-page-container">
        <div style={{ display: 'flex', justifyContent: 'center', padding: 80, gridColumn: '1 / -1' }}>
          <div className="spinner" style={{ width: 48, height: 48 }} />
        </div>
      </div>
    );
  }

  if (!track) {
    return (
      <div className="track-page-container">
        <div className="empty-state" style={{ gridColumn: '1 / -1' }}>
          <div className="empty-state-icon">🎵</div>
          <p>Track not found.</p>
          <button className="btn btn-ghost" onClick={() => navigate('/')}>Go Home</button>
        </div>
      </div>
    );
  }

  return (
    <div className="track-page-container animate-fade-in">
      {/* ── Main Area ──────────────────────────────────────────────────────── */}
      <main className="track-page-main">
        
        {/* Hero Section */}
        <section className="track-page-hero">
          <div className="track-page-artwork-wrap">
            {track.coverUrl ? (
              <img 
                src={track.coverUrl} 
                alt={track.title} 
                className={`track-page-artwork ${showPlaying ? 'spinning' : ''}`} 
              />
            ) : (
              <div className="track-page-artwork" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-elevated)' }}>
                <Music size={64} color="var(--text-muted)" />
              </div>
            )}
          </div>
          
          <div className="track-page-info">
            <div className="track-page-status">
              {showPlaying && <span className="track-page-dot" />}
              {showPlaying ? 'NOW PLAYING' : 'TRACK'}
            </div>
            <h1 className="track-page-title">{track.title}</h1>
            <div 
              className="track-page-artist"
              onClick={() => navigate(`/profile/${track.uid}`)}
              role="link"
              tabIndex={0}
            >
              {track.username}
            </div>
            
            <div className="track-page-play-row">
              <button 
                className="track-page-play-btn"
                onClick={handlePlayPause}
                aria-label={showPlaying ? 'Pause track' : 'Play track'}
              >
                {showPlaying ? <Pause size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" style={{ marginLeft: 4 }} />}
              </button>
              
              <div className="track-page-secondary-actions">
                <LikeButton trackId={track.id} initialLikes={track.likes || 0} size="lg" />
                <button 
                  className="btn-icon" 
                  onClick={() => setShareOpen(true)}
                  aria-label="Share track"
                >
                  <Share2 size={24} />
                </button>
                <button 
                  className="btn-icon" 
                  onClick={handleAddToQueue}
                  aria-label="Add to queue"
                >
                  <ListPlus size={24} />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Metadata Section */}
        <section className="track-page-meta">
          <h2 className="track-page-meta-title">About this track</h2>
          
          {track.tags && track.tags.length > 0 && (
            <div className="track-page-tags">
              {track.tags.map(t => (
                <span key={t} className="track-page-tag">#{t}</span>
              ))}
            </div>
          )}
          
          <div className="track-page-stats">
            {track.duration && (
              <div className="track-page-stat">
                <span>Duration</span>
                <span className="track-page-stat-val">{formatTime(track.duration)}</span>
              </div>
            )}
            <div className="track-page-stat">
              <span>Likes</span>
              <span className="track-page-stat-val">{track.likes || 0}</span>
            </div>
            <div className="track-page-stat">
              <span>Uploaded</span>
              <span className="track-page-stat-val">
                {track.createdAt?.seconds ? new Date(track.createdAt.seconds * 1000).toLocaleDateString() : 'Recently'}
              </span>
            </div>
          </div>
        </section>
        
      </main>

      {/* ── Sidebar ───────────────────────────────────────────────────────── */}
      <aside className="track-page-sidebar">
        <div className="track-page-up-next">
          <h3 className="track-page-up-next-title">
            Up Next
            <span className="track-page-up-next-count">{queue.length} tracks</span>
          </h3>
          
          {queue.length === 0 ? (
            <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              Your queue is empty.
            </div>
          ) : (
            <div className="track-page-up-next-list">
              {queue.slice(0, 5).map((t) => (
                <div 
                  key={t.id} 
                  className="track-page-up-next-item"
                  onClick={() => navigate(`/track/${t.id}`)}
                >
                  {t.coverUrl ? (
                    <img src={t.coverUrl} alt={t.title} className="track-page-up-next-cover" loading="lazy" />
                  ) : (
                    <div className="track-page-up-next-cover" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Music size={16} color="var(--text-muted)" />
                    </div>
                  )}
                  <div className="track-page-up-next-info">
                    <div className="track-page-up-next-name">{t.title}</div>
                    <div className="track-page-up-next-artist">{t.username}</div>
                  </div>
                </div>
              ))}
              {queue.length > 5 && (
                <div style={{ textAlign: 'center', paddingTop: 8, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  + {queue.length - 5} more
                </div>
              )}
            </div>
          )}
        </div>
      </aside>

      <ShareToChatModal 
        isOpen={shareOpen} 
        onClose={() => setShareOpen(false)} 
        track={track} 
      />
    </div>
  );
}
