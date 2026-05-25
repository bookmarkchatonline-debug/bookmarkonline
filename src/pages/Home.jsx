// src/pages/Home.jsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getTopTracks, getNewestTracks } from '../firebase/firestore';
import { usePlayer } from '../context/PlayerContext';
import TrackCard from '../components/track/TrackCard';
import { Play, Pause, Music, TrendingUp, Zap, PlayCircle } from 'lucide-react';
import '../styles/pages.css';
import '../styles/components.css';

function TrendingCard({ track, rank }) {
  const { play, pause, currentTrack, isPlaying } = usePlayer();
  const navigate = useNavigate();
  const isCurrent = currentTrack?.id === track.id && isPlaying;

  return (
    <div className="trending-scroll-item">
      <div
        className="trending-card"
        style={{ width: '100%', height: '100%' }}
        onClick={() => navigate(`/track/${track.id}`)}
      >
        {track.coverUrl ? (
          <img src={track.coverUrl} alt={track.title} className="trending-card-img" />
        ) : (
          <div
            className="trending-card-img"
            style={{
              background: `linear-gradient(135deg, hsl(${(rank * 47) % 360}, 60%, 20%), hsl(${(rank * 47 + 60) % 360}, 70%, 15%))`,
              width: '100%', height: '100%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <Music size={32} color="rgba(255,255,255,0.3)" />
          </div>
        )}
        <div className="trending-card-overlay" />
        <div className="trending-card-content">
          <div className="trending-card-rank">{rank}</div>
          <div className="trending-card-title">{track.title}</div>
          <div className="trending-card-artist">{track.username}</div>
          <div className="trending-card-footer">
            <span className="trending-card-genre">
              {track.tags?.[0] ? `#${track.tags[0]}` : 'SNIPPET'}
            </span>
            <span className="trending-card-likes">♥ {track.likes || 0}</span>
          </div>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); isCurrent ? pause() : play(track); }}
          style={{
            position: 'absolute', top: 8, right: 8,
            width: 28, height: 28,
            background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
            borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', zIndex: 10,
          }}
          aria-label={isCurrent ? 'Pause' : 'Play'}
        >
          {isCurrent ? <Pause size={12} fill="#fff" /> : <Play size={12} fill="#fff" />}
        </button>
      </div>
    </div>
  );
}

export default function Home() {
  const { playQueue } = usePlayer();
  const navigate = useNavigate();
  const [topTracks, setTopTracks] = useState([]);
  const [newTracks, setNewTracks] = useState([]);
  const [loadingTop, setLoadingTop] = useState(true);
  const [loadingNew, setLoadingNew] = useState(true);

  useEffect(() => {
    getTopTracks(10).then((data) => { setTopTracks(data); setLoadingTop(false); });
    getNewestTracks(20).then((data) => { setNewTracks(data); setLoadingNew(false); });
  }, []);

  return (
    <div className="page">
      {/* Hero */}
      <div className="home-hero animate-fade-in">
        <div className="home-hero-eyebrow">🔥 Trending Now</div>
        <h1 className="home-hero-title">
          THE CULTURE.<br />
          <span className="highlight">IN REAL TIME.</span>
        </h1>
        <p className="home-hero-sub">
          Discover rising music, rank what's hot, and share 15–60 second snippets with the community.
        </p>
      </div>

      {/* Trending Now */}
      <section style={{ marginBottom: 32 }}>
        <div className="section-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span className="section-title">Trending Now</span>
            <span className="live-badge">
              <span className="live-dot" />
              LIVE
            </span>
          </div>
          <a href="/rankings" className="section-action">View All →</a>
        </div>

        {loadingTop ? (
          <div style={{ display: 'flex', gap: 14, overflow: 'hidden' }}>
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                style={{
                  width: 160, height: 200, borderRadius: 'var(--radius-lg)',
                  background: 'var(--bg-card)', flexShrink: 0,
                  animation: `pulse-dot 1.5s ease ${i * 0.1}s infinite`,
                }}
              />
            ))}
          </div>
        ) : topTracks.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🎵</div>
            <p>No tracks yet. Be the first to upload!</p>
          </div>
        ) : (
          <div className="trending-scroll">
            {topTracks.map((track, i) => (
              <TrendingCard key={track.id} track={track} rank={i + 1} />
            ))}
          </div>
        )}
      </section>

      {/* New Uploads */}
      <section>
        <div className="section-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Zap size={16} color="var(--accent)" />
            <span className="section-title">New Uploads</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {newTracks.length > 0 && (
              <button
                className="play-all-btn"
                onClick={() => playQueue(newTracks, 0)}
                aria-label="Play all new uploads"
                id="home-play-all-btn"
              >
                <PlayCircle size={15} />
                Play All
              </button>
            )}
            <a href="/discover" className="section-action">View All →</a>
          </div>
        </div>

        {loadingNew ? (
          <div className="tracks-grid">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                style={{
                  height: 72, borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-card)',
                  opacity: 1 - i * 0.1,
                }}
              />
            ))}
          </div>
        ) : newTracks.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🎧</div>
            <p>Upload the first snippet!</p>
          </div>
        ) : (
          <div className="tracks-grid">
            {newTracks.map((track) => (
              <TrackCard key={track.id} track={track} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
