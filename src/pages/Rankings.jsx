// src/pages/Rankings.jsx
import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getTopTracks, getNewestTracks, getArtistRankings, getRisingTracks } from '../firebase/firestore';
import CreatorBadge from '../components/common/CreatorBadge';
import MomentumArrow from '../components/common/MomentumArrow';
import { usePlayer } from '../context/PlayerContext';
import {
  BarChart2, Clock, PlayCircle, Users, TrendingUp, Crown,
  Flame, Music, Heart, Trophy, Filter,
} from 'lucide-react';
import '../styles/pages.css';

const TRACK_TABS = [
  { id: 'tracks',  label: 'Track Rankings',  icon: Music },
  { id: 'artists', label: 'Artist Rankings', icon: Users },
];
const FILTER_CHIPS = [
  { id: 'rising', label: 'Rising Fast',  icon: TrendingUp },
  { id: 'week',   label: 'This Week',    icon: Clock },
  { id: 'all',    label: 'All Genres',   icon: Filter },
];

/* ── random-looking waveform bars ── */
function Waveform({ seed = 0 }) {
  const heights = [6,10,16,8,20,12,6,18,10,14,8,16,6,12,20];
  return (
    <div className="rankings-track-waveform">
      {heights.map((h, i) => (
        <div key={i} className="waveform-bar" style={{ height: h, opacity: 0.5 + (i % 3) * 0.17 }} />
      ))}
    </div>
  );
}

function TrackRankRow({ track, rank, onClick, isNew }) {
  const rankClass = rank <= 3 ? `rank-${rank}` : 'rank-default';
  const likePct = track.likes > 0 ? `+${Math.min(99, Math.floor(track.likes / 10))}%` : '+0%';
  return (
    <div className="rankings-track-row" onClick={onClick} role="button" tabIndex={0}>
      {/* Rank */}
      <div className="rankings-track-rank-col">
        <span className={`rankings-track-num rank-number ${rankClass}`}>{rank}</span>
        <MomentumArrow delta={track.rankDelta ?? 1} size={11} showValue={false} />
      </div>

      {/* Cover */}
      <div className="rankings-track-cover">
        {track.coverUrl
          ? <img src={track.coverUrl} alt={track.title} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'var(--radius-sm)' }} />
          : <Music size={20} color="rgba(255,255,255,0.3)" />
        }
      </div>

      {/* Info */}
      <div className="rankings-track-info">
        <div className="rankings-track-title">
          {track.title}
          {isNew && <span className="new-badge">NEW</span>}
        </div>
        <div className="rankings-track-artist">{track.username}</div>
      </div>

      {/* Waveform */}
      <Waveform seed={rank} />

      {/* Likes */}
      <div className="rankings-track-likes">
        <span className="rankings-track-likes-count">
          {track.likes >= 1000 ? `${(track.likes / 1000).toFixed(1)}K` : track.likes || 0}
        </span>
        <span className="rankings-track-likes-pct">{likePct}</span>
      </div>

      {/* Like btn */}
      <button
        className="rankings-track-like-btn"
        onClick={(e) => { e.stopPropagation(); }}
        aria-label="Like"
      >
        <Heart size={18} />
      </button>
    </div>
  );
}

function ArtistRankRow({ artist, rank }) {
  const navigate = useNavigate();
  return (
    <div className="artist-rank-row" onClick={() => navigate(`/profile/${artist.uid}`)}>
      <div className="artist-rank-pos">
        <span className={`rank-number rank-${rank <= 3 ? rank : 'default'}`}>{rank}</span>
        <MomentumArrow delta={artist.rankDelta} size={12} showValue={false} />
      </div>
      <div className="artist-rank-avatar">
        {artist.avatarUrl ? (
          <img src={artist.avatarUrl} alt={artist.username} />
        ) : (
          <div className="artist-rank-avatar-fallback">
            {(artist.username || 'A').slice(0, 2).toUpperCase()}
          </div>
        )}
      </div>
      <div className="artist-rank-info">
        <div className="artist-rank-name">{artist.username}</div>
        <CreatorBadge level={artist.creatorLevel} size="sm" />
      </div>
      <div className="artist-rank-stats">
        <div className="artist-rank-stat"><Heart size={12} /><span>{artist.stats?.totalLikes || 0}</span></div>
        <div className="artist-rank-stat"><Users size={12} /><span>{artist.stats?.followers || 0}</span></div>
        <div className="artist-rank-stat"><Music size={12} /><span>{artist.stats?.uploads || 0}</span></div>
      </div>
      <div className="artist-rank-score"><Flame size={13} /><span>{artist.engagementScore || 0}</span></div>
    </div>
  );
}

export default function Rankings() {
  const { playQueue } = usePlayer();
  const navigate = useNavigate();
  const [topTracks,    setTopTracks]    = useState([]);
  const [newestTracks, setNewestTracks] = useState([]);
  const [risingTracks, setRisingTracks] = useState([]);
  const [artistRanks,  setArtistRanks]  = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [activeTab,    setActiveTab]    = useState('tracks');
  const [filterChip,   setFilterChip]   = useState('rising');

  useEffect(() => {
    setLoading(true);
    Promise.all([
      getTopTracks(50),
      getNewestTracks(50),
      getRisingTracks(20),
      getArtistRankings(50),
    ]).then(([top, newest, rising, artists]) => {
      setTopTracks(top);
      setNewestTracks(newest);
      setRisingTracks(rising);
      setArtistRanks(artists);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const weekTracks = useMemo(() => {
    const cutoff = Date.now() / 1000 - 7 * 86400;
    return [...newestTracks]
      .filter((t) => (t.createdAt?.seconds ?? 0) >= cutoff)
      .sort((a, b) => (b.likes || 0) - (a.likes || 0));
  }, [newestTracks]);

  // Which track list to show
  const tracks =
    filterChip === 'rising' ? risingTracks
    : filterChip === 'week' ? weekTracks
    : topTracks;

  // Which track is "new" (uploaded < 48h ago)
  const cutoff48h = Date.now() / 1000 - 2 * 86400;
  const isNew = (t) => (t.createdAt?.seconds ?? 0) >= cutoff48h;

  return (
    <div className="page rankings-page animate-fade-in">
      {/* ── Hero Header ──────────────────────────────────────── */}
      <div className="rankings-header">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 12, position: 'relative' }}>
          <div style={{
            width: 52, height: 52, borderRadius: '50%',
            background: 'rgba(168,85,247,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '1px solid rgba(168,85,247,0.3)',
          }}>
            <Trophy size={24} color="var(--accent)" />
          </div>
        </div>
        <h1>Live Rankings</h1>
        <p>Real-time rankings powered by community engagement</p>

        <div className="rankings-header-stats">
          <div className="rankings-stat">
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <Music size={16} color="var(--accent)" />
              <span className="rankings-stat-value">{topTracks.length || '2.4K'}</span>
            </div>
            <span className="rankings-stat-label">Tracks Ranked</span>
          </div>
          <div className="rankings-stat">
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <Users size={16} color="var(--accent)" />
              <span className="rankings-stat-value">{artistRanks.length || '1.6K'}</span>
            </div>
            <span className="rankings-stat-label">Artists Ranked</span>
          </div>
          <div className="rankings-stat">
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <TrendingUp size={16} color="var(--accent)" />
              <span className="rankings-stat-value">{weekTracks.length || '7.8K'}</span>
            </div>
            <span className="rankings-stat-label">This Week</span>
          </div>
        </div>
      </div>

      {/* ── Tab row ──────────────────────────────────────────── */}
      <div className="rankings-tabs">
        {TRACK_TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            id={`rankings-tab-${id}`}
            className={`rankings-tab${activeTab === id ? ' active' : ''}`}
            onClick={() => setActiveTab(id)}
          >
            <Icon size={14} /> {label}
          </button>
        ))}

        {/* Filter chips — only for track tabs */}
        {activeTab !== 'artists' && (
          <>
            <div style={{ width: 1, height: 24, background: 'var(--border)', margin: '0 4px' }} />
            {FILTER_CHIPS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                id={`rankings-filter-${id}`}
                className={`rankings-tab${filterChip === id ? ' active' : ''}`}
                onClick={() => setFilterChip(id)}
              >
                <Icon size={13} /> {label}
              </button>
            ))}
          </>
        )}

        {/* Play All */}
        {activeTab !== 'artists' && tracks.length > 0 && !loading && (
          <button
            className="play-all-btn"
            onClick={() => playQueue(tracks, 0)}
            style={{ marginLeft: 'auto' }}
            id="rankings-play-all-btn"
          >
            <PlayCircle size={15} /> Play All
          </button>
        )}
      </div>

      {/* ── Column Legend ─────────────────────────────────────── */}
      {activeTab === 'tracks' && (
        <div className="rankings-legend">
          <span>RANK · TRACK</span>
          <span className="rankings-legend-right">LIKES</span>
        </div>
      )}
      {activeTab === 'artists' && (
        <div className="rankings-legend">
          <span>RANK</span>
          <span>ARTIST</span>
          <span className="rankings-legend-right">LIKES · FOLLOWERS · TRACKS · SCORE</span>
        </div>
      )}

      {/* ── Content ───────────────────────────────────────────── */}
      {activeTab === 'artists' ? (
        <div className="artist-rankings-section">
          {loading ? (
            <div className="rankings-list">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="artist-rank-row skeleton-card" style={{ opacity: 1 - i * 0.06 }} />
              ))}
            </div>
          ) : artistRanks.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">🎤</div>
              <p>No artists ranked yet. Start uploading to get ranked!</p>
            </div>
          ) : (
            <div className="rankings-list animate-fade-in">
              {artistRanks.map((artist, i) => (
                <ArtistRankRow key={artist.uid} artist={artist} rank={i + 1} />
              ))}
            </div>
          )}
        </div>
      ) : (
        <>
          {loading ? (
            <div className="rankings-list">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} style={{ height: 72, background: 'var(--bg-card)', borderRadius: 'var(--radius-md)', opacity: 1 - i * 0.08 }} />
              ))}
            </div>
          ) : tracks.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">
                {filterChip === 'week' ? '📅' : filterChip === 'rising' ? '📈' : '🎵'}
              </div>
              <p>
                {filterChip === 'week'
                  ? 'No tracks uploaded this week yet.'
                  : filterChip === 'rising'
                  ? 'No rising tracks yet.'
                  : 'No tracks yet. Upload the first snippet!'}
              </p>
            </div>
          ) : (
            <div className="rankings-list animate-fade-in">
              {tracks.map((track, i) => (
                <TrackRankRow
                  key={track.id}
                  track={track}
                  rank={i + 1}
                  isNew={isNew(track)}
                  onClick={() => navigate(`/track/${track.id}`)}
                />
              ))}
            </div>
          )}

          {tracks.length > 0 && !loading && (
            <div style={{ textAlign: 'center', marginTop: 24 }}>
              <button
                className="btn btn-ghost btn-sm"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                onClick={() => navigate('/discover')}
              >
                View All Track Rankings →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
