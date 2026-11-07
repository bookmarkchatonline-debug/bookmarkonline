import { usePlayer } from '../../context/PlayerContext';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';
import { toggleLike, hasLiked } from '../../firebase/firestore';
import {
  Play, Pause, SkipBack, SkipForward,
  Volume2, VolumeX, Heart, Music, ListMusic, ListPlus,
  ChevronDown, Share2, MoreVertical
} from 'lucide-react';
import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import QueueDrawer from './QueueDrawer';
import AddToPlaylistModal from '../playlist/AddToPlaylistModal';
import ShareToChatModal from '../track/ShareToChatModal';
import '../../styles/player.css';

function formatTime(secs) {
  if (!secs || isNaN(secs)) return '0:00';
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function Player() {
  const { playUiSound } = useSettings();
  const {
    currentTrack, isPlaying, progress, duration, currentTime, volume,
    queue, togglePlay, seek, changeVolume, skipNext, skipPrev,
  } = usePlayer();
  const { user } = useAuth();
  const navigate  = useNavigate();
  
  const [liked, setLiked] = useState(false);
  const [queueOpen, setQueueOpen] = useState(false);
  const [playlistOpen, setPlaylistOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [muted, setMuted] = useState(false);
  const [isMobileExpanded, setIsMobileExpanded] = useState(false);
  const prevVolRef = useRef(0.8);

  useEffect(() => {
    if (user && currentTrack) {
      hasLiked(user.uid, currentTrack.id).then(setLiked);
    } else {
      setLiked(false);
    }
  }, [user, currentTrack?.id]);

  const handleLike = useCallback(async (e) => {
    if (e) e.stopPropagation();
    if (!user) { toast.error('Sign in to like tracks'); return; }
    playUiSound('pop');
    const newState = await toggleLike(user.uid, currentTrack.id);
    setLiked(newState);
    toast(newState ? '❤️ Liked!' : '💔 Unliked', { duration: 1200 });
  }, [user, currentTrack, playUiSound]);

  const handleProgressClick = (e) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    seek(((e.clientX - rect.left) / rect.width) * 100);
  };

  const handleVolumeClick = (e) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    const v = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    prevVolRef.current = v;
    setMuted(false);
    changeVolume(v);
    playUiSound('pop');
  };

  const toggleMute = (e) => {
    e.stopPropagation();
    playUiSound('click');
    if (muted) {
      changeVolume(prevVolRef.current || 0.8);
      setMuted(false);
    } else {
      prevVolRef.current = volume;
      changeVolume(0);
      setMuted(true);
    }
  };

  const handlePlayPause = (e) => {
    e.stopPropagation();
    playUiSound('click');
    togglePlay();
  };

  if (!currentTrack) {
    return null;
  }

  const displayVol = muted ? 0 : volume;

  return (
    <>
      {/* ─── Desktop Mini Player ────────────────────────────────────────────── */}
      <div className="player-desktop">
        <div className="player-desk-left">
          {currentTrack.coverUrl ? (
            <img 
              src={currentTrack.coverUrl} 
              alt={currentTrack.title} 
              className="player-desk-artwork" 
              style={{ cursor: 'pointer' }}
              onClick={() => navigate(`/track/${currentTrack.id}`)}
            />
          ) : (
            <div 
              className="player-desk-artwork placeholder"
              style={{ cursor: 'pointer' }}
              onClick={() => navigate(`/track/${currentTrack.id}`)}
            >
              <Music size={24} />
            </div>
          )}
          <div className="player-desk-info">
            <div 
              className="player-desk-title"
              style={{ cursor: 'pointer' }}
              onClick={() => navigate(`/track/${currentTrack.id}`)}
            >
              {currentTrack.title}
            </div>
            <div 
              className="player-desk-artist"
              style={{ cursor: 'pointer' }}
              onClick={() => navigate(`/profile/${currentTrack.uid}`)}
            >
              {currentTrack.username}
            </div>
          </div>
          <button 
            className="player-btn-icon player-desk-like"
            onClick={handleLike}
            aria-label={liked ? "Unlike track" : "Like track"}
          >
            <Heart size={18} fill={liked ? 'currentColor' : 'none'} color={liked ? 'var(--accent)' : 'currentColor'} />
          </button>
        </div>

        <div className="player-desk-center">
          <div className="player-desk-controls">
            <button 
              className="player-btn-icon" 
              onClick={() => { playUiSound('click'); skipPrev(); }}
              aria-label="Previous track"
            >
              <SkipBack size={20} />
            </button>
            <button 
              className="player-btn-icon player-play-circle" 
              onClick={handlePlayPause}
              aria-label={isPlaying ? "Pause track" : "Play track"}
            >
              {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" style={{ marginLeft: 2 }} />}
            </button>
            <button 
              className="player-btn-icon" 
              onClick={() => { playUiSound('click'); skipNext(); }}
              disabled={queue.length === 0}
              aria-label="Next track"
            >
              <SkipForward size={20} />
            </button>
          </div>
          
          <div className="player-progress-container">
            <span className="player-time">{formatTime(currentTime)}</span>
            <div 
              className="player-progress-bar"
              onClick={handleProgressClick}
              role="slider"
              aria-valuenow={progress}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Seek track position"
              tabIndex={0}
            >
              <div className="player-progress-fill" style={{ width: `${progress}%` }} />
              <div className="player-progress-thumb" style={{ left: `${progress}%` }} />
            </div>
            <span className="player-time">{formatTime(duration)}</span>
          </div>
        </div>

        <div className="player-desk-right">
          <button 
            className="player-btn-icon"
            onClick={() => setShareOpen(true)}
            aria-label="Share track"
          >
            <Share2 size={18} />
          </button>
          <button 
            className="player-btn-icon"
            onClick={() => {
              if (!user) { toast.error('Sign in to add to playlists'); return; }
              setPlaylistOpen(true);
            }}
            aria-label="Add to playlist"
          >
            <ListPlus size={18} />
          </button>
          <button 
            className="player-btn-icon"
            onClick={() => { playUiSound('click'); setQueueOpen((v) => !v); }}
            style={{ color: queueOpen ? 'var(--accent)' : 'inherit' }}
            aria-label="Toggle queue"
          >
            <ListMusic size={18} />
          </button>
          <div className="player-vol-container">
            <button 
              className="player-btn-icon" 
              onClick={toggleMute}
              aria-label={muted ? "Unmute" : "Mute"}
            >
              {muted || volume === 0 ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </button>
            <div 
              className="player-vol-bar"
              onClick={handleVolumeClick}
              role="slider"
              aria-label="Volume"
              aria-valuenow={Math.round(displayVol * 100)}
              tabIndex={0}
            >
              <div className="player-vol-fill" style={{ width: `${displayVol * 100}%` }} />
              <div className="player-progress-thumb" style={{ left: `${displayVol * 100}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* ─── Mobile Mini Player ───────────────────────────────────────────── */}
      <div 
        className={`player-mobile-mini ${isMobileExpanded ? 'hidden' : ''}`}
        onClick={() => setIsMobileExpanded(true)}
        role="button"
        tabIndex={0}
        aria-label="Expand player"
      >
        <div className="player-mobile-progress-top" style={{ width: `${progress}%` }} />
        <div className="player-mobile-content">
          {currentTrack.coverUrl ? (
            <img src={currentTrack.coverUrl} alt="" className="player-mobile-artwork" />
          ) : (
            <div className="player-mobile-artwork placeholder" style={{ background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Music size={16} color="var(--text-muted)" />
            </div>
          )}
          <div className="player-mobile-text">
            <div className="player-mobile-title">{currentTrack.title}</div>
            <div className="player-mobile-artist">{currentTrack.username}</div>
          </div>
          <div className="player-mobile-actions">
            <button 
              className="player-btn-icon" 
              onClick={handleLike}
              aria-label={liked ? "Unlike track" : "Like track"}
            >
              <Heart size={20} fill={liked ? 'currentColor' : 'none'} color={liked ? 'var(--accent)' : 'currentColor'} />
            </button>
            <button 
              className="player-btn-icon" 
              onClick={handlePlayPause}
              aria-label={isPlaying ? "Pause track" : "Play track"}
            >
              {isPlaying ? <Pause size={24} fill="currentColor" color="var(--text-primary)" /> : <Play size={24} fill="currentColor" color="var(--text-primary)" />}
            </button>
          </div>
        </div>
      </div>

      {/* ─── Mobile Full Player Overlay ───────────────────────────────────── */}
      <div className={`player-mobile-full ${isMobileExpanded ? 'open' : ''}`}>
        <header className="mobile-full-header">
          <button 
            className="player-btn-icon" 
            onClick={() => setIsMobileExpanded(false)}
            aria-label="Minimize player"
          >
            <ChevronDown size={28} color="var(--text-primary)" />
          </button>
          <span className="mobile-full-title">Now Playing</span>
          <button 
            className="player-btn-icon"
            onClick={() => setShareOpen(true)}
            aria-label="Share track"
          >
            <Share2 size={24} color="var(--text-primary)" />
          </button>
        </header>
        
        <main className="mobile-full-main">
          <div className="mobile-full-artwork-wrap">
            {currentTrack.coverUrl ? (
              <img src={currentTrack.coverUrl} alt={currentTrack.title} className="mobile-full-artwork" />
            ) : (
              <div className="mobile-full-artwork" style={{ background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Music size={64} color="var(--text-muted)" />
              </div>
            )}
          </div>
          
          <div className="mobile-full-info">
            <div className="mobile-full-text">
              <div className="mobile-full-track-title">{currentTrack.title}</div>
              <div 
                className="mobile-full-track-artist"
                onClick={() => { setIsMobileExpanded(false); navigate(`/profile/${currentTrack.uid}`); }}
              >
                {currentTrack.username}
              </div>
            </div>
            <button 
              className="player-btn-icon"
              onClick={handleLike}
              aria-label={liked ? "Unlike track" : "Like track"}
            >
              <Heart size={28} fill={liked ? 'currentColor' : 'none'} color={liked ? 'var(--accent)' : 'currentColor'} />
            </button>
          </div>

          <div className="mobile-full-progress">
            <div 
              className="player-progress-bar"
              onClick={handleProgressClick}
              role="slider"
              aria-valuenow={progress}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Seek track position"
              style={{ height: 6 }}
            >
              <div className="player-progress-fill" style={{ width: `${progress}%` }} />
              <div className="player-progress-thumb" style={{ left: `${progress}%`, width: 16, height: 16, marginTop: -8, marginLeft: -8 }} />
            </div>
            <div className="mobile-full-times">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          <div className="mobile-full-controls">
            <button 
              className="player-btn-icon" 
              onClick={() => { playUiSound('click'); skipPrev(); }}
              aria-label="Previous track"
            >
              <SkipBack size={36} color="var(--text-primary)" />
            </button>
            <button 
              className="mobile-full-play-btn" 
              onClick={handlePlayPause}
              aria-label={isPlaying ? "Pause track" : "Play track"}
            >
              {isPlaying ? <Pause size={36} fill="currentColor" /> : <Play size={36} fill="currentColor" style={{ marginLeft: 4 }} />}
            </button>
            <button 
              className="player-btn-icon" 
              onClick={() => { playUiSound('click'); skipNext(); }}
              disabled={queue.length === 0}
              aria-label="Next track"
            >
              <SkipForward size={36} color="var(--text-primary)" />
            </button>
          </div>

          <div className="mobile-full-secondary">
            <button 
              className="player-btn-icon"
              onClick={() => {
                if (!user) { toast.error('Sign in to add to playlists'); return; }
                setPlaylistOpen(true);
              }}
              aria-label="Add to playlist"
            >
              <ListPlus size={24} />
            </button>
            <button 
              className="player-btn-icon"
              onClick={() => { playUiSound('click'); setQueueOpen(true); setIsMobileExpanded(false); }}
              aria-label="Open queue"
            >
              <ListMusic size={24} />
            </button>
          </div>
        </main>
      </div>

      {/* ─── Modals & Drawers ─────────────────────────────────────────────── */}
      <QueueDrawer isOpen={queueOpen} onClose={() => setQueueOpen(false)} />
      
      <AddToPlaylistModal 
        isOpen={playlistOpen} 
        onClose={() => setPlaylistOpen(false)} 
        track={currentTrack} 
      />
      
      <ShareToChatModal
        isOpen={shareOpen}
        onClose={() => setShareOpen(false)}
        track={currentTrack}
      />
    </>
  );
}
