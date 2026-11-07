import { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Compass, Music, Flame, Zap, TrendingUp, Search, X } from 'lucide-react';
import { 
  getTopTracks, 
  getRisingTracks, 
  getNewestTracks, 
  getTopCreators,
  searchTracks,
  searchUsers 
} from '../firebase/firestore';
import TrackCard from '../components/track/TrackCard';
import CreatorBadge from '../components/common/CreatorBadge';
import { usePlayer } from '../context/PlayerContext';
import '../styles/discover-search.css';
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
  const [searchParams, setSearchParams] = useSearchParams();
  const { playQueue } = usePlayer();
  const q = searchParams.get('q') || '';
  const searchInputRef = useRef(null);

  // Explore Hub State
  const [loading, setLoading] = useState(true);
  const [topTracks, setTopTracks] = useState([]);
  const [risingTracks, setRisingTracks] = useState([]);
  const [newestTracks, setNewestTracks] = useState([]);
  const [topCreators, setTopCreators] = useState([]);

  // Search Results State
  const [searchTrackResults, setSearchTrackResults] = useState([]);
  const [searchCreatorResults, setSearchCreatorResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState(false);

  // Load Explore Hub Data
  useEffect(() => {
    let isMounted = true;
    if (q) return;
    
    Promise.all([
      getTopTracks(12).catch(e => { console.error('getTopTracks err:', e); return []; }),
      getRisingTracks(6).catch(e => { console.error('getRisingTracks err:', e); return []; }),
      getNewestTracks(12).catch(e => { console.error('getNewestTracks err:', e); return []; }),
      getTopCreators(6).catch(e => { console.error('getTopCreators err:', e); return []; }),
    ]).then(([top, rising, newest, creators]) => {
      if (!isMounted) return;
      setTopTracks(top || []);
      setRisingTracks(rising || []);
      setNewestTracks(newest || []);
      setTopCreators(creators || []);
      setLoading(false);
    }).catch((e) => {
      console.error('Discover page error:', e);
      if (isMounted) setLoading(false);
    });
    return () => { isMounted = false; };
  }, [q]);

  // Load Search Data
  useEffect(() => {
    if (!q.trim()) {
      setSearchTrackResults([]);
      setSearchCreatorResults([]);
      return;
    }
    
    let isMounted = true;
    setSearchLoading(true);
    setSearchError(false);

    const timer = setTimeout(() => {
      Promise.all([
        searchTracks(q.trim()),
        searchUsers(q.trim())
      ]).then(([tracks, users]) => {
        if (!isMounted) return;
        setSearchTrackResults(tracks || []);
        setSearchCreatorResults(users || []);
        setSearchLoading(false);
      }).catch(err => {
        console.error('Search error:', err);
        if (!isMounted) return;
        setSearchError(true);
        setSearchLoading(false);
      });
    }, 400);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [q]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchInputRef.current) searchInputRef.current.blur();
  };

  const handleClear = () => {
    setSearchParams({});
    if (searchInputRef.current) searchInputRef.current.focus();
  };

  return (
    <div className="page discover-page animate-fade-in explore-container">
      
      {/* ── Search Bar ──────────────────────────────────────────────────────── */}
      <form className="explore-search-wrap" role="search" onSubmit={handleSearchSubmit} style={{ marginBottom: 40, maxWidth: 600, margin: '0 auto 40px', position: 'relative', width: '100%' }}>
        <Search size={20} className="explore-search-icon" aria-hidden="true" style={{ position: 'absolute', left: 20, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
        <input 
          ref={searchInputRef}
          type="search"
          className="explore-search-input"
          placeholder="Search for songs, artists, creators..."
          value={q}
          onChange={(e) => {
            if (e.target.value) {
              setSearchParams({ q: e.target.value });
            } else {
              setSearchParams({});
            }
          }}
          aria-label="Search"
          style={{ width: '100%', padding: '16px 48px 16px 56px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-round)', fontSize: '1.125rem', color: 'var(--text-primary)', boxShadow: 'var(--shadow-sm)' }}
        />
        {q && (
          <button type="button" className="explore-search-clear" onClick={handleClear} aria-label="Clear Search" style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', background: 'var(--bg-elevated)', border: 'none', borderRadius: '50%', padding: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <X size={16} />
          </button>
        )}
      </form>

      {/* ── Search Results Mode ─────────────────────────────────────────────── */}
      {q.trim() ? (
        <div className="search-results-layout" style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
          {searchLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
              <div className="spinner" style={{ width: 48, height: 48 }} />
            </div>
          ) : searchError ? (
            <div className="search-empty-state" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, padding: '64px 24px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <X size={32} />
              <h3>Couldn't complete your search</h3>
              <p>Please try again later.</p>
            </div>
          ) : searchCreatorResults.length === 0 && searchTrackResults.length === 0 ? (
            <div className="search-empty-state" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, padding: '64px 24px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <Search size={32} />
              <h3>No results found for "{q}"</h3>
              <p>Try searching for a different track, artist, or genre.</p>
            </div>
          ) : (
            <>
              {/* Creator Results */}
              {searchCreatorResults.length > 0 && (
                <section>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-light)', paddingBottom: 16, marginBottom: 24 }}>Creators</h2>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 24 }}>
                    {searchCreatorResults.map(creator => (
                      <div 
                        key={creator.uid} 
                        className="explore-creator-card"
                        onClick={() => navigate(`/profile/${creator.uid}`)}
                        role="button"
                        tabIndex={0}
                      >
                        {creator.avatarUrl ? (
                          <img src={creator.avatarUrl} alt={creator.username} className="explore-creator-avatar" />
                        ) : (
                          <div className="explore-creator-avatar-fallback">
                            {(creator.username || '?').slice(0, 2).toUpperCase()}
                          </div>
                        )}
                        <div className="explore-creator-info">
                          <div className="explore-creator-name">{creator.username}</div>
                          <CreatorBadge level={creator.creatorLevel} size="sm" />
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Track Results */}
              {searchTrackResults.length > 0 && (
                <section>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-light)', paddingBottom: 16, marginBottom: 24 }}>Tracks</h2>
                  <div className="tracks-grid">
                    {searchTrackResults.map(track => (
                      <TrackCard key={track.id} track={track} />
                    ))}
                  </div>
                </section>
              )}
            </>
          )}
        </div>
      ) : (
        /* ── Explore Hub Mode ────────────────────────────────────────────────── */
        <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
          
          <div className="discover-hero" style={{ marginBottom: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <Compass size={32} color="var(--accent)" />
              <h1 style={{ fontSize: '2.5rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>Discover</h1>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.125rem' }}>
              Find your next favorite rising artist.
            </p>
          </div>

          {/* Genres Grid */}
          <section className="discover-section">
            <div className="section-header" style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24 }}>
              <Music size={20} color="var(--accent)" />
              <span className="section-title" style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>Browse by Genre</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16 }}>
              {GENRES.map((g) => (
                <button
                  key={g.id}
                  onClick={() => setSearchParams({ q: g.name })}
                  className="explore-genre-card hover-lift"
                  style={{
                    background: g.color,
                    border: 'none',
                    textAlign: 'left'
                  }}
                  aria-label={`Search for ${g.name} genre`}
                >
                  <span style={{ fontSize: '2rem' }}>{g.emoji}</span>
                  <span style={{ fontWeight: 800, color: '#fff', fontSize: '1.125rem' }}>{g.name}</span>
                </button>
              ))}
            </div>
          </section>

          {/* Rising Fast */}
          {risingTracks.length > 0 && (
            <section className="discover-section">
              <div className="section-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <TrendingUp size={20} color="#22c55e" />
                  <span className="section-title" style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>Rising Fast</span>
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

          <div className="discover-layout-grid">
            
            {/* Left Column - Top Tracks & Newest */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
              
              <section className="discover-section">
                <div className="section-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Flame size={20} color="#f59e0b" />
                    <span className="section-title" style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>Popular Tracks</span>
                  </div>
                  <button className="play-all-btn" onClick={() => playQueue(topTracks, 0)}>
                    Play All
                  </button>
                </div>
                {loading ? (
                  <div className="tracks-grid">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="skeleton-card" style={{ height: 72, background: 'var(--bg-card)', borderRadius: 'var(--radius-md)', opacity: 1 - i * 0.15 }} />
                    ))}
                  </div>
                ) : (
                  <div className="tracks-grid">
                    {topTracks.slice(0, 8).map((track, i) => (
                      <TrackCard key={track.id} track={track} rank={i + 1} showRank={true} />
                    ))}
                  </div>
                )}
              </section>

              <section className="discover-section">
                <div className="section-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Zap size={20} color="var(--accent)" />
                    <span className="section-title" style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>Fresh Drops</span>
                  </div>
                  <button className="play-all-btn" onClick={() => playQueue(newestTracks, 0)}>
                    Play All
                  </button>
                </div>
                {loading ? (
                  <div className="tracks-grid">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="skeleton-card" style={{ height: 72, background: 'var(--bg-card)', borderRadius: 'var(--radius-md)', opacity: 1 - i * 0.15 }} />
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
            <div style={{ position: 'sticky', top: '100px', paddingTop: '0px' }}>
              <section className="rail-card" style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', padding: 24, border: '1px solid var(--border)' }}>
                <div className="rail-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                  <span className="rail-title" style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-primary)' }}>Artists to Watch</span>
                  <button className="rail-action" onClick={() => navigate('/artists')} style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 600 }}>
                    View All
                  </button>
                </div>
                {loading ? (
                  <div className="creator-list" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} style={{ height: 48, background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', opacity: 1 - i * 0.15 }} />
                    ))}
                  </div>
                ) : (
                  <div className="creator-list" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {topCreators.map((creator) => (
                      <div
                        key={creator.uid}
                        className="creator-row"
                        onClick={() => navigate(`/profile/${creator.uid}`)}
                        style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', padding: '8px', borderRadius: 'var(--radius-md)', transition: 'background 0.2s', margin: '-8px' }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-elevated)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                      >
                        <div className="creator-avatar" style={{ width: 48, height: 48, borderRadius: '50%', overflow: 'hidden', flexShrink: 0 }}>
                          {creator.avatarUrl ? (
                            <img src={creator.avatarUrl} alt={creator.username} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            <div className="creator-avatar-fallback" style={{ width: '100%', height: '100%', background: 'var(--accent-grad)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700 }}>
                              {(creator.username || 'A').slice(0, 2).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div className="creator-info" style={{ display: 'flex', flexDirection: 'column', gap: 4, overflow: 'hidden' }}>
                          <div className="creator-name" style={{ fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{creator.username}</div>
                          <div className="creator-meta" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <CreatorBadge level={creator.creatorLevel} size="sm" />
                            <span className="creator-likes" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
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
      )}
    </div>
  );
}
