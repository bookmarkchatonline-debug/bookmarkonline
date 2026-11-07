import { useEffect, useState } from 'react';
import { collection, orderBy, limit as fbLimit, onSnapshot, query as fbQuery } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../context/AuthContext';
import { MessageCircle } from 'lucide-react';
import FeedPost from '../components/feed/FeedPost';
import '../styles/feed.css';

export default function Feed() {
  useAuth();
  const [feed, setFeed] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Real-time listener
  useEffect(() => {
    const q = fbQuery(
      collection(db, 'liveFeed'),
      orderBy('createdAt', 'desc'),
      fbLimit(50)
    );
    const unsub = onSnapshot(
      q, 
      (snap) => {
        const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setFeed(items);
        setLoading(false);
      },
      (err) => {
        console.error('Feed error:', err);
        setError('Couldn\'t load your feed.');
        setLoading(false);
      }
    );
    return () => unsub();
  }, []);

  const filteredFeed = filter === 'all'
    ? feed
    : feed.filter((item) => {
      if (filter === 'uploads') return item.type === 'upload';
      if (filter === 'likes') return item.type === 'like';
      if (filter === 'follows') return item.type === 'follow';
      if (filter === 'awards') return item.type === 'award' || item.type === 'levelup';
      return true;
    });

  const FILTERS = [
    { id: 'all', label: 'All Activity' },
    { id: 'uploads', label: 'Uploads' },
    { id: 'likes', label: 'Likes' },
    { id: 'follows', label: 'Follows' },
    { id: 'awards', label: 'Awards' },
  ];

  return (
    <div className="feed-container animate-fade-in">
      <header className="feed-page-header">
        <h1 className="feed-page-title">
          <MessageCircle size={28} color="var(--accent)" />
          Community
        </h1>
        <p className="feed-page-sub">See what artists and listeners are creating right now.</p>
      </header>

      {/* Filters (Sticky) */}
      <div className="feed-filters-wrap">
        <div className="feed-filters-scroll">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              className={`feed-filter-pill ${filter === f.id ? 'active' : ''}`}
              onClick={() => setFilter(f.id)}
              aria-pressed={filter === f.id}
            >
              {f.label}
              {f.id !== 'all' && (
                <span className="feed-filter-count">
                  {feed.filter((item) => {
                    if (f.id === 'uploads') return item.type === 'upload';
                    if (f.id === 'likes') return item.type === 'like';
                    if (f.id === 'follows') return item.type === 'follow';
                    if (f.id === 'awards') return item.type === 'award' || item.type === 'levelup';
                    return false;
                  }).length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Feed List */}
      <main className="feed-list-page" role="feed" aria-busy={loading}>
        {error ? (
          <div className="feed-empty" style={{ borderColor: 'var(--error)' }}>
            <div className="feed-empty-icon" style={{ color: 'var(--error)' }}>⚠️</div>
            <h2 className="feed-empty-title">Oops!</h2>
            <p className="feed-empty-sub">{error}</p>
            <button className="btn btn-outline" onClick={() => window.location.reload()}>Retry</button>
          </div>
        ) : loading ? (
          <div className="feed-skeleton-wrap" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {[1, 2, 3].map(i => (
              <div key={i} className="feed-skeleton">
                <div className="feed-skeleton-header">
                  <div className="feed-skeleton-avatar" />
                  <div>
                    <div className="feed-skeleton-text-1" />
                    <div className="feed-skeleton-text-2" />
                  </div>
                </div>
                <div className="feed-skeleton-box" />
              </div>
            ))}
          </div>
        ) : filteredFeed.length === 0 ? (
          <div className="feed-empty">
            <div className="feed-empty-icon">📡</div>
            <h2 className="feed-empty-title">Your community is quiet.</h2>
            <p className="feed-empty-sub">New music activity will appear here.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {filteredFeed.map((item) => (
              <FeedPost key={item.id} item={item} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
