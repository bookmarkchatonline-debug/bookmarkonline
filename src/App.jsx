import { useState } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Sidebar from './components/layout/Sidebar';
import Topbar from './components/layout/Topbar';
import Player from './components/layout/Player';
import SettingsModal from './components/layout/SettingsModal';
import Home from './pages/Home';
import Landing from './pages/Landing';
import Discover from './pages/Discover';
import Rankings from './pages/Rankings';
import Upload from './pages/Upload';
import Profile from './pages/Profile';
import TrackPage from './pages/TrackPage';
import Feed from './pages/Feed';
import Community from './pages/Community';
import DiscussionThread from './pages/DiscussionThread';
import AwardsPage from './pages/AwardsPage';
import ArtistDirectory from './pages/ArtistDirectory';
import OpportunitiesPage from './pages/OpportunitiesPage';
import UpgradePage from './pages/UpgradePage';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminAwards from './pages/Admin/Awards';
import AdminOpportunities from './pages/Admin/Opportunities';
import Privacy from './pages/Privacy';
import Terms from './pages/Terms';
import About from './pages/About';
import { useAuth } from './context/AuthContext';

// Pages that use the full app shell (sidebar + topbar + player)
const SHELL_ROUTES = ['/', '/discover', '/rankings', '/upload', '/profile', '/track', '/admin', '/feed', '/community', '/awards', '/artists', '/opportunities', '/upgrade'];

const SHELL_ROUTES = ['/', '/discover', '/rankings', '/upload', '/profile', '/track', '/admin', '/feed', '/community', '/awards', '/artists', '/opportunities', '/upgrade'];
const NON_SHELL_ROUTES = ['/login', '/register', '/privacy', '/terms', '/about'];

function isShellRoute(pathname, isLoggedIn) {
  if (NON_SHELL_ROUTES.includes(pathname)) return false;
  if (pathname === '/') return isLoggedIn; // landing doesn't use shell
  return SHELL_ROUTES.some((r) => r !== '/' && pathname.startsWith(r));
}

export default function App() {
  const { loading, user } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const useShell = isShellRoute(location.pathname, !!user);

  // Show spinner while Firebase auth is resolving
  if (loading) {
    return (
      <div className="loading-screen">
        <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '1.4rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
          BOOKMARK<span style={{ background: 'linear-gradient(135deg, #a855f7, #c026d3)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>CHAT</span>
        </div>
        <div className="spinner" />
      </div>
    );
  }

  // Non-authenticated / non-shell routes — render without app chrome
  if (!useShell) {
    return (
      <>
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              background: 'var(--bg-card)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border)',
              borderRadius: '10px',
              fontSize: '0.875rem',
            },
          }}
        />
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/about" element={<About />} />
          <Route path="*" element={<Landing />} />
        </Routes>
      </>
    );
  }


  return (
    <>
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: 'var(--bg-card)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border)',
            borderRadius: '10px',
            fontSize: '0.875rem',
          },
        }}
      />

      <div className="app-shell">
        {/* Sidebar */}
        <Sidebar
          onClose={() => setSidebarOpen(false)}
          isOpen={sidebarOpen}
          onOpenSettings={() => setSettingsOpen(true)}
        />

        {/* Mobile overlay */}
        {sidebarOpen && (
          <div
            style={{
              position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
              zIndex: 150,
            }}
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main area */}
        <div className="main-content">
          <Topbar onMenuToggle={() => setSidebarOpen((v) => !v)} />

          <Routes>
            <Route path="/" element={user ? <Home /> : <Landing />} />
            <Route path="/discover" element={<Discover />} />
            <Route path="/rankings" element={<Rankings />} />
            <Route path="/feed" element={<Feed />} />
            <Route path="/community" element={<Community />} />
            <Route path="/community/:id" element={<DiscussionThread />} />
            <Route path="/awards" element={<AwardsPage />} />
            <Route path="/artists" element={<ArtistDirectory />} />
            <Route path="/opportunities" element={<OpportunitiesPage />} />
            <Route path="/upgrade" element={<UpgradePage />} />
            <Route path="/upload" element={<Upload />} />
            <Route path="/profile/:uid" element={<Profile />} />
            <Route path="/admin/awards" element={<AdminAwards />} />
            <Route path="/admin/opportunities" element={<AdminOpportunities />} />
            <Route path="/track/:id" element={<TrackPage />} />
            {/* fallback */}
            <Route path="*" element={<Home />} />
          </Routes>
        </div>
      </div>

      {/* Sticky player */}
      <Player />
      
      {/* Settings Modal */}
      <SettingsModal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </>
  );
}
