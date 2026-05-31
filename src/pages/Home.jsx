// src/pages/Home.jsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlayCircle, Trophy, Users, Zap, TrendingUp, Music, ArrowRight, Flame } from 'lucide-react';
import { getTopTracks, getNewestTracks, getTopCreators, getLiveFeed, getLatestAward } from '../firebase/firestore';
import { getPlatformStats } from '../firebase/stats';
import { useAuth } from '../context/AuthContext';
import { usePlayer } from '../context/PlayerContext';
import TrackCard from '../components/track/TrackCard';
import CreatorBadge from '../components/common/CreatorBadge';
import MomentumArrow from '../components/common/MomentumArrow';
import CountdownTimer from '../components/common/CountdownTimer';
import '../styles/pages.css';

function timeAgo(timestamp) {
  if (!timestamp?.seconds) return 'just now';
  const diff = Date.now() / 1000 - timestamp.seconds;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function Home() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { playQueue } = usePlayer();
  const [topTracks, setTopTracks] = useState([]);
  const [newestTracks, setNewestTracks] = useState([]);
  const [creators, setCreators] = useState([]);
  const [feed, setFeed] = useState([]);
  const [latestAward, setLatestAward] = useState(null);
  const [platformStats, setPlatformStats] = useState({ activeCreators: 0, tracksUploaded: 0, onlineNow: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getTopTracks(6).catch(err => { console.warn('getTopTracks failed:', err); return []; }),
      getNewestTracks(10).catch(err => { console.warn('getNewestTracks failed:', err); return []; }),
      getTopCreators(5).catch(err => { console.warn('getTopCreators failed:', err); return []; }),
      getLiveFeed(8).catch(err => { console.warn('getLiveFeed failed:', err); return []; }),
      getLatestAward().catch(err => { console.warn('getLatestAward failed:', err); return null; }),
      getPlatformStats().catch(err => { console.warn('getPlatformStats failed:', err); return { activeCreators: 0, tracksUploaded: 0, onlineNow: 0 }; })
    ]).then(([top, newest, creats, f, award, stats]) => {
      setTopTracks(top);
      setNewestTracks(newest);
      setCreators(creats);
      setFeed(f);
      setLatestAward(award);
      setPlatformStats(stats);
      setLoading(false);
    }).catch(err => {
      console.error("Critical error loading Home data", err);
      setLoading(false);
    });
  }, []);

  return (
    <div className="page animate-fade-in">
      {/* Hero */}
      <section className="home-hero">
        <div className="home-hero-eyebrow">The Home for Rising Artists</div>
        <h1 className="home-hero-title">
          Discover the Next <span className="highlight">Big Sound</span>
        </h1>
        <p className="home-hero-sub">
          BookmarkChat is where independent creators drop snippets, build their fanbase, and earn recognition through the Gold Tape Awards.
        </p>
        
        <div className="home-hero-stats">
          <div className="hero-stat">
            <div className="hero-stat-label">Active Creators</div>
            <div className="hero-stat-value">{platformStats.activeCreators.toLocaleString()}</div>
          </div>
          <div className="hero-stat">
            <div className="hero-stat-label">Tracks Uploaded</div>
            <div className="hero-stat-value">{platformStats.tracksUploaded.toLocaleString()}</div>
          </div>
          <div className="hero-stat">
            <div className="hero-stat-label">Online Now</div>
            <div className="hero-stat-value" style={{ color: '#22c55e', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span className="live-dot" style={{ position: 'relative' }} />
              {platformStats.onlineNow.toLocaleString()}
            </div>
          </div>
        </div>
      </section>

      <div className="home-layout">
        <div className="home-main">
          
          {/* Your Momentum (If Artist) */}
          {user && profile?.role === 'artist' && profile?.stats && (
            <section className="home-section" style={{
              background: 'linear-gradient(135deg, rgba(168,85,247,0.1), rgba(192,38,211,0.05))',
              border: '1px solid var(--border-accent)',
              borderRadius: 'var(--radius-lg)',
              padding: '20px',
              marginBottom: '10px'
            }}>
              <div className="section-header" style={{ marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <TrendingUp size={18} color="var(--accent)" />
                  <span className="section-title">Your Momentum</span>
                </div>
                <button className="rail-action" onClick={() => navigate(`/profile/${user.uid}`)}>
                  View Profile
                </button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Weekly Likes</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {profile.stats.weeklyLikes || 0}
                    {profile.stats.weeklyLikes > 0 && <MomentumArrow delta={profile.stats.weeklyLikes} showValue={false} />}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Followers</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{profile.stats.followers || 0}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</div>
                  <div style={{ marginTop: '4px' }}>
                    <CreatorBadge level={profile.creatorLevel} size="sm" />
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Trending Tracks Scroll */}
          <section className="home-section">
            <div className="section-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Flame size={18} color="#f59e0b" />
                <span className="section-title">Trending Right Now</span>
              </div>
              {topTracks.length > 0 && (
                <button className="play-all-btn" onClick={() => playQueue(topTracks, 0)}>
                  <PlayCircle size={15} /> Play All
                </button>
              )}
            </div>
            {loading ? (
              <div className="trending-scroll">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="trending-scroll-item skeleton-card" style={{ height: 200 }} />
                ))}
              </div>
            ) : (
              <div className="trending-scroll">
                {topTracks.map((track, i) => (
                  <div
                    key={track.id}
                    className="trending-scroll-item trending-card"
                    onClick={() => navigate(`/track/${track.id}`)}
                  >
                    {track.coverUrl ? (
                      <img src={track.coverUrl} alt={track.title} className="trending-card-img" />
                    ) : (
                      <div className="trending-card-img" style={{ background: 'var(--accent-grad)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Music size={32} color="rgba(255,255,255,0.5)" />
                      </div>
                    )}
                    <div className="trending-card-overlay" />
                    <div className="trending-card-content">
                      <div className="trending-card-rank">#{i + 1}</div>
                      <div className="trending-card-title">{track.title}</div>
                      <div className="trending-card-artist">{track.username}</div>
                      <div className="trending-card-footer">
                        {track.tags && track.tags[0] && (
                          <div className="trending-card-genre">{track.tags[0]}</div>
                        )}
                        <div className="trending-card-likes">
                          ❤️ {track.likes}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Weekly Gold Tape Preview */}
          <section className="home-section" style={{
            background: 'var(--bg-card)',
            border: '1px solid rgba(250,204,21,0.2)',
            borderRadius: 'var(--radius-lg)',
            padding: '24px',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{ position: 'absolute', top: -50, right: -50, width: 200, height: 200, background: 'radial-gradient(circle, rgba(250,204,21,0.1), transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }} />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', position: 'relative', zIndex: 1 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#facc15', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px' }}>
                  <Trophy size={14} /> Gold Tape Awards
                </div>
                <h3 style={{ fontSize: '1.2rem', margin: 0 }}>This Month's Awards</h3>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => navigate('/awards')}>
                View All <ArrowRight size={14} />
              </button>
            </div>
            
            {latestAward && latestAward.categories ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', position: 'relative', zIndex: 1 }}>
                {latestAward.categories.slice(0, 3).map((cat, i) => (
                  <div key={i} style={{ background: 'var(--bg-glass)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(250,204,21,0.1)', color: '#facc15', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>
                      {i === 0 ? '🏆' : i === 1 ? '🎛' : '🚀'}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>{cat.name}</div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{cat.winnerName || 'TBD'}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                <CountdownTimer targetDate={null} label="Next Awards Reveal In" />
                <div style={{ flex: 1, color: 'var(--text-secondary)', fontSize: '0.85rem', paddingLeft: '20px', borderLeft: '1px solid var(--border)' }}>
                  Keep creating and engaging to increase your chances of winning a Gold Tape this month!
                </div>
              </div>
            )}
          </section>

          {/* New Releases */}
          <section className="home-section">
            <div className="section-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Music size={18} color="var(--accent)" />
                <span className="section-title">Fresh Drops</span>
              </div>
              <button className="rail-action" onClick={() => navigate('/discover')}>
                Discover More
              </button>
            </div>
            <div className="tracks-grid">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="skeleton-card" style={{ opacity: 1 - i * 0.15 }} />
                ))
              ) : newestTracks.length > 0 ? (
                newestTracks.map(track => <TrackCard key={track.id} track={track} />)
              ) : (
                <div className="empty-state">No tracks uploaded yet.</div>
              )}
            </div>
          </section>
        </div>

        {/* Right Rail */}
        <div className="home-rail">
          {/* Top Creators */}
          <div className="rail-card">
            <div className="rail-header">
              <span className="rail-title" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Users size={14} color="var(--accent)" /> Top Creators
              </span>
              <button className="rail-action" onClick={() => navigate('/artists')}>View All</button>
            </div>
            <div className="creator-list">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} style={{ height: 64, background: 'var(--bg-glass)', borderRadius: 'var(--radius-md)' }} />
                ))
              ) : (
                creators.map((creator) => (
                  <div key={creator.uid} className="creator-row" onClick={() => navigate(`/profile/${creator.uid}`)}>
                    <div className="creator-avatar">
                      {creator.avatarUrl ? (
                        <img src={creator.avatarUrl} alt={creator.username} />
                      ) : (
                        <div className="creator-avatar-fallback">{(creator.username || 'A').slice(0,2).toUpperCase()}</div>
                      )}
                    </div>
                    <div className="creator-info">
                      <div className="creator-name">{creator.username}</div>
                      <div className="creator-meta">
                        <CreatorBadge level={creator.creatorLevel} size="sm" showLabel={false} />
                        <span className="creator-likes">{creator.stats?.totalLikes || 0} likes</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Live Feed */}
          <div className="rail-card">
            <div className="rail-header">
              <span className="rail-title" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Zap size={14} color="var(--success)" /> Live Feed
              </span>
              <button className="rail-action" onClick={() => navigate('/feed')}>View All</button>
            </div>
            <div className="feed-list">
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} style={{ height: 48, background: 'var(--bg-glass)', borderRadius: 'var(--radius-sm)' }} />
                ))
              ) : feed.length === 0 ? (
                <div className="empty-state" style={{ padding: '20px 0' }}>
                  <p style={{ fontSize: '0.8rem' }}>No activity yet.</p>
                </div>
              ) : (
                feed.map(item => (
                  <div key={item.id} className="feed-item" onClick={() => {
                    if (item.trackId) navigate(`/track/${item.trackId}`);
                    else if (item.uid) navigate(`/profile/${item.uid}`);
                  }} style={{ cursor: 'pointer' }}>
                    <div className="feed-avatar">
                      {item.avatarUrl ? (
                        <img src={item.avatarUrl} alt={item.username} />
                      ) : (
                        <div className="feed-avatar-fallback" style={{ background: item.type === 'like' ? '#ef4444' : item.type === 'follow' ? '#3b82f6' : 'var(--accent)' }}>
                          {(item.username || 'A').slice(0,1).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="feed-content">
                      <div className="feed-text">
                        <span className="feed-name">{item.username || 'Someone'}</span> {item.message}
                      </div>
                      {item.trackTitle && <div className="feed-track">"{item.trackTitle}"</div>}
                      <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                        {timeAgo(item.createdAt)}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
