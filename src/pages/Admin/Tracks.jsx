import { useState, useEffect } from 'react';
import { Music, PlayCircle, Trash2, Search, AlertCircle } from 'lucide-react';
import { getAllAdminTracks, deleteTrackAdmin } from '../../firebase/firestore';
import { usePlayer } from '../../context/PlayerContext';
import toast from 'react-hot-toast';

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
    <div className="page animate-fade-in" style={{ maxWidth: 1000, margin: '0 auto' }}>
      <div className="section-header" style={{ marginBottom: 30, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Music size={28} color="var(--accent)" />
          <h1 style={{ margin: 0 }}>Content Moderation: Tracks</h1>
        </div>
      </div>

      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
        <div style={{ padding: '20px', borderBottom: '1px solid var(--border)', display: 'flex', gap: '16px', alignItems: 'center' }}>
          <div className="input-group" style={{ flex: 1, margin: 0 }}>
            <div className="input-wrapper">
              <Search className="input-icon" size={18} />
              <input
                className="input input-with-icon"
                placeholder="Search tracks by title or artist..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-elevated)', color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                <th style={{ padding: '16px 20px', fontWeight: 600 }}>Track Info</th>
                <th style={{ padding: '16px 20px', fontWeight: 600 }}>Artist</th>
                <th style={{ padding: '16px 20px', fontWeight: 600 }}>Stats</th>
                <th style={{ padding: '16px 20px', fontWeight: 600 }}>Upload Date</th>
                <th style={{ padding: '16px 20px', fontWeight: 600, textAlign: 'right' }}>Actions</th>
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
                  <tr key={track.id} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.2s' }}>
                    <td style={{ padding: '16px 20px' }}>
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
                    <td style={{ padding: '16px 20px', fontSize: '0.875rem' }}>
                      {track.username || 'Unknown'}
                    </td>
                    <td style={{ padding: '16px 20px', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                      {track.likes || 0} Likes
                    </td>
                    <td style={{ padding: '16px 20px', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                      {track.createdAt?.seconds ? new Date(track.createdAt.seconds * 1000).toLocaleDateString() : 'N/A'}
                    </td>
                    <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
                        <button 
                          className="btn-icon"
                          onClick={() => handlePlay(track)}
                          title="Play Track"
                          style={{ color: 'var(--accent)' }}
                        >
                          <PlayCircle size={18} />
                        </button>
                        <button 
                          className="btn-icon"
                          onClick={() => handleDelete(track.id, track.uid)}
                          title="Delete Track"
                          style={{ color: '#ef4444' }}
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
