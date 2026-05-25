// src/components/layout/Topbar.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Upload, LogOut, Menu, User, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { logout } from '../../firebase/auth';
import toast from 'react-hot-toast';
import '../../styles/layout.css';

export default function Topbar({ onMenuToggle }) {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [searchVal, setSearchVal] = useState('');
  const [showMenu, setShowMenu] = useState(false);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchVal.trim()) {
      navigate(`/discover?q=${encodeURIComponent(searchVal.trim())}`);
      setSearchVal('');
    }
  };

  const handleLogout = async () => {
    await logout();
    toast.success('Signed out');
    setShowMenu(false);
    navigate('/');
  };

  const initials = profile?.username
    ? profile.username.slice(0, 2).toUpperCase()
    : user?.email?.slice(0, 2).toUpperCase() || 'BC';

  return (
    <header className="topbar">
      {/* Mobile menu button */}
      <button className="mobile-menu-btn btn-icon" onClick={onMenuToggle} aria-label="Menu">
        <Menu size={20} />
      </button>

      {/* Search */}
      <form className="topbar-search" onSubmit={handleSearch}>
        <Search className="topbar-search-icon" size={16} />
        <input
          className="topbar-search-input"
          type="search"
          placeholder="Search for tracks, artists, tags..."
          value={searchVal}
          onChange={(e) => setSearchVal(e.target.value)}
          aria-label="Search tracks"
        />
      </form>

      <div className="topbar-actions">
        {user ? (
          <>
            <button
              className="topbar-upload-btn"
              onClick={() => navigate('/upload')}
              id="topbar-upload-btn"
            >
              <Upload size={14} />
              UPLOAD
            </button>

            {/* Avatar + dropdown */}
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setShowMenu((v) => !v)}
                style={{ background: 'none', padding: 0 }}
                aria-label="Account menu"
              >
                {profile?.avatarUrl ? (
                  <img src={profile.avatarUrl} alt="avatar" className="topbar-avatar" />
                ) : (
                  <div
                    className="topbar-avatar"
                    style={{
                      background: 'var(--accent-grad)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      color: '#fff',
                    }}
                  >
                    {initials}
                  </div>
                )}
              </button>

              {showMenu && (
                <div
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 8px)',
                    right: 0,
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-md)',
                    minWidth: '160px',
                    boxShadow: 'var(--shadow-lg)',
                    zIndex: 200,
                    overflow: 'hidden',
                    animation: 'fadeIn 0.15s ease',
                  }}
                >
                  <button
                    onClick={() => { navigate(`/profile/${user.uid}`); setShowMenu(false); }}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      color: 'var(--text-secondary)',
                      fontSize: '0.875rem',
                      fontWeight: 500,
                      transition: 'all 0.15s',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-glass-hover)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = ''; e.currentTarget.style.color = ''; }}
                  >
                    <User size={15} />
                    Profile
                  </button>
                  <button
                    onClick={handleLogout}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      color: 'var(--error)',
                      fontSize: '0.875rem',
                      fontWeight: 500,
                      transition: 'all 0.15s',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = ''; }}
                  >
                    <LogOut size={15} />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/login')} id="signin-btn">
              Sign In
            </button>
            <button className="btn btn-primary btn-sm" onClick={() => navigate('/register')} id="register-btn">
              Join Free
            </button>
          </>
        )}
      </div>
    </header>
  );
}
