import { NavLink, useNavigate } from 'react-router-dom';
import {
  Home, Compass, BarChart2, Video, Smartphone, MessageCircle, MessageSquare, 
  Users, Trophy, Calendar, Library, Clock, Upload, User, 
  Settings, Lock, Crown, Activity, Star, Music
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import CreatorBadge from '../common/CreatorBadge';
import '../../styles/layout.css';

export default function Sidebar({ onOpenSettings }) {
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  // Determine if user has admin access
  const isAdmin = profile?.role === 'admin' || user?.email === 'bookmarkchatonline@gmail.com' || sessionStorage.getItem('adminAuth') === 'true';

  return (
    <aside className="sidebar desktop-only">
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="logo-mark">BOOKMARK<span>CHAT</span></div>
        <div className="logo-tagline">The Home for Rising Artists</div>
      </div>

      <nav className="sidebar-nav" style={{ overflowY: 'auto' }}>
        
        {/* Main Navigation */}
        <NavLink to="/" end className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
          <Home className="nav-icon" size={20} />
          Home
        </NavLink>
        <NavLink to="/discover" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
          <Compass className="nav-icon" size={20} />
          Explore
        </NavLink>
        <NavLink to="/rankings" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
          <BarChart2 className="nav-icon" size={20} />
          Rankings
        </NavLink>
        <NavLink to="/videos" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
          <Video className="nav-icon" size={20} />
          Videos
        </NavLink>
        <NavLink to="/reels" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
          <Smartphone className="nav-icon" size={20} />
          Reels
        </NavLink>

        <div className="nav-divider" />

        {/* Social & Community */}
        <div className="nav-section-label">Community</div>
        <NavLink to="/feed" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
          <MessageCircle className="nav-icon" size={20} />
          Feed
        </NavLink>
        <NavLink to="/community" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
          <MessageSquare className="nav-icon" size={20} />
          Discussions
        </NavLink>
        <NavLink to="/messages" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
          <MessageCircle className="nav-icon" size={20} />
          Messages
        </NavLink>
        <NavLink to="/artists" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
          <Users className="nav-icon" size={20} />
          Artists
        </NavLink>

        <div className="nav-divider" />

        {/* Opportunities */}
        <div className="nav-section-label">Opportunities</div>
        <NavLink to="/awards" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
          <Trophy className="nav-icon" size={20} />
          Awards
        </NavLink>
        <NavLink to="/opportunities" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
          <Calendar className="nav-icon" size={20} />
          Open Calls
        </NavLink>

        <div className="nav-divider" />

        {/* Your Library */}
        <div className="nav-section-label">Your Library</div>
        <NavLink to={user ? `/library` : '/login'} className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
          <Library className="nav-icon" size={20} />
          Library
        </NavLink>
        {user && (
          <NavLink to="/history" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
            <Clock className="nav-icon" size={20} />
            History
          </NavLink>
        )}

        <div className="nav-divider" />

        {/* Action / Upload */}
        <NavLink to="/upload" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
          <Upload className="nav-icon" size={20} />
          Upload Music
        </NavLink>
        <NavLink to="/video-upload" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
          <Video className="nav-icon" size={20} />
          Upload Video
        </NavLink>

        <div className="nav-divider" />

        {/* Profile */}
        {user ? (
          <NavLink to={`/profile/${user.uid}`} className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
            <User className="nav-icon" size={20} />
            Profile
            {profile?.creatorLevel && (
              <span className="nav-badge-inline">
                <CreatorBadge level={profile.creatorLevel} size="sm" showIcon={false} />
              </span>
            )}
          </NavLink>
        ) : (
          <div className="nav-item" onClick={() => navigate('/login')}>
            <User className="nav-icon" size={20} />
            Sign In
          </div>
        )}

        {/* Upgrade CTA */}
        {user && (profile?.plan || 'free') === 'free' && (
          <NavLink to="/upgrade" className={({ isActive }) => `nav-item nav-item-upgrade${isActive ? ' active' : ''}`}>
            <Crown className="nav-icon" size={20} />
            Upgrade
          </NavLink>
        )}

        {/* Admin section */}
        {isAdmin && (
          <>
            <div className="nav-divider" />
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

      {/* Footer Actions */}
      <div className="sidebar-footer">
        <button
          className="btn btn-ghost btn-block"
          onClick={(e) => { e.stopPropagation(); if (onOpenSettings) onOpenSettings(); }}
          aria-label="Settings"
        >
          <Settings size={18} />
          Settings
        </button>

        {isAdmin && (
          <button
            className="btn btn-ghost btn-block"
            onClick={(e) => { e.stopPropagation(); navigate('/admin/users'); }}
            style={{ color: 'var(--text-muted)' }}
          >
            <Lock size={16} />
            Admin Portal
          </button>
        )}
      </div>
    </aside>
  );
}
