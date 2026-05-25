// src/pages/Discover.jsx
import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search } from 'lucide-react';
import { searchTracks, getTopTracks } from '../firebase/firestore';
import TrackCard from '../components/track/TrackCard';
import '../styles/pages.css';
import '../styles/components.css';

const POPULAR_TAGS = ['hiphop', 'trap', 'rnb', 'lofi', 'electronic', 'pop', 'underground', 'synthwave', 'jazz', 'drill'];

export default function Discover() {
  const [params, setParams] = useSearchParams();
  const [query, setQuery] = useState(params.get('q') || '');
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTag, setActiveTag] = useState('');

  const runSearch = useCallback(async (term) => {
    setLoading(true);
    try {
      const results = term.trim()
        ? await searchTracks(term.trim())
        : await getTopTracks(50);
      setTracks(results);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    const q = params.get('q') || '';
    setQuery(q);
    runSearch(q);
  }, [params.get('q')]);

  const handleSearch = (e) => {
    e.preventDefault();
    setParams(query ? { q: query } : {});
    setActiveTag('');
    runSearch(query);
  };

  const handleTag = (tag) => {
    const newTag = activeTag === tag ? '' : tag;
    setActiveTag(newTag);
    setQuery(newTag);
    setParams(newTag ? { q: newTag } : {});
    runSearch(newTag);
  };

  return (
    <div className="discover-page">
      {/* Search Hero */}
      <div className="search-hero animate-fade-in">
        <h1>Discover Music</h1>
        <form onSubmit={handleSearch} className="search-input-wrap">
          <Search className="search-input-icon" size={20} />
          <input
            id="discover-search-input"
            type="search"
            className="search-main-input"
            placeholder="Search tracks, artists, tags..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search"
          />
        </form>

        {/* Tag chips */}
        <div className="tag-filters">
          {POPULAR_TAGS.map((tag) => (
            <button
              key={tag}
              className={`tag${activeTag === tag ? ' active' : ''}`}
              onClick={() => handleTag(tag)}
              id={`tag-filter-${tag}`}
            >
              #{tag}
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      <div style={{ marginBottom: 12 }}>
        <span className="section-title">
          {query ? `Results for "${query}"` : 'All Tracks'}
        </span>
        {!loading && (
          <span style={{ marginLeft: 10, fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            {tracks.length} track{tracks.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {loading ? (
        <div className="tracks-grid">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} style={{ height: 72, background: 'var(--bg-card)', borderRadius: 'var(--radius-md)', opacity: 1 - i * 0.08 }} />
          ))}
        </div>
      ) : tracks.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🔍</div>
          <p>No tracks found for "{query}"</p>
          <button className="btn btn-ghost btn-sm" onClick={() => { setQuery(''); setParams({}); runSearch(''); }}>
            Clear search
          </button>
        </div>
      ) : (
        <div className="tracks-grid animate-fade-in">
          {tracks.map((track) => (
            <TrackCard key={track.id} track={track} />
          ))}
        </div>
      )}
    </div>
  );
}
