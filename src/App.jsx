// src/App.jsx
import { useState } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Sidebar from './components/layout/Sidebar';
import Topbar from './components/layout/Topbar';
import Player from './components/layout/Player';
import Home from './pages/Home';
import Discover from './pages/Discover';
import Rankings from './pages/Rankings';
import Upload from './pages/Upload';
import Profile from './pages/Profile';
import TrackPage from './pages/TrackPage';
import Login from './pages/Login';
import Register from './pages/Register';
import { useAuth } from './context/AuthContext';

// Pages that use the full app shell (sidebar + topbar + player)
const SHELL_ROUTES = ['/', '/discover', '/rankings', '/upload', '/profile', '/track'];

function isShellRoute(pathname) {
  if (pathname === '/') return true;
  return SHELL_ROUTES.some((r) => r !== '/' && pathname.startsWith(r));
}

export default function App() {
  const { loading } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const useShell = isShellRoute(location.pathname);

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
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
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
            <Route path="/" element={<Home />} />
            <Route path="/discover" element={<Discover />} />
            <Route path="/rankings" element={<Rankings />} />
            <Route path="/upload" element={<Upload />} />
            <Route path="/profile/:uid" element={<Profile />} />
            <Route path="/track/:id" element={<TrackPage />} />
            {/* fallback */}
            <Route path="*" element={<Home />} />
          </Routes>
        </div>
      </div>

      {/* Sticky player */}
      <Player />
    </>
  );
}
