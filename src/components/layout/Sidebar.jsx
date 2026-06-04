import { NavLink, useNavigate } from 'react-router-dom';
import {
  Home, Compass, BarChart2, Upload, User, Music, X, Star, Calendar,
  MessageCircle, Trophy, Users, Zap, Crown, Settings, MessageSquare, Clock, Lock, Activity
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import CreatorBadge from '../common/CreatorBadge';
import '../../styles/layout.css';

const navItems = [
  { to: '/',              icon: Home,          label: 'Home' },
  { to: '/discover',      icon: Compass,       label: 'Discover' },
  { to: '/rankings',      icon: BarChart2,     label: 'Rankings' },
  { to: '/feed',          icon: MessageCircle, label: 'Feed' },
  { to: '/community',     icon: MessageSquare, label: 'Community' },
  { to: '/artists',       icon: Users,         label: 'Artists' },
  { to: '/awards',        icon: Trophy,        label: 'Awards' },
  { to: '/opportunities', icon: Calendar,      label: 'Opportunities' },
];

export default function Sidebar({ onClose, isOpen, onOpenSettings }) {
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  return (
    <aside className={`sidebar${isOpen ? ' open' : ''}`} onClick={onClose}>
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="logo-mark">
          BOOKMARK<span>CHAT</span>
        </div>
        <div className="logo-tagline">The Home for Rising Artists</div>
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
              {profile?.creatorLevel && (
                <span className="nav-badge-inline">
                  <CreatorBadge level={profile.creatorLevel} size="sm" showIcon={false} />
                </span>
              )}
            </NavLink>
            <NavLink
              to="/history"
              className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
            >
              <Clock className="nav-icon" size={18} />
              Listen History
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

        {/* Upgrade CTA */}
        {user && (profile?.plan || 'free') === 'free' && (
          <NavLink
            to="/upgrade"
            className={({ isActive }) => `nav-item nav-item-upgrade${isActive ? ' active' : ''}`}
          >
            <Crown className="nav-icon" size={18} />
            Upgrade
          </NavLink>
        )}

        {/* Admin section */}
        {(profile?.role === 'admin' || user?.email === 'bookmarkchatonline@gmail.com' || sessionStorage.getItem('adminAuth') === 'true') && (
          <>
            <div className="nav-section-label">Admin</div>
            <NavLink to="/admin/dashboard" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
              <Activity className="nav-icon" size={18} />
              Dashboard
            </NavLink>
            <NavLink to="/admin/users" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
              <Users className="nav-icon" size={18} />
              Manage Users
            </NavLink>
            <NavLink to="/admin/awards" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
              <Star className="nav-icon" size={18} />
              Manage Awards
            </NavLink>
            <NavLink to="/admin/tracks" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
              <Music className="nav-icon" size={18} />
              Manage Tracks
            </NavLink>
            <NavLink to="/admin/opportunities" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
              <Calendar className="nav-icon" size={18} />
              Manage Opps
            </NavLink>
          </>
        )}
      </nav>

      {/* Upload CTA */}
      <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {user && (
          <button
            className="btn btn-primary btn-block"
            onClick={() => navigate('/upload')}
          >
            <Upload size={15} />
            Upload Snippet
          </button>
        )}
        <button
          className="btn btn-ghost btn-block"
          onClick={(e) => { e.stopPropagation(); if (onOpenSettings) onOpenSettings(); }}
          style={{ justifyContent: 'center' }}
        >
          <Settings size={15} />
          Settings
        </button>
        <button
          className="btn btn-ghost btn-block"
          onClick={(e) => { e.stopPropagation(); navigate('/admin/users'); }}
          style={{ justifyContent: 'center', opacity: 0.5, fontSize: '0.8rem' }}
        >
          <Lock size={13} />
          Admin Portal
        </button>
      </div>
    </aside>
  );
}
