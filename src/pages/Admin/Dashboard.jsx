import { useState, useEffect } from 'react';
import { Users, Music, Heart, BarChart2, Activity } from 'lucide-react';
import { getPlatformStats } from '../../firebase/firestore';
import '../../styles/admin.css';

export default function AdminDashboard() {
  const [stats, setStats] = useState({ totalUsers: 0, totalTracks: 0, totalLikes: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    getPlatformStats().then((data) => {
      if (isMounted) {
        setStats(data);
        setLoading(false);
      }
    });
    return () => { isMounted = false; };
  }, []);

  return (
    <div className="admin-workspace animate-fade-in">
      <div className="admin-header">
        <div className="admin-title-group">
          <div className="admin-title-icon" style={{ background: 'var(--accent-soft)' }}>
            <Activity size={28} color="var(--accent)" />
          </div>
          <div>
            <h1 className="admin-title">Platform Dashboard</h1>
            <p className="admin-subtitle">Overview of Mask504 metrics.</p>
          </div>
        </div>
      </div>

      <div className="admin-stats-grid">
        <div className="admin-stat-card">
          <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'linear-gradient(135deg, #3b82f6, #06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Users size={24} color="#fff" />
          </div>
          <div className="admin-stat-content">
            <div className="admin-stat-label">Total Users</div>
            <div className="admin-stat-value">{loading ? '-' : stats.totalUsers}</div>
          </div>
        </div>

        <div className="admin-stat-card">
          <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'linear-gradient(135deg, #a855f7, #c026d3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Music size={24} color="#fff" />
          </div>
          <div className="admin-stat-content">
            <div className="admin-stat-label">Total Tracks</div>
            <div className="admin-stat-value">{loading ? '-' : stats.totalTracks}</div>
          </div>
        </div>

        <div className="admin-stat-card">
          <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'linear-gradient(135deg, #ec4899, #f43f5e)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Heart size={24} color="#fff" />
          </div>
          <div className="admin-stat-content">
            <div className="admin-stat-label">Total Likes</div>
            <div className="admin-stat-value">{loading ? '-' : stats.totalLikes}</div>
          </div>
        </div>
      </div>

      <div className="admin-panel" style={{ padding: '40px', textAlign: 'center' }}>
        <BarChart2 size={48} color="var(--text-muted)" style={{ margin: '0 auto 16px', opacity: 0.5 }} />
        <h3 style={{ fontSize: '1.25rem', marginBottom: '8px' }}>More analytics coming soon</h3>
        <p style={{ color: 'var(--text-secondary)' }}>We are gathering more data to show you detailed engagement graphs and growth metrics here.</p>
      </div>
    </div>
  );
}
