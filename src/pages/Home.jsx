import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, PlayCircle, Trophy, Music, Compass, Sparkles, Pause } from 'lucide-react';
import { getTopTracks, getNewestTracks, getTopCreators, getLiveFeed, getLatestAward } from '../firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { usePlayer } from '../context/PlayerContext';
import TrackCard from '../components/track/TrackCard';
import CreatorBadge from '../components/common/CreatorBadge';
import LikeButton from '../components/track/LikeButton';
import '../styles/home.css';

function timeAgo(timestamp) {
  if (!timestamp?.seconds) return 'just now';
  const diff = Date.now() / 1000 - timestamp.seconds;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function Home() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const { play, playQueue, currentTrack, isPlaying } = usePlayer();
  
  const [topTracks, setTopTracks] = useState([]);
  const [newestTracks, setNewestTracks] = useState([]);
  const [creators, setCreators] = useState([]);
  const [feed, setFeed] = useState([]);
  const [latestAward, setLatestAward] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    Promise.all([
      getTopTracks(8).catch(() => []),
      getNewestTracks(8).catch(() => []),
      getTopCreators(6).catch(() => []),
      getLiveFeed(8).catch(() => []),
      getLatestAward().catch(() => null)
    ]).then(([top, newest, creats, f, award]) => {
      if (!active) return;
      setTopTracks(top);
      setNewestTracks(newest);
      setCreators(creats);
      setFeed(f);
      setLatestAward(award);
      setLoading(false);
    }).catch(() => {
      if (!active) return;
      setLoading(false);
    });
    return () => { active = false; };
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const featuredTrack = topTracks[0];
  const trendingTracks = topTracks.slice(1);

  if (loading) {
    return <HomeSkeleton />;
  }

  return (
    <div className="home-container animate-fade-in">
      {/* 1. Hero / Welcome */}
      <header className="home-welcome">
        <div>
          <h1 className="home-greeting">{getGreeting()}{profile?.username ? `, ${profile.username}` : ''}</h1>
          <p className="home-subtitle">Discover your next favorite track.</p>
        </div>
        <div className="home-welcome-actions">
          <button className="btn btn-primary" onClick={() => navigate('/discover')}>
            <Compass size={16} /> Explore Music
          </button>
        </div>
      </header>

      {/* 2. Featured / Spotlight */}
      {featuredTrack && (
        <section className="home-spotlight" onClick={() => navigate(`/track/${featuredTrack.id}`)}>
          <div className="spotlight-bg" style={{ backgroundImage: `url(${featuredTrack.coverUrl || ''})` }} />
          <div className="spotlight-overlay" />
          <div className="spotlight-content">
            <div className="spotlight-badge"><Sparkles size={14} /> Spotlight</div>
            <div className="spotlight-info">
              <h2 className="spotlight-title">{featuredTrack.title}</h2>
              <p className="spotlight-artist" onClick={(e) => { e.stopPropagation(); navigate(`/profile/${featuredTrack.uid}`); }}>
                {featuredTrack.username}
              </p>
            </div>
            <div className="spotlight-actions" onClick={(e) => e.stopPropagation()}>
              <button 
                className="btn btn-primary btn-lg spotlight-play" 
                onClick={() => play(featuredTrack)}
                aria-label={currentTrack?.id === featuredTrack.id && isPlaying ? "Pause" : "Play"}
              >
                {currentTrack?.id === featuredTrack.id && isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" />}
                Play
              </button>
              <LikeButton trackId={featuredTrack.id} initialLikes={featuredTrack.likes || 0} />
            </div>
          </div>
        </section>
      )}

      {/* 3. Trending Music */}
      {trendingTracks.length > 0 && (
        <section className="home-section">
          <div className="home-section-header">
            <h2>Trending Music</h2>
            <button className="home-see-all" onClick={() => playQueue(trendingTracks, 0)}>
              Play All <PlayCircle size={14} />
            </button>
          </div>
          <div className="home-horizontal-scroll">
            {trendingTracks.map(track => (
              <div key={track.id} className="home-track-card" onClick={() => navigate(`/track/${track.id}`)}>
                <div className="home-track-cover-wrap">
                  {track.coverUrl ? (
                    <img src={track.coverUrl} alt={track.title} className="home-track-cover" loading="lazy" />
                  ) : (
                    <div className="home-track-cover placeholder"><Music size={24} /></div>
                  )}
                  <button 
                    className="home-track-play-btn" 
                    onClick={(e) => { e.stopPropagation(); play(track); }}
                    aria-label="Play Track"
                  >
                    <Play fill="currentColor" size={16} />
                  </button>
                </div>
                <div className="home-track-meta">
                  <div className="home-track-title">{track.title}</div>
                  <div className="home-track-artist">{track.username}</div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="home-grid-layout">
        <div className="home-main-col">
          {/* 4. New Releases */}
          <section className="home-section">
            <div className="home-section-header">
              <h2>New Releases</h2>
              <button className="home-see-all" onClick={() => navigate('/discover')}>View All</button>
            </div>
            {newestTracks.length > 0 ? (
              <div className="home-vertical-list">
                {newestTracks.map(track => (
                  <TrackCard key={track.id} track={track} />
                ))}
              </div>
            ) : (
              <div className="empty-state">No new releases yet.</div>
            )}
          </section>

          {/* 6. Community Activity */}
          {feed.length > 0 && (
            <section className="home-section" style={{ marginTop: '32px' }}>
              <div className="home-section-header">
                <h2>Community Activity</h2>
              </div>
              <div className="home-feed-list">
                {feed.map(item => (
                  <div key={item.id} className="home-feed-item" onClick={() => {
                    if (item.trackId) navigate(`/track/${item.trackId}`);
                    else if (item.uid) navigate(`/profile/${item.uid}`);
                  }}>
                    <div className="home-feed-avatar">
                      {item.avatarUrl ? (
                        <img src={item.avatarUrl} alt={item.username || 'User'} loading="lazy" />
                      ) : (
                        <div className="placeholder">{(item.username || 'A')[0].toUpperCase()}</div>
                      )}
                    </div>
                    <div className="home-feed-content">
                      <p><span className="home-feed-name">{item.username || 'Someone'}</span> {item.message}</p>
                      {item.trackTitle && <p className="home-feed-track">"{item.trackTitle}"</p>}
                      <span className="home-feed-time">{timeAgo(item.createdAt)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        <div className="home-side-col">
          {/* 5. Discover Creators */}
          {creators.length > 0 && (
            <section className="home-section">
              <div className="home-section-header">
                <h2>Discover Creators</h2>
                <button className="home-see-all" onClick={() => navigate('/artists')}>View All</button>
              </div>
              <div className="home-creators-grid">
                {creators.map(creator => (
                  <div key={creator.uid} className="home-creator-card" onClick={() => navigate(`/profile/${creator.uid}`)}>
                    <div className="home-creator-avatar">
                      {creator.avatarUrl ? (
                        <img src={creator.avatarUrl} alt={creator.username} loading="lazy" />
                      ) : (
                        <div className="placeholder">{(creator.username || 'C')[0].toUpperCase()}</div>
                      )}
                    </div>
                    <div className="home-creator-info">
                      <div className="home-creator-name">{creator.username}</div>
                      <CreatorBadge level={creator.creatorLevel} size="sm" showLabel={false} />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* 7. Weekly Winners / Gold Tape */}
          <section className="home-section home-award-section" style={{ marginTop: '32px' }}>
            <div className="home-award-card">
              <div className="home-award-header">
                <Trophy size={16} color="#facc15" />
                <h3>Gold Tape Awards</h3>
              </div>
              {latestAward && latestAward.categories && latestAward.categories.length > 0 ? (
                <div className="home-award-winners">
                  {latestAward.categories.slice(0, 3).map((cat, i) => (
                    <div key={i} className="home-award-winner">
                      <div className="home-award-rank">#{i+1}</div>
                      <div className="home-award-info">
                        <div className="home-award-cat">{cat.name}</div>
                        <div className="home-award-name">{cat.winnerName || 'TBD'}</div>
                      </div>
                    </div>
                  ))}
                  <button className="btn btn-ghost btn-block" onClick={() => navigate('/awards')}>View All Winners</button>
                </div>
              ) : (
                <div className="home-award-empty">
                  <p>Next awards revealing soon. Keep creating and engaging!</p>
                  <button className="btn btn-outline btn-block" onClick={() => navigate('/awards')}>Learn More</button>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function HomeSkeleton() {
  return (
    <div className="home-container">
      <div className="skeleton-hero" style={{ height: 80, marginBottom: 24, borderRadius: 'var(--radius-lg)' }} />
      <div className="skeleton-hero" style={{ height: 320, marginBottom: 32, borderRadius: 'var(--radius-xl)' }} />
      <div className="skeleton-hero" style={{ height: 200, marginBottom: 32, borderRadius: 'var(--radius-lg)' }} />
      <div className="home-grid-layout">
        <div className="skeleton-hero" style={{ height: 400, borderRadius: 'var(--radius-lg)' }} />
        <div className="skeleton-hero" style={{ height: 400, borderRadius: 'var(--radius-lg)' }} />
      </div>
    </div>
  );
}
