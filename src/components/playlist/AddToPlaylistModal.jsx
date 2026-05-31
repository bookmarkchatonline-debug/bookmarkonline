// src/components/playlist/AddToPlaylistModal.jsx
import { useState, useEffect, useRef } from 'react';
import { X, Plus, Music, Check } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';
import { getUserPlaylists, createPlaylist, addTrackToPlaylist } from '../../firebase/firestore';
import toast from 'react-hot-toast';

export default function AddToPlaylistModal({ isOpen, onClose, track }) {
  const { user } = useAuth();
  const { playUiSound } = useSettings();
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const modalRef = useRef(null);

  useEffect(() => {
    if (isOpen && modalRef.current) {
      modalRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !user) return;
    let active = true;
    setLoading(true);
    getUserPlaylists(user.uid).then((res) => {
      if (active) {
        setPlaylists(res);
        setLoading(false);
      }
    });
    return () => { active = false; };
  }, [isOpen, user]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newPlaylistName.trim() || !user) return;
    playUiSound('click');
    setCreating(true);
    try {
      const pid = await createPlaylist(user.uid, newPlaylistName.trim(), true);
      await addTrackToPlaylist(pid, track.id);
      toast.success('Playlist created & track added!');
      setNewPlaylistName('');
      onClose();
    } catch (err) {
      toast.error('Failed to create playlist');
    } finally {
      setCreating(false);
    }
  };

  const handleAddToPlaylist = async (playlist) => {
    playUiSound('click');
    if (playlist.tracks?.includes(track.id)) {
      toast('Already in playlist', { icon: 'ℹ️' });
      return;
    }
    try {
      await addTrackToPlaylist(playlist.id, track.id);
      toast.success('Added to playlist!');
      onClose();
    } catch (err) {
      toast.error('Failed to add track');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 1000 }}>
      <div 
        className="modal-content animate-scale-in" 
        onClick={e => e.stopPropagation()}
        style={{ maxWidth: '400px', width: '90%' }}
        role="dialog"
        aria-modal="true"
        aria-label="Save to Playlist"
        tabIndex="-1"
        ref={modalRef}
      >
        <div className="modal-header">
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Save to Playlist</h2>
          <button className="btn-icon" onClick={() => { playUiSound('click'); onClose(); }} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <form onSubmit={handleCreate} style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              className="input"
              style={{ flex: 1 }}
              placeholder="New playlist name..."
              value={newPlaylistName}
              onChange={e => setNewPlaylistName(e.target.value)}
              disabled={creating}
            />
            <button type="submit" className="btn btn-primary" disabled={!newPlaylistName.trim() || creating} style={{ padding: '0 16px' }}>
              <Plus size={18} />
            </button>
          </form>

          <div style={{ maxHeight: '300px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>Loading playlists...</div>
            ) : playlists.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>You don't have any playlists yet.</div>
            ) : (
              playlists.map((pl) => {
                const isAdded = pl.tracks?.includes(track.id);
                return (
                  <button
                    key={pl.id}
                    onClick={() => handleAddToPlaylist(pl)}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '12px 16px', background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-md)', cursor: 'pointer', transition: 'all 0.2s',
                      color: 'var(--text-primary)'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--accent)'}
                    onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border)'}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '40px', height: '40px', background: 'var(--bg-glass)', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Music size={18} color="var(--text-muted)" />
                      </div>
                      <div style={{ textAlign: 'left' }}>
                        <div style={{ fontWeight: 600, fontSize: '0.9375rem' }}>{pl.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{pl.tracks?.length || 0} tracks</div>
                      </div>
                    </div>
                    {isAdded && <Check size={18} color="var(--accent)" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
