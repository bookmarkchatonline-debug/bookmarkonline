import { useState, useEffect } from 'react';
import { History as HistoryIcon } from 'lucide-react';
import TrackCard from '../components/track/TrackCard';
import '../styles/pages.css';

export default function History() {
  const [history, setHistory] = useState([]);

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('bookmarkchat_listen_history') || '[]');
      setHistory(stored);
    } catch (err) {
      console.error('Failed to load history', err);
    }
  }, []);

  return (
    <div className="page discover-page animate-fade-in">
      <div className="discover-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <HistoryIcon size={28} color="var(--accent)" />
          <h1 style={{ margin: 0, fontSize: '2rem', fontWeight: 800 }}>Listen History</h1>
        </div>
        <p style={{ color: 'var(--text-secondary)' }}>Tracks you've played recently on this device.</p>
      </div>

      <div style={{ marginTop: '24px' }}>
        {history.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🕒</div>
            <p>You haven't listened to any tracks yet.</p>
          </div>
        ) : (
          <div className="tracks-grid">
            {history.map((track, i) => (
              <TrackCard key={`${track.id}-${i}`} track={track} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
