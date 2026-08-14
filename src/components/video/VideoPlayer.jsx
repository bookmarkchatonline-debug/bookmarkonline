// src/components/video/VideoPlayer.jsx
import { useRef, useState, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Maximize, 
  Settings, 
  SkipBack, 
  SkipForward,
  Subtitles
} from 'lucide-react';
import '../../styles/videoplayer.css';

export default function VideoPlayer({ 
  videoUrl, 
  thumbnailUrl, 
  captions = [],
  onTimeUpdate,
  onEnded 
}) {
  const videoRef = useRef(null);
  const progressRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showSettings, setShowSettings] = useState(false);
  const [showCaptions, setShowCaptions] = useState(false);
  const [currentCaption, setCurrentCaption] = useState('');
  const controlsTimeoutRef = useRef(null);

  // Format time
  const formatTime = (seconds) => {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Play/Pause
  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  // Volume
  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
      setIsMuted(newVolume === 0);
    }
  };

  // Progress
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
      if (onTimeUpdate) onTimeUpdate(videoRef.current.currentTime);

      // Update captions
      if (showCaptions && captions.length > 0) {
        const current = captions.find(
          (cap) => videoRef.current.currentTime >= cap.start && videoRef.current.currentTime <= cap.end
        );
        setCurrentCaption(current?.text || '');
      }
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const handleProgressClick = (e) => {
    if (videoRef.current && progressRef.current) {
      const rect = progressRef.current.getBoundingClientRect();
      const percent = (e.clientX - rect.left) / rect.width;
      const newTime = percent * duration;
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  // Skip
  const skipBackward = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - 10);
    }
  };

  const skipForward = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.min(duration, videoRef.current.currentTime + 10);
    }
  };

  // Playback speed
  const handlePlaybackRateChange = (rate) => {
    setPlaybackRate(rate);
    if (videoRef.current) {
      videoRef.current.playbackRate = rate;
    }
    setShowSettings(false);
  };

  // Fullscreen
  const toggleFullscreen = () => {
    const container = videoRef.current?.parentElement;
    if (!container) return;

    if (!document.fullscreenElement) {
      container.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch(err => {
        console.error('Error entering fullscreen:', err);
      });
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
      });
    }
  };

  // Auto-hide controls
  const resetControlsTimeout = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    if (isPlaying) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }
  };

  const handleVideoEnded = () => {
    setIsPlaying(false);
    if (onEnded) onEnded();
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === ' ' || e.key === 'k') {
        e.preventDefault();
        togglePlay();
      } else if (e.key === 'ArrowLeft') {
        skipBackward();
      } else if (e.key === 'ArrowRight') {
        skipForward();
      } else if (e.key === 'm') {
        toggleMute();
      } else if (e.key === 'f') {
        toggleFullscreen();
      } else if (e.key === 'c') {
        setShowCaptions(!showCaptions);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isPlaying, isMuted, showCaptions]);

  useEffect(() => {
    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div 
      className="video-player-container" 
      onMouseMove={resetControlsTimeout}
      onMouseLeave={() => isPlaying && setShowControls(false)}
    >
      <video
        ref={videoRef}
        className="video-player"
        src={videoUrl}
        poster={thumbnailUrl}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleVideoEnded}
        onClick={togglePlay}
      />

      {/* Captions */}
      {showCaptions && currentCaption && (
        <div className="video-captions">
          {currentCaption}
        </div>
      )}

      {/* Controls Overlay */}
      <div className={`video-controls-overlay ${showControls ? 'show' : ''}`}>
        {/* Top gradient */}
        <div className="video-gradient-top" />

        {/* Bottom controls */}
        <div className="video-controls">
          {/* Progress bar */}
          <div 
            className="video-progress-bar" 
            ref={progressRef}
            onClick={handleProgressClick}
          >
            <div 
              className="video-progress-filled"
              style={{ width: `${(currentTime / duration) * 100}%` }}
            />
          </div>

          {/* Control buttons */}
          <div className="video-controls-row">
            <div className="video-controls-left">
              <button className="video-control-btn" onClick={togglePlay}>
                {isPlaying ? <Pause size={20} /> : <Play size={20} />}
              </button>
              <button className="video-control-btn" onClick={skipBackward}>
                <SkipBack size={18} />
              </button>
              <button className="video-control-btn" onClick={skipForward}>
                <SkipForward size={18} />
              </button>
              
              <div className="video-volume-control">
                <button className="video-control-btn" onClick={toggleMute}>
                  {isMuted || volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="video-volume-slider"
                />
              </div>

              <div className="video-time">
                {formatTime(currentTime)} / {formatTime(duration)}
              </div>
            </div>

            <div className="video-controls-right">
              {captions.length > 0 && (
                <button 
                  className={`video-control-btn ${showCaptions ? 'active' : ''}`}
                  onClick={() => setShowCaptions(!showCaptions)}
                  title="Toggle Captions"
                >
                  <Subtitles size={18} />
                </button>
              )}
              
              <div className="video-settings-menu">
                <button 
                  className="video-control-btn"
                  onClick={() => setShowSettings(!showSettings)}
                >
                  <Settings size={18} />
                </button>
                {showSettings && (
                  <div className="video-settings-dropdown">
                    <div className="video-settings-title">Playback Speed</div>
                    {[0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2].map((rate) => (
                      <button
                        key={rate}
                        className={`video-settings-option ${playbackRate === rate ? 'active' : ''}`}
                        onClick={() => handlePlaybackRateChange(rate)}
                      >
                        {rate}x {rate === 1 && '(Normal)'}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button className="video-control-btn" onClick={toggleFullscreen}>
                <Maximize size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Play button overlay for initial state */}
      {!isPlaying && currentTime === 0 && (
        <div className="video-play-overlay" onClick={togglePlay}>
          <div className="video-play-button">
            <Play size={48} fill="white" />
          </div>
        </div>
      )}
    </div>
  );
}
