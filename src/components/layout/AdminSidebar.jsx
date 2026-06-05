import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, Music, Trophy, Briefcase, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { auth } from '../../firebase/config';
import { signOut } from 'firebase/auth';

const NAV_ITEMS = [
  { path: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/admin/users', icon: Users, label: 'Users' },
  { path: '/admin/tracks', icon: Music, label: 'Tracks' },
  { path: '/admin/awards', icon: Trophy, label: 'Awards' },
  { path: '/admin/opportunities', icon: Briefcase, label: 'Opportunities' }
];

export default function AdminSidebar() {
  const { user } = useAuth();

  const handleLogout = async () => {
    // Clear admin auth state from session
    sessionStorage.removeItem('adminAuth');
    
    if (user) {
      try {
        await signOut(auth);
      } catch (error) {
        console.error('Error signing out:', error);
      }
    }
    // Refresh to trigger re-render of AdminGuard
    window.location.href = '/admin/dashboard';
  };

  return (
    <aside className="sidebar" style={{ zIndex: 100, borderRight: '1px solid var(--border)' }}>
      <div className="sidebar-header" style={{ padding: '24px 20px', borderBottom: '1px solid var(--border)', marginBottom: '20px' }}>
        <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div>ADMIN<span style={{ color: 'var(--accent)' }}>PORTAL</span></div>
        </div>
      </div>

      <nav className="sidebar-nav" style={{ padding: '0 12px' }}>
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <Icon size={20} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <div style={{ marginTop: 'auto', padding: '20px', borderTop: '1px solid var(--border)' }}>
        <button 
          onClick={handleLogout}
          className="btn btn-outline" 
          style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)' }}
        >
          <LogOut size={18} />
          Exit Admin
        </button>
      </div>
    </aside>
  );
}
