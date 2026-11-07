import { useState, useEffect } from 'react';
import { Music, PlayCircle, Trash2, Search, AlertCircle } from 'lucide-react';
import { getAllAdminTracks, deleteTrackAdmin } from '../../firebase/firestore';
import { usePlayer } from '../../context/PlayerContext';
import toast from 'react-hot-toast';
import '../../styles/admin.css';

export default function AdminTracks() {
  const { playQueue } = usePlayer();
  const [tracks, setTracks] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchTracks = async () => {
    setLoading(true);
    try {
      const data = await getAllAdminTracks(100);
      setTracks(data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load tracks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTracks();
  }, []);

  const handleDelete = async (trackId, uid) => {
    if (!window.confirm('Are you sure you want to permanently delete this track? This action cannot be undone.')) {
      return;
    }

    try {
      await deleteTrackAdmin(trackId, uid);
      setTracks(prev => prev.filter(t => t.id !== trackId));
      toast.success('Track deleted successfully');
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete track');
    }
  };

  const handlePlay = (track) => {
    playQueue([track], 0);
  };

  const filteredTracks = tracks.filter(t => 
    t.title?.toLowerCase().includes(search.toLowerCase()) || 
    t.username?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="admin-workspace animate-fade-in">
      <div className="admin-header">
        <div className="admin-title-group">
          <div className="admin-title-icon" style={{ background: 'var(--accent-soft)' }}>
            <Music size={28} color="var(--accent)" />
          </div>
          <div>
            <h1 className="admin-title">Content Moderation: Tracks</h1>
            <p className="admin-subtitle">Monitor and delete tracks if necessary.</p>
          </div>
        </div>
        
        <div className="input-wrapper" style={{ width: '300px' }}>
          <Search size={18} className="input-icon" />
          <input
            type="search"
            placeholder="Search tracks by title or artist..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input input-with-icon"
          />
        </div>
      </div>

      <div className="admin-panel">
        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Track Info</th>
                <th>Artist</th>
                <th>Stats</th>
                <th>Upload Date</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    Loading tracks...
                  </td>
                </tr>
              ) : filteredTracks.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No tracks found.
                  </td>
                </tr>
              ) : (
                filteredTracks.map(track => (
                  <tr key={track.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        {track.coverUrl ? (
                          <img src={track.coverUrl} alt={track.title} style={{ width: 40, height: 40, borderRadius: 8, objectFit: 'cover' }} />
                        ) : (
                          <div style={{ width: 40, height: 40, borderRadius: 8, background: 'var(--accent-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Music size={16} color="var(--accent)" />
                          </div>
                        )}
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{track.title || 'Untitled'}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                            {!track.isPublic && <><AlertCircle size={10} color="#ef4444"/> Private</>}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      {track.username || 'Unknown'}
                    </td>
                    <td style={{ color: 'var(--text-secondary)' }}>
                      {track.likes || 0} Likes
                    </td>
                    <td style={{ color: 'var(--text-secondary)' }}>
                      {track.createdAt?.seconds ? new Date(track.createdAt.seconds * 1000).toLocaleDateString() : 'N/A'}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div className="admin-action-row">
                        <button 
                          className="btn-icon"
                          onClick={() => handlePlay(track)}
                          title="Play Track"
                          style={{ color: 'var(--accent)' }}
                        >
                          <PlayCircle size={18} />
                        </button>
                        <button 
                          className="btn-icon admin-danger-text"
                          onClick={() => handleDelete(track.id, track.uid)}
                          title="Delete Track"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
