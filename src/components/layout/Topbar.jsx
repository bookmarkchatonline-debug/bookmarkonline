// src/components/layout/Topbar.jsx
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, Bell, Upload, Menu, User, LogOut, Settings,
  Crown, ChevronDown, X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { logout } from '../../firebase/auth';
import { getNotifications, getUnreadNotificationCount, markAllNotificationsRead } from '../../firebase/firestore';
import { searchTracks, searchUsers } from '../../firebase/firestore';
import CreatorBadge from '../common/CreatorBadge';
import toast from 'react-hot-toast';
import '../../styles/layout.css';

function timeAgo(timestamp) {
  if (!timestamp?.seconds) return 'now';
  const diff = Date.now() / 1000 - timestamp.seconds;
  if (diff < 60) return 'now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
}

export default function Topbar({ onMenuToggle }) {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const searchRef = useRef(null);
  const notifRef = useRef(null);
  const userMenuRef = useRef(null);

  // Load unread count
  useEffect(() => {
    if (!user) return;
    let active = true;
    const load = () => {
      getUnreadNotificationCount(user.uid).then((c) => {
        if (active) setUnreadCount(c);
      });
    };
    load();
    const interval = setInterval(load, 30000);
    return () => { active = false; clearInterval(interval); };
  }, [user]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) setSearchOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) setUserMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Search handler
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const [tracks, users] = await Promise.all([
          searchTracks(searchQuery.trim()),
          searchUsers(searchQuery.trim()),
        ]);
        setSearchResults([
          ...users.slice(0, 3).map((u) => ({ type: 'artist', ...u })),
          ...tracks.slice(0, 5).map((t) => ({ type: 'track', ...t })),
        ]);
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleOpenNotifs = async () => {
    setNotifOpen(!notifOpen);
    setUserMenuOpen(false);
    if (!notifOpen && user) {
      const notifs = await getNotifications(user.uid, 15);
      setNotifications(notifs);
      if (unreadCount > 0) {
        await markAllNotificationsRead(user.uid);
        setUnreadCount(0);
      }
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
      toast.success('Signed out');
    } catch (err) {
      toast.error('Failed to sign out');
    }
  };

  const initials = (profile?.username || user?.displayName || '?').slice(0, 2).toUpperCase();

  return (
    <header className="topbar">
      {/* Menu toggle (mobile) */}
      <button className="topbar-menu-btn" onClick={onMenuToggle} aria-label="Toggle menu">
        <Menu size={22} />
      </button>

      {/* Search */}
      <div className="topbar-search" ref={searchRef}>
        <div className="topbar-search-input-wrap">
          <Search size={16} className="topbar-search-icon" />
          <input
            type="search"
            placeholder="Search tracks, artists..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setSearchOpen(true); }}
            onFocus={() => setSearchOpen(true)}
            className="topbar-search-input"
            id="topbar-search-input"
          />
          {searchQuery && (
            <button className="topbar-search-clear" onClick={() => { setSearchQuery(''); setSearchResults([]); }}>
              <X size={14} />
            </button>
          )}
        </div>

        {/* Search results dropdown */}
        {searchOpen && searchQuery.trim() && (
          <div className="topbar-search-dropdown">
            {searching ? (
              <div className="topbar-search-loading">
                <div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />
                Searching...
              </div>
            ) : searchResults.length === 0 ? (
              <div className="topbar-search-empty">No results for "{searchQuery}"</div>
            ) : (
              searchResults.map((item, i) => (
                <button
                  key={`${item.type}-${item.id || item.uid}-${i}`}
                  className="topbar-search-result"
                  onClick={() => {
                    if (item.type === 'artist') navigate(`/profile/${item.uid}`);
                    else navigate(`/track/${item.id}`);
                    setSearchOpen(false);
                    setSearchQuery('');
                  }}
                >
                  <div className="topbar-search-result-type">
                    {item.type === 'artist' ? <User size={12} /> : <Search size={12} />}
                  </div>
                  <div className="topbar-search-result-info">
                    <div className="topbar-search-result-name">
                      {item.type === 'artist' ? item.username : item.title}
                    </div>
                    <div className="topbar-search-result-sub">
                      {item.type === 'artist'
                        ? `${item.stats?.totalLikes || 0} likes · ${item.creatorLevel || 'Rising Artist'}`
                        : item.username}
                    </div>
                  </div>
                </button>
              ))
            )}
            <button
              className="topbar-search-see-all"
              onClick={() => { navigate(`/discover?q=${encodeURIComponent(searchQuery)}`); setSearchOpen(false); setSearchQuery(''); }}
            >
              See all results →
            </button>
          </div>
        )}
      </div>

      {/* Right actions */}
      <div className="topbar-actions">
        {user ? (
          <>
            {/* Notifications */}
            <div className="topbar-notif-wrap" ref={notifRef}>
              <button className="topbar-icon-btn" onClick={handleOpenNotifs} aria-label="Notifications" id="notif-bell">
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="topbar-notif-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
                )}
              </button>

              {notifOpen && (
                <div className="topbar-notif-dropdown">
                  <div className="topbar-notif-header">
                    <span>Notifications</span>
                    {notifications.length > 0 && (
                      <span className="topbar-notif-count">{notifications.length}</span>
                    )}
                  </div>
                  <div className="topbar-notif-list">
                    {notifications.length === 0 ? (
                      <div className="topbar-notif-empty">
                        <Bell size={24} opacity={0.3} />
                        <span>No notifications yet</span>
                      </div>
                    ) : (
                      notifications.map((notif) => (
                        <div key={notif.id} className={`topbar-notif-item${notif.read ? '' : ' unread'}`}>
                          <div className="topbar-notif-message">{notif.message}</div>
                          <div className="topbar-notif-time">{timeAgo(notif.createdAt)}</div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Upload button */}
            <button
              className="topbar-upload-btn"
              onClick={() => navigate('/upload')}
              aria-label="Upload"
              id="topbar-upload-btn"
            >
              <Upload size={18} />
            </button>

            {/* User menu */}
            <div className="topbar-user-wrap" ref={userMenuRef}>
              <button
                className="topbar-user-btn"
                onClick={() => { setUserMenuOpen(!userMenuOpen); setNotifOpen(false); }}
              >
                {profile?.avatarUrl ? (
                  <img src={profile.avatarUrl} alt={profile.username} className="topbar-user-avatar" />
                ) : (
                  <div className="topbar-user-avatar-fallback">{initials}</div>
                )}
                <ChevronDown size={14} className={`topbar-chevron ${userMenuOpen ? 'open' : ''}`} />
              </button>

              {userMenuOpen && (
                <div className="topbar-user-dropdown">
                  <div className="topbar-user-dropdown-header">
                    <div className="topbar-user-dropdown-name">{profile?.username || 'User'}</div>
                    <CreatorBadge level={profile?.creatorLevel} size="sm" />
                  </div>
                  <button
                    className="topbar-user-dropdown-item"
                    onClick={() => { navigate(`/profile/${user.uid}`); setUserMenuOpen(false); }}
                  >
                    <User size={15} />
                    My Profile
                  </button>
                  <button
                    className="topbar-user-dropdown-item"
                    onClick={() => { navigate('/upload'); setUserMenuOpen(false); }}
                  >
                    <Upload size={15} />
                    Upload Snippet
                  </button>
                  {(profile?.plan || 'free') === 'free' && (
                    <button
                      className="topbar-user-dropdown-item topbar-upgrade-item"
                      onClick={() => { navigate('/upgrade'); setUserMenuOpen(false); }}
                    >
                      <Crown size={15} />
                      Upgrade Plan
                    </button>
                  )}
                  <div className="topbar-user-dropdown-divider" />
                  <button
                    className="topbar-user-dropdown-item topbar-logout-item"
                    onClick={handleLogout}
                  >
                    <LogOut size={15} />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/login')}>Sign In</button>
            <button className="btn btn-primary btn-sm" onClick={() => navigate('/register')}>Sign Up</button>
          </div>
        )}
      </div>
    </header>
  );
}
