import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Library as LibraryIcon, History, Heart, ListMusic, PlayCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getUserPlaylists, getLikedTracks } from '../firebase/firestore';
import TrackCard from '../components/track/TrackCard';
import { usePlayer } from '../context/PlayerContext';
import '../styles/library.css';

export default function Library() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { playQueue } = usePlayer();

  const [history, setHistory] = useState([]);
  const [playlists, setPlaylists] = useState([]);
  const [likedTracks, setLikedTracks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    let active = true;

    // Load History from localStorage
    try {
      const stored = JSON.parse(localStorage.getItem('bookmarkchat_listen_history') || '[]');
      if (active) setHistory(stored.slice(0, 10)); // Just top 10 recently played
    } catch (err) {
      console.error('Failed to load history', err);
    }

    // Load Playlists and Liked Tracks
    Promise.all([
      getUserPlaylists(user.uid),
      getLikedTracks(user.uid)
    ])
      .then(([pl, liked]) => {
        if (active) {
          setPlaylists(pl);
          setLikedTracks(liked);
          setLoading(false);
        }
      })
      .catch(err => {
        console.error('Error loading library:', err);
        if (active) setLoading(false);
      });

    return () => { active = false; };
  }, [user, navigate]);

  if (!user) return null;

  return (
    <div className="library-wrapper animate-fade-in">
      
      <div className="library-header">
        <h1 className="library-title">
          <LibraryIcon size={32} color="var(--accent)" />
          Your Library
        </h1>
        <p className="library-desc">Your personal music collection, saved tracks, and playlists.</p>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', marginTop: '32px' }}>
          {[1, 2, 3].map(i => (
            <div key={i} className="skeleton-card" style={{ height: '200px' }} />
          ))}
        </div>
      ) : (
        <>
          {/* ── Playlists ──────────────────────────────────────────────────────── */}
          <section className="library-section">
            <div className="library-section-header">
              <h2 className="library-section-title">
                <ListMusic size={24} color="var(--text-primary)" />
                Playlists
              </h2>
            </div>
            
            {playlists.length === 0 ? (
              <div className="library-empty-state">
                <div className="library-empty-icon"><ListMusic size={28} /></div>
                <p>You haven't created any playlists yet.</p>
              </div>
            ) : (
              <div className="playlists-grid">
                {playlists.map(pl => (
                  <div key={pl.id} className="playlist-card" onClick={() => navigate(`/playlist/${pl.id}`)}>
                    <div className="playlist-card-cover">
                      <ListMusic size={48} opacity={0.5} />
                    </div>
                    <div className="playlist-card-info">
                      <div className="playlist-card-title">{pl.name}</div>
                      <div className="playlist-card-count">{pl.tracks?.length || 0} tracks</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* ── Liked Tracks ───────────────────────────────────────────────────── */}
          <section className="library-section">
            <div className="library-section-header">
              <h2 className="library-section-title">
                <Heart size={24} color="var(--accent)" fill="var(--accent)" />
                Liked Tracks
              </h2>
              {likedTracks.length > 0 && (
                <button 
                  className="btn btn-outline btn-sm"
                  onClick={() => playQueue(likedTracks, 0)}
                >
                  <PlayCircle size={16} /> Play All
                </button>
              )}
            </div>

            {likedTracks.length === 0 ? (
              <div className="library-empty-state">
                <div className="library-empty-icon"><Heart size={28} /></div>
                <p>You haven't liked any tracks yet.</p>
              </div>
            ) : (
              <div className="tracks-grid">
                {likedTracks.slice(0, 8).map(track => (
                  <TrackCard key={track.id} track={track} />
                ))}
              </div>
            )}
            
            {likedTracks.length > 8 && (
              <div style={{ marginTop: '16px', textAlign: 'center' }}>
                <button className="btn btn-ghost" onClick={() => navigate(`/profile/${user.uid}?tab=liked`)}>
                  View All Liked Tracks
                </button>
              </div>
            )}
          </section>

          {/* ── Recently Played (History) ──────────────────────────────────────── */}
          <section className="library-section">
            <div className="library-section-header">
              <h2 className="library-section-title">
                <History size={24} color="var(--text-primary)" />
                Recently Played
              </h2>
              {history.length > 0 && (
                <button 
                  className="btn btn-outline btn-sm"
                  onClick={() => navigate('/history')}
                >
                  View Full History
                </button>
              )}
            </div>

            {history.length === 0 ? (
              <div className="library-empty-state">
                <div className="library-empty-icon"><History size={28} /></div>
                <p>Your listening history is empty.</p>
              </div>
            ) : (
              <div className="tracks-grid">
                {history.map((track, i) => (
                  <TrackCard key={`${track.id}-${i}`} track={track} />
                ))}
              </div>
            )}
          </section>
        </>
      )}

    </div>
  );
}
