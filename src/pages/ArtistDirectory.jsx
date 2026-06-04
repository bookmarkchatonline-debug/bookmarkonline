// src/pages/ArtistDirectory.jsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllArtists } from '../firebase/firestore';
import CreatorBadge from '../components/common/CreatorBadge';
import FollowButton from '../components/common/FollowButton';
import { Users, TrendingUp, Star, Crown, Search, Music, Heart } from 'lucide-react';
import '../styles/pages.css';

const TIER_FILTERS = [
  { id: 'all', label: 'All Artists' },
  { id: 'Rising Artist', label: 'Rising' },
  { id: 'Trending', label: 'Trending' },
  { id: 'Gold Creator', label: 'Gold' },
  { id: 'Platinum', label: 'Platinum' },
  { id: 'Gold Tape Winner', label: 'Gold Tape' },
];

const SORT_OPTIONS = [
  { id: 'engagement', label: 'Most Popular' },
  { id: 'followers', label: 'Most Followers' },
  { id: 'newest', label: 'Newest' },
  { id: 'uploads', label: 'Most Active' },
];

export default function ArtistDirectory() {
  const navigate = useNavigate();
  const [artists, setArtists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('engagement');
  const [search, setSearch] = useState('');

  useEffect(() => {
    getAllArtists(100)
      .then((data) => {
        setArtists(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load artists:', err);
        setLoading(false);
      });
  }, []);

  const filtered = artists
    .filter((a) => {
      if (filter !== 'all' && a.creatorLevel !== filter) return false;
      if (search && !a.username?.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'followers') return (b.stats?.followers || 0) - (a.stats?.followers || 0);
      if (sortBy === 'newest') return (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0);
      if (sortBy === 'uploads') return (b.stats?.uploads || 0) - (a.stats?.uploads || 0);
      return (b.engagementScore || 0) - (a.engagementScore || 0);
    });

  return (
    <div className="page artist-directory animate-fade-in">
      <div className="artist-dir-hero">
        <Users size={28} color="var(--accent)" />
        <h1>Artist Directory</h1>
        <p>Discover rising talent and the creators shaping the culture</p>
      </div>

      {/* Search */}
      <div className="artist-dir-search">
        <Search size={18} className="artist-dir-search-icon" />
        <input
          type="search"
          placeholder="Search artists..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input"
          id="artist-search-input"
        />
      </div>

      {/* Tier Filters */}
      <div className="artist-dir-filters">
        {TIER_FILTERS.map((f) => (
          <button
            key={f.id}
            className={`feed-filter-btn${filter === f.id ? ' active' : ''}`}
            onClick={() => setFilter(f.id)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Sort */}
      <div className="artist-dir-sort">
        <span className="artist-dir-sort-label">Sort by:</span>
        {SORT_OPTIONS.map((opt) => (
          <button
            key={opt.id}
            className={`artist-sort-btn${sortBy === opt.id ? ' active' : ''}`}
            onClick={() => setSortBy(opt.id)}
          >
            {opt.label}
          </button>
        ))}
        <span className="artist-dir-count">
          {filtered.length} artist{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Artist Grid */}
      {loading ? (
        <div className="artist-grid">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="artist-card skeleton-card" style={{ opacity: 1 - i * 0.1 }} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🎤</div>
          <p>{search ? `No artists found for "${search}"` : 'No artists in this tier yet'}</p>
        </div>
      ) : (
        <div className="artist-grid">
          {filtered.map((artist) => (
            <div key={artist.uid} className="artist-card" onClick={() => navigate(`/profile/${artist.uid}`)}>
              <div className="artist-card-header">
                <div className="artist-card-avatar">
                  {artist.avatarUrl ? (
                    <img src={artist.avatarUrl} alt={artist.username} />
                  ) : (
                    <div className="artist-card-avatar-fallback">
                      {(artist.username || 'A').slice(0, 2).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="artist-card-level">
                  <CreatorBadge level={artist.creatorLevel} size="sm" />
                </div>
              </div>
              <div className="artist-card-name">{artist.username || 'Anonymous'}</div>
              <div className="artist-card-handle">@{(artist.username || 'user').toLowerCase().replace(/\s+/g, '_')}</div>
              <div className="artist-card-stats">
                <div className="artist-card-stat">
                  <Heart size={12} />
                  <span>{artist.stats?.totalLikes || 0}</span>
                </div>
                <div className="artist-card-stat">
                  <Users size={12} />
                  <span>{artist.stats?.followers || 0}</span>
                </div>
                <div className="artist-card-stat">
                  <Music size={12} />
                  <span>{artist.stats?.uploads || 0}</span>
                </div>
              </div>
              <div className="artist-card-actions" onClick={(e) => e.stopPropagation()}>
                <FollowButton targetUid={artist.uid} size="sm" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
