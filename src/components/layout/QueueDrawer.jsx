// src/components/layout/QueueDrawer.jsx
import { X, Music, ListMusic, Trash2 } from 'lucide-react';
import { usePlayer } from '../../context/PlayerContext';

export default function QueueDrawer({ isOpen, onClose }) {
  const { queue, currentTrack, removeFromQueue, clearQueue, play } = usePlayer();

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="queue-drawer-backdrop"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Drawer */}
      <div className={`queue-drawer${isOpen ? ' open' : ''}`} role="dialog" aria-label="Queue">
        {/* Header */}
        <div className="queue-drawer-header">
          <div className="queue-drawer-title">
            <ListMusic size={18} color="var(--accent)" />
            <span>Queue</span>
            {queue.length > 0 && (
              <span className="queue-drawer-count">{queue.length}</span>
            )}
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {queue.length > 0 && (
              <button
                className="queue-clear-btn"
                onClick={clearQueue}
                aria-label="Clear queue"
                title="Clear queue"
              >
                <Trash2 size={15} />
              </button>
            )}
            <button
              className="queue-close-btn"
              onClick={onClose}
              aria-label="Close queue"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Now Playing */}
        {currentTrack && (
          <div className="queue-now-playing">
            <div className="queue-section-label">Now Playing</div>
            <div className="queue-item queue-item-current">
              {currentTrack.coverUrl ? (
                <img src={currentTrack.coverUrl} alt={currentTrack.title} className="queue-item-cover" />
              ) : (
                <div className="queue-item-cover queue-item-cover-placeholder">
                  <Music size={14} color="#fff" />
                </div>
              )}
              <div className="queue-item-info">
                <div className="queue-item-title">{currentTrack.title}</div>
                <div className="queue-item-artist">{currentTrack.username}</div>
              </div>
              {/* Animated equalizer for current track */}
              <div className="eq-bars" aria-hidden="true">
                <span className="eq-bar" />
                <span className="eq-bar" />
                <span className="eq-bar" />
                <span className="eq-bar" />
              </div>
            </div>
          </div>
        )}

        {/* Up Next */}
        <div className="queue-list">
          {queue.length === 0 ? (
            <div className="queue-empty">
              <Music size={32} color="var(--text-muted)" />
              <p>Your queue is empty</p>
              <span>Click the + on any track to add it</span>
            </div>
          ) : (
            <>
              <div className="queue-section-label" style={{ padding: '12px 16px 6px' }}>
                Up Next · {queue.length} track{queue.length !== 1 ? 's' : ''}
              </div>
              {queue.map((track, i) => (
                <div
                  key={track.id}
                  className="queue-item"
                  onClick={() => play(track)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && play(track)}
                  title="Click to play"
                >
                  <span className="queue-item-pos">{i + 1}</span>
                  {track.coverUrl ? (
                    <img src={track.coverUrl} alt={track.title} className="queue-item-cover" />
                  ) : (
                    <div className="queue-item-cover queue-item-cover-placeholder">
                      <Music size={14} color="#fff" />
                    </div>
                  )}
                  <div className="queue-item-info">
                    <div className="queue-item-title">{track.title}</div>
                    <div className="queue-item-artist">{track.username}</div>
                  </div>
                  <button
                    className="queue-item-remove"
                    onClick={(e) => { e.stopPropagation(); removeFromQueue(track.id); }}
                    aria-label="Remove from queue"
                    title="Remove"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </>
  );
}
