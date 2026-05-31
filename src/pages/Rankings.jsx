// src/pages/Rankings.jsx
import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getTopTracks, getNewestTracks, getArtistRankings, getRisingTracks } from '../firebase/firestore';
import TrackCard from '../components/track/TrackCard';
import CreatorBadge from '../components/common/CreatorBadge';
import MomentumArrow from '../components/common/MomentumArrow';
import FollowButton from '../components/common/FollowButton';
import { usePlayer } from '../context/PlayerContext';
import {
  BarChart2, Zap, Clock, PlayCircle, Users, TrendingUp, Crown,
  Flame, Music, Heart, Trophy,
} from 'lucide-react';
import '../styles/pages.css';

const TABS = [
  { id: 'tracks',  label: 'Track Rankings',  icon: Music },
  { id: 'artists', label: 'Artist Rankings', icon: Users },
  { id: 'rising',  label: 'Rising Fast',     icon: TrendingUp },
  { id: 'week',    label: 'This Week',       icon: Clock },
];

function PodiumCard({ track, rank, onClick }) {
  const medals = ['🥇', '🥈', '🥉'];
  const heights = [160, 130, 110];

  return (
    <div
      className={`podium-card podium-${rank}`}
      onClick={onClick}
      role="button"
      tabIndex={0}
    >
      <div className="podium-cover">
        {track.coverUrl ? (
          <img src={track.coverUrl} alt={track.title} />
        ) : (
          <div className="podium-cover-placeholder">
            <Music size={24} color="rgba(255,255,255,0.3)" />
          </div>
        )}
        <div className="podium-medal">{medals[rank - 1]}</div>
      </div>
      <div className="podium-info">
        <div className="podium-title">{track.title}</div>
        <div className="podium-artist">{track.username}</div>
        <div className="podium-likes">
          <Heart size={12} />
          {track.likes || 0}
        </div>
      </div>
      <div className="podium-bar" style={{ height: heights[rank - 1] }}>
        <span className="podium-rank">#{rank}</span>
      </div>
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
        <div className="artist-rank-stat">
          <Heart size={12} />
          <span>{artist.stats?.totalLikes || 0}</span>
        </div>
        <div className="artist-rank-stat">
          <Users size={12} />
          <span>{artist.stats?.followers || 0}</span>
        </div>
        <div className="artist-rank-stat">
          <Music size={12} />
          <span>{artist.stats?.uploads || 0}</span>
        </div>
      </div>
      <div className="artist-rank-score">
        <Flame size={13} />
        <span>{artist.engagementScore || 0}</span>
      </div>
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
    });
  }, []);

  const weekTracks = useMemo(() => {
    const cutoff = Date.now() / 1000 - 7 * 86400;
    return [...newestTracks]
      .filter((t) => (t.createdAt?.seconds ?? 0) >= cutoff)
      .sort((a, b) => (b.likes || 0) - (a.likes || 0));
  }, [newestTracks]);

  const tracks = activeTab === 'tracks'
    ? topTracks
    : activeTab === 'rising'
    ? risingTracks
    : weekTracks;

  const showPodium = activeTab === 'tracks' && topTracks.length >= 3;

  return (
    <div className="page rankings-page animate-fade-in">
      {/* Header */}
      <div className="rankings-header">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 10 }}>
          <Trophy size={28} color="var(--accent)" />
        </div>
        <h1>Live Rankings</h1>
        <p>Real-time rankings powered by community engagement</p>
        <div className="rankings-header-stats">
          <div className="rankings-stat">
            <span className="rankings-stat-value">{topTracks.length}</span>
            <span className="rankings-stat-label">Tracks</span>
          </div>
          <div className="rankings-stat">
            <span className="rankings-stat-value">{artistRanks.length}</span>
            <span className="rankings-stat-label">Artists</span>
          </div>
          <div className="rankings-stat">
            <span className="rankings-stat-value">{weekTracks.length}</span>
            <span className="rankings-stat-label">This Week</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="rankings-tabs">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            className={`rankings-tab${activeTab === id ? ' active' : ''}`}
            onClick={() => setActiveTab(id)}
            id={`rankings-tab-${id}`}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}

        {activeTab !== 'artists' && tracks.length > 0 && !loading && (
          <button
            className="play-all-btn"
            onClick={() => playQueue(tracks, 0)}
            style={{ marginLeft: 'auto' }}
            aria-label="Play all"
            id="rankings-play-all-btn"
          >
            <PlayCircle size={15} />
            Play All
          </button>
        )}
      </div>

      {/* Content */}
      {activeTab === 'artists' ? (
        /* ─── Artist Rankings ─────────────────────────────── */
        <div className="artist-rankings-section">
          <div className="rankings-legend">
            <span>RANK</span>
            <span>ARTIST</span>
            <span className="rankings-legend-right">LIKES · FOLLOWERS · TRACKS · SCORE</span>
          </div>
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
        /* ─── Track Rankings ─────────────────────────────── */
        <>
          {/* Podium for top 3 */}
          {showPodium && !loading && (
            <div className="podium-section">
              <PodiumCard track={topTracks[1]} rank={2} onClick={() => navigate(`/track/${topTracks[1].id}`)} />
              <PodiumCard track={topTracks[0]} rank={1} onClick={() => navigate(`/track/${topTracks[0].id}`)} />
              <PodiumCard track={topTracks[2]} rank={3} onClick={() => navigate(`/track/${topTracks[2].id}`)} />
            </div>
          )}

          {/* Legend */}
          <div className="rankings-legend">
            <span>RANK · TRACK</span>
            <span className="rankings-legend-right">LIKES</span>
          </div>

          {loading ? (
            <div className="rankings-list">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} style={{ height: 72, background: 'var(--bg-card)', borderRadius: 'var(--radius-md)', opacity: 1 - i * 0.06 }} />
              ))}
            </div>
          ) : tracks.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">
                {activeTab === 'week' ? '📅' : activeTab === 'rising' ? '📈' : '🎵'}
              </div>
              <p>
                {activeTab === 'week'
                  ? 'No tracks uploaded this week yet.'
                  : activeTab === 'rising'
                  ? 'No rising tracks this week.'
                  : 'No tracks yet. Upload the first snippet!'}
              </p>
            </div>
          ) : (
            <div className="rankings-list animate-fade-in">
              {(showPodium ? tracks.slice(3) : tracks).map((track, i) => (
                <TrackCard
                  key={track.id}
                  track={track}
                  rank={showPodium ? i + 4 : i + 1}
                  showRank={true}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
