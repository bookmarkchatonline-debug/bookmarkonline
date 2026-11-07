import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  Home, Compass, Library, User, Menu, X, BarChart2, Video, 
  Smartphone, MessageCircle, MessageSquare, Users, Trophy, Calendar, 
  Clock, Upload, Crown, Activity, Star, Music
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import '../../styles/layout.css';

export default function MobileBottomNav() {
  const { user, profile } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const isAdmin = profile?.role === 'admin' || user?.email === 'bookmarkchatonline@gmail.com' || sessionStorage.getItem('adminAuth') === 'true';

  // The 4 main bottom nav items (5th is Menu)
  const mainNavItems = [
    { to: '/', icon: Home, label: 'Home' },
    { to: '/discover', icon: Compass, label: 'Explore' },
    { to: '/reels', icon: Smartphone, label: 'Reels' },
  ];

  return (
    <>
      <nav className="mobile-bottom-nav">
        {mainNavItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) => `mobile-nav-item${isActive && !menuOpen ? ' active' : ''}`}
            aria-label={label}
          >
            <Icon className="mobile-nav-icon" size={24} />
            <span className="mobile-nav-label">{label}</span>
          </NavLink>
        ))}
        
        {/* Profile Link */}
        <NavLink
          to={user ? `/profile/${user.uid}` : '/login'}
          className={({ isActive }) => `mobile-nav-item${isActive && !menuOpen ? ' active' : ''}`}
          aria-label={user ? 'Profile' : 'Sign In'}
        >
          <User className="mobile-nav-icon" size={24} />
          <span className="mobile-nav-label">{user ? 'Profile' : 'Sign In'}</span>
        </NavLink>

        {/* Menu Button */}
        <button 
          className={`mobile-nav-item ${menuOpen ? 'active' : ''}`}
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Menu"
          style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}
        >
          {menuOpen ? <X className="mobile-nav-icon" size={24} /> : <Menu className="mobile-nav-icon" size={24} />}
          <span className="mobile-nav-label">Menu</span>
        </button>
      </nav>

      {/* Mobile Menu Overlay */}
      {menuOpen && (
        <div className="mobile-menu-overlay">
          <div className="mobile-menu-content">
            <h2 className="mobile-menu-title">Menu</h2>
            
            <div className="mobile-menu-grid">
              <NavLink to="/rankings" className="mobile-menu-link" onClick={() => setMenuOpen(false)}>
                <BarChart2 size={20} /> Rankings
              </NavLink>
              <NavLink to="/videos" className="mobile-menu-link" onClick={() => setMenuOpen(false)}>
                <Video size={20} /> Videos
              </NavLink>
              <NavLink to={user ? `/library` : '/login'} className="mobile-menu-link" onClick={() => setMenuOpen(false)}>
                <Library size={20} /> Library
              </NavLink>
              <NavLink to="/feed" className="mobile-menu-link" onClick={() => setMenuOpen(false)}>
                <MessageCircle size={20} /> Feed
              </NavLink>
              <NavLink to="/community" className="mobile-menu-link" onClick={() => setMenuOpen(false)}>
                <MessageSquare size={20} /> Discussions
              </NavLink>
              <NavLink to="/messages" className="mobile-menu-link" onClick={() => setMenuOpen(false)}>
                <MessageCircle size={20} /> Messages
              </NavLink>
              <NavLink to="/artists" className="mobile-menu-link" onClick={() => setMenuOpen(false)}>
                <Users size={20} /> Artists
              </NavLink>
              <NavLink to="/awards" className="mobile-menu-link" onClick={() => setMenuOpen(false)}>
                <Trophy size={20} /> Awards
              </NavLink>
              <NavLink to="/opportunities" className="mobile-menu-link" onClick={() => setMenuOpen(false)}>
                <Calendar size={20} /> Open Calls
              </NavLink>
              {user && (
                <>
                  <NavLink to="/history" className="mobile-menu-link" onClick={() => setMenuOpen(false)}>
                    <Clock size={20} /> History
                  </NavLink>
                  <NavLink to="/upload" className="mobile-menu-link" onClick={() => setMenuOpen(false)}>
                    <Upload size={20} /> Upload Music
                  </NavLink>
                  <NavLink to="/video-upload" className="mobile-menu-link" onClick={() => setMenuOpen(false)}>
                    <Video size={20} /> Upload Video
                  </NavLink>
                </>
              )}
              {user && (profile?.plan || 'free') === 'free' && (
                <NavLink to="/upgrade" className="mobile-menu-link highlight" onClick={() => setMenuOpen(false)}>
                  <Crown size={20} /> Upgrade
                </NavLink>
              )}
            </div>

            {isAdmin && (
              <div className="mobile-menu-admin-section">
                <h3 className="mobile-menu-subtitle">Admin Portal</h3>
                <div className="mobile-menu-grid">
                  <NavLink to="/admin/dashboard" className="mobile-menu-link admin-link" onClick={() => setMenuOpen(false)}>
                    <Activity size={18} /> Dashboard
                  </NavLink>
                  <NavLink to="/admin/users" className="mobile-menu-link admin-link" onClick={() => setMenuOpen(false)}>
                    <Users size={18} /> Users
                  </NavLink>
                  <NavLink to="/admin/awards" className="mobile-menu-link admin-link" onClick={() => setMenuOpen(false)}>
                    <Star size={18} /> Awards
                  </NavLink>
                  <NavLink to="/admin/tracks" className="mobile-menu-link admin-link" onClick={() => setMenuOpen(false)}>
                    <Music size={18} /> Tracks
                  </NavLink>
                  <NavLink to="/admin/opportunities" className="mobile-menu-link admin-link" onClick={() => setMenuOpen(false)}>
                    <Calendar size={18} /> Opps
                  </NavLink>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
