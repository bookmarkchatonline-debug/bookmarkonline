// src/pages/Discover.jsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Compass, Music, Flame, Search, ArrowRight, Zap, TrendingUp, Mic } from 'lucide-react';
import { getTopTracks, getNewestTracks, getRisingTracks, getTopCreators } from '../firebase/firestore';
import TrackCard from '../components/track/TrackCard';
import CreatorBadge from '../components/common/CreatorBadge';
import { usePlayer } from '../context/PlayerContext';
import '../styles/pages.css';

const GENRES = [
  { id: 'hiphop', name: 'Hip Hop', emoji: '🎤', color: 'linear-gradient(135deg, #ef4444, #f97316)' },
  { id: 'rnb', name: 'R&B', emoji: '💝', color: 'linear-gradient(135deg, #a855f7, #c026d3)' },
  { id: 'pop', name: 'Pop', emoji: '✨', color: 'linear-gradient(135deg, #3b82f6, #06b6d4)' },
  { id: 'electronic', name: 'Electronic', emoji: '⚡', color: 'linear-gradient(135deg, #22c55e, #10b981)' },
  { id: 'indie', name: 'Indie', emoji: '🎸', color: 'linear-gradient(135deg, #f59e0b, #eab308)' },
  { id: 'beats', name: 'Beats', emoji: '🥁', color: 'linear-gradient(135deg, #6366f1, #8b5cf6)' },
];

export default function Discover() {
  const navigate = useNavigate();
  const { playQueue } = usePlayer();
  const [topTracks, setTopTracks] = useState([]);
  const [risingTracks, setRisingTracks] = useState([]);
  const [newestTracks, setNewestTracks] = useState([]);
  const [topCreators, setTopCreators] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getTopTracks(12),
      getRisingTracks(6),
      getNewestTracks(12),
      getTopCreators(6),
    ]).then(([top, rising, newest, creators]) => {
      setTopTracks(top);
      setRisingTracks(rising);
      setNewestTracks(newest);
      setTopCreators(creators);
      setLoading(false);
    });
  }, []);

  return (
    <div className="page discover-page animate-fade-in">
      <div className="discover-hero">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <Compass size={28} color="var(--accent)" />
          <h1 style={{ fontSize: '2rem', margin: 0 }}>Discover</h1>
        </div>
        <p style={{ color: 'var(--text-secondary)' }}>
          Find your next favorite rising artist.
        </p>
      </div>

      {/* Genres Grid */}
      <section className="discover-section" style={{ marginBottom: 32 }}>
        <div className="section-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Music size={18} color="var(--accent)" />
            <span className="section-title">Browse by Genre</span>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
          {GENRES.map((g) => (
            <div
              key={g.id}
              onClick={() => {
                const searchInput = document.getElementById('topbar-search-input');
                if (searchInput) {
                  searchInput.value = g.name;
                  searchInput.focus();
                  searchInput.dispatchEvent(new Event('change', { bubbles: true }));
                }
              }}
              style={{
                background: g.color,
                borderRadius: 'var(--radius-lg)',
                padding: '16px',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                boxShadow: 'var(--shadow-sm)',
                transition: 'transform 0.2s',
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'none'}
            >
              <span style={{ fontSize: '1.5rem' }}>{g.emoji}</span>
              <span style={{ fontWeight: 700, color: '#fff' }}>{g.name}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Rising Fast */}
      {risingTracks.length > 0 && (
        <section className="discover-section" style={{ marginBottom: 32 }}>
          <div className="section-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <TrendingUp size={18} color="#22c55e" />
              <span className="section-title">Rising Fast</span>
            </div>
            <button className="play-all-btn" onClick={() => playQueue(risingTracks, 0)}>
              Play All
            </button>
          </div>
          <div className="tracks-grid">
            {risingTracks.map((track) => (
              <TrackCard key={track.id} track={track} />
            ))}
          </div>
        </section>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 300px', gap: '24px', alignItems: 'start' }}>
        {/* Left Column - Top Tracks & Newest */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          
          <section className="discover-section">
            <div className="section-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Flame size={18} color="#f59e0b" />
                <span className="section-title">Popular Tracks</span>
              </div>
              <button className="play-all-btn" onClick={() => playQueue(topTracks, 0)}>
                Play All
              </button>
            </div>
            {loading ? (
              <div className="tracks-grid">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="skeleton-card" style={{ opacity: 1 - i * 0.15 }} />
                ))}
              </div>
            ) : (
              <div className="tracks-grid">
                {topTracks.slice(0, 8).map((track) => (
                  <TrackCard key={track.id} track={track} />
                ))}
              </div>
            )}
          </section>

          <section className="discover-section">
            <div className="section-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Zap size={18} color="var(--accent)" />
                <span className="section-title">Fresh Drops</span>
              </div>
              <button className="play-all-btn" onClick={() => playQueue(newestTracks, 0)}>
                Play All
              </button>
            </div>
            {loading ? (
              <div className="tracks-grid">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="skeleton-card" style={{ opacity: 1 - i * 0.15 }} />
                ))}
              </div>
            ) : (
              <div className="tracks-grid">
                {newestTracks.map((track) => (
                  <TrackCard key={track.id} track={track} />
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Right Column - Artists to Watch */}
        <div style={{ position: 'sticky', top: 'var(--topbar-height)', paddingTop: '24px' }}>
          <section className="rail-card">
            <div className="rail-header">
              <span className="rail-title">Artists to Watch</span>
              <button className="rail-action" onClick={() => navigate('/artists')}>
                View All
              </button>
            </div>
            {loading ? (
              <div className="creator-list">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} style={{ height: 64, background: 'var(--bg-glass)', borderRadius: 'var(--radius-md)', opacity: 1 - i * 0.15 }} />
                ))}
              </div>
            ) : (
              <div className="creator-list">
                {topCreators.map((creator) => (
                  <div
                    key={creator.uid}
                    className="creator-row"
                    onClick={() => navigate(`/profile/${creator.uid}`)}
                  >
                    <div className="creator-avatar">
                      {creator.avatarUrl ? (
                        <img src={creator.avatarUrl} alt={creator.username} />
                      ) : (
                        <div className="creator-avatar-fallback">
                          {(creator.username || 'A').slice(0, 2).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="creator-info">
                      <div className="creator-name">{creator.username}</div>
                      <div className="creator-meta">
                        <CreatorBadge level={creator.creatorLevel} size="sm" />
                        <span className="creator-likes">
                          {creator.stats?.totalLikes || 0} likes
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
