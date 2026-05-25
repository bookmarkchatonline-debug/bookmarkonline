// src/components/layout/Sidebar.jsx
import { NavLink, useNavigate } from 'react-router-dom';
import { Home, Compass, BarChart2, Upload, User, Music, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import '../../styles/layout.css';

const navItems = [
  { to: '/',         icon: Home,     label: 'Home' },
  { to: '/discover', icon: Compass,  label: 'Discover' },
  { to: '/rankings', icon: BarChart2, label: 'Rankings' },
];

export default function Sidebar({ onClose, isOpen }) {
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  return (
    <aside className={`sidebar${isOpen ? ' open' : ''}`} onClick={onClose}>
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="logo-mark">
          BOOKMARK<span>CHAT</span>
        </div>
        <div className="logo-tagline">Discover. Save. Rank.</div>
      </div>

      <nav className="sidebar-nav">
        {/* Main nav */}
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
          >
            <Icon className="nav-icon" size={18} />
            {label}
          </NavLink>
        ))}

        {/* Library section */}
        <div className="nav-section-label">Your Library</div>

        {user ? (
          <>
            <NavLink
              to={`/profile/${user.uid}`}
              className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
            >
              <User className="nav-icon" size={18} />
              Profile
            </NavLink>
            <NavLink
              to="/upload"
              className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
            >
              <Upload className="nav-icon" size={18} />
              Upload
            </NavLink>
          </>
        ) : (
          <div
            className="nav-item"
            onClick={() => navigate('/login')}
          >
            <User className="nav-icon" size={18} />
            Sign In
          </div>
        )}

        <div className="nav-item" style={{ opacity: 0.5, cursor: 'default' }}>
          <Music className="nav-icon" size={18} />
          Tracks
        </div>
      </nav>

      {/* Upload CTA */}
      {user && (
        <div className="sidebar-upload-btn">
          <button
            className="btn btn-primary btn-block"
            onClick={() => navigate('/upload')}
          >
            <Upload size={15} />
            Upload Snippet
          </button>
        </div>
      )}
    </aside>
  );
}
