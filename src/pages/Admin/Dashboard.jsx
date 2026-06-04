import { useState, useEffect } from 'react';
import { Users, Music, Heart, BarChart2, Activity } from 'lucide-react';
import { getPlatformStats } from '../../firebase/firestore';

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
    <div className="page animate-fade-in" style={{ maxWidth: 1000, margin: '0 auto' }}>
      <div className="section-header" style={{ marginBottom: 30 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Activity size={28} color="var(--accent)" />
          <h1 style={{ margin: 0 }}>Platform Dashboard</h1>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '40px' }}>
        <div style={{ background: 'var(--bg-card)', padding: '24px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'linear-gradient(135deg, #3b82f6, #06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Users size={24} color="#fff" />
            </div>
            <div>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Users</div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800 }}>{loading ? '-' : stats.totalUsers}</div>
            </div>
          </div>
        </div>

        <div style={{ background: 'var(--bg-card)', padding: '24px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'linear-gradient(135deg, #a855f7, #c026d3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Music size={24} color="#fff" />
            </div>
            <div>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Tracks</div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800 }}>{loading ? '-' : stats.totalTracks}</div>
            </div>
          </div>
        </div>

        <div style={{ background: 'var(--bg-card)', padding: '24px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'linear-gradient(135deg, #ec4899, #f43f5e)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Heart size={24} color="#fff" />
            </div>
            <div>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Likes</div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800 }}>{loading ? '-' : stats.totalLikes}</div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ background: 'var(--bg-card)', padding: '30px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', textAlign: 'center' }}>
        <BarChart2 size={48} color="var(--text-muted)" style={{ marginBottom: '16px', opacity: 0.5 }} />
        <h3>More analytics coming soon</h3>
        <p style={{ color: 'var(--text-secondary)' }}>We are gathering more data to show you detailed engagement graphs and growth metrics here.</p>
      </div>
    </div>
  );
}
