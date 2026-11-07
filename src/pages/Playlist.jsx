import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Play, ListMusic, User, Lock, Globe } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { usePlayer } from '../context/PlayerContext';
import { getPlaylist, getPlaylistTracks } from '../firebase/firestore';
import TrackCard from '../components/track/TrackCard';
import '../styles/library.css';

export default function Playlist() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { playQueue } = usePlayer();

  const [playlist, setPlaylist] = useState(null);
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    
    Promise.all([
      getPlaylist(id),
      getPlaylistTracks(id)
    ])
      .then(([pl, trks]) => {
        if (active) {
          setPlaylist(pl);
          setTracks(trks);
          setLoading(false);
        }
      })
      .catch(err => {
        console.error('Failed to load playlist:', err);
        if (active) setLoading(false);
      });

    return () => { active = false; };
  }, [id]);

  const handlePlayAll = () => {
    if (tracks.length > 0) {
      playQueue(tracks, 0);
    }
  };



  if (loading) {
    return (
      <div className="playlist-page-wrapper animate-fade-in">
        <div className="playlist-hero">
          <div className="skeleton-card" style={{ width: '240px', height: '240px' }} />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="skeleton-card" style={{ height: '24px', width: '100px' }} />
            <div className="skeleton-card" style={{ height: '64px', width: '80%' }} />
            <div className="skeleton-card" style={{ height: '24px', width: '200px' }} />
          </div>
        </div>
      </div>
    );
  }

  if (!playlist) {
    return (
      <div className="playlist-page-wrapper animate-fade-in">
        <div className="library-empty-state" style={{ margin: '64px 24px' }}>
          <div className="library-empty-icon"><ListMusic size={32} /></div>
          <h2>Playlist not found</h2>
          <p>This playlist may have been deleted or is private.</p>
          <button className="btn btn-outline" onClick={() => navigate('/library')}>
            Back to Library
          </button>
        </div>
      </div>
    );
  }



  return (
    <div className="playlist-page-wrapper animate-fade-in">
      
      {/* ── Hero ───────────────────────────────────────────────────────────── */}
      <div className="playlist-hero">
        <div className="playlist-hero-cover">
          <ListMusic size={64} opacity={0.5} />
        </div>
        
        <div className="playlist-hero-info">
          <div className="playlist-hero-type">Playlist</div>
          <h1 className="playlist-hero-title">{playlist.name}</h1>
          <div className="playlist-hero-meta">
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <User size={16} /> Created by User
            </span>
            <span>•</span>
            <span>{tracks.length} track{tracks.length !== 1 ? 's' : ''}</span>
            <span>•</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              {playlist.isPublic ? <Globe size={16} /> : <Lock size={16} />}
              {playlist.isPublic ? 'Public' : 'Private'}
            </span>
          </div>
        </div>
      </div>

      {/* ── Actions ────────────────────────────────────────────────────────── */}
      <div className="playlist-actions-row">
        <button 
          className="playlist-play-btn"
          onClick={handlePlayAll}
          disabled={tracks.length === 0}
          aria-label="Play Playlist"
        >
          <Play size={24} fill="currentColor" />
        </button>
        
        {/* Additional actions like Edit, Share could go here */}
      </div>

      {/* ── Tracks ─────────────────────────────────────────────────────────── */}
      <div className="playlist-tracks-container">
        {tracks.length === 0 ? (
          <div className="library-empty-state">
            <div className="library-empty-icon"><ListMusic size={32} /></div>
            <p>This playlist is empty.</p>
          </div>
        ) : (
          <div className="tracks-grid">
            {tracks.map(track => (
              <div key={track.id} style={{ position: 'relative' }}>
                <TrackCard track={track} />
                

              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
