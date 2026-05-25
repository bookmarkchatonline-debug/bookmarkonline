// src/pages/Rankings.jsx
import { useEffect, useState, useMemo } from 'react';
import { getTopTracks, getNewestTracks } from '../firebase/firestore';
import TrackCard from '../components/track/TrackCard';
import { usePlayer } from '../context/PlayerContext';
import { BarChart2, Zap, Clock, PlayCircle } from 'lucide-react';
import '../styles/pages.css';

const TABS = [
  { id: 'top',     label: 'Top Liked',  icon: BarChart2 },
  { id: 'newest',  label: 'Newest',     icon: Zap       },
  { id: 'week',    label: 'This Week',  icon: Clock     },
];

export default function Rankings() {
  const { playQueue } = usePlayer();
  const [topTracks,    setTopTracks]    = useState([]);
  const [newestTracks, setNewestTracks] = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [activeTab,    setActiveTab]    = useState('top');

  useEffect(() => {
    setLoading(true);
    Promise.all([
      getTopTracks(50),
      getNewestTracks(50),
    ]).then(([top, newest]) => {
      setTopTracks(top);
      setNewestTracks(newest);
      setLoading(false);
    });
  }, []);

  // "This Week" = tracks uploaded in the last 7 days, sorted by likes
  const weekTracks = useMemo(() => {
    const cutoff = Date.now() / 1000 - 7 * 86400;
    return [...newestTracks]
      .filter((t) => (t.createdAt?.seconds ?? 0) >= cutoff)
      .sort((a, b) => (b.likes || 0) - (a.likes || 0));
  }, [newestTracks]);

  const tracks = activeTab === 'top'
    ? topTracks
    : activeTab === 'newest'
    ? newestTracks
    : weekTracks;

  const showRank = activeTab !== 'newest';

  return (
    <div className="page">
      {/* Header */}
      <div className="rankings-header animate-fade-in">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 10 }}>
          <BarChart2 size={28} color="var(--accent)" />
        </div>
        <h1>🏆 Live Rankings</h1>
        <p>Tracks ranked by total likes from the community</p>
      </div>

      {/* Filter tabs */}
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
            {id === 'week' && weekTracks.length > 0 && !loading && (
              <span className="rankings-tab-count">{weekTracks.length}</span>
            )}
          </button>
        ))}

        {/* Play All */}
        {tracks.length > 0 && !loading && (
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

      {/* Legend row */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '8px 16px', marginBottom: 12,
        fontSize: '0.75rem', fontWeight: 600,
        color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase',
      }}>
        <span>{showRank ? 'RANK · TRACK' : 'TRACK'}</span>
        <span>LIKES</span>
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
            {activeTab === 'week' ? '📅' : '🎵'}
          </div>
          <p>
            {activeTab === 'week'
              ? 'No tracks uploaded this week yet.'
              : 'No tracks yet. Upload the first snippet!'}
          </p>
        </div>
      ) : (
        <div className="rankings-list animate-fade-in">
          {tracks.map((track, i) => (
            <TrackCard key={track.id} track={track} rank={i + 1} showRank={showRank} />
          ))}
        </div>
      )}
    </div>
  );
}
