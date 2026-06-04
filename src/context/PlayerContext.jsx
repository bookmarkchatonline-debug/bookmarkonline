// src/context/PlayerContext.jsx
import { createContext, useContext, useRef, useState, useCallback } from 'react';

const PlayerContext = createContext(null);

export function PlayerProvider({ children }) {
  const audioRef    = useRef(new Audio());
  const [currentTrack, setCurrentTrack] = useState(null);
  const [isPlaying,    setIsPlaying]    = useState(false);
  const [progress,     setProgress]     = useState(0);   // 0–100
  const [duration,     setDuration]     = useState(0);
  const [currentTime,  setCurrentTime]  = useState(0);
  const [volume,       setVolume]       = useState(0.8);
  const [queue,        setQueue]        = useState([]);   // upcoming tracks
  const [history,      setHistory]      = useState([]);   // already-played tracks

  // ─── Internal: attach audio listeners ─────────────────────────────────────
  const attachListeners = useCallback((audio, track, queueSnap, historySnap) => {
    audio.ontimeupdate = () => {
      setCurrentTime(audio.currentTime);
      setProgress((audio.currentTime / audio.duration) * 100 || 0);
    };
    audio.ondurationchange = () => setDuration(audio.duration);
    audio.onended = () => {
      setIsPlaying(false);
      setProgress(0);
      setCurrentTime(0);
      // Auto-advance queue
      if (queueSnap.length > 0) {
        const [next, ...rest] = queueSnap;
        setHistory((h) => [...h, track]);
        setQueue(rest);
        _loadAndPlay(audio, next, rest, [...historySnap, track]);
      }
    };
  }, []);

  // ─── Internal: load a track into the audio element ────────────────────────
  const _loadAndPlay = useCallback((audio, track, queueSnap, historySnap) => {
    audio.src = track.audioUrl;
    audio.volume = audio.volume ?? 0.8;
    audio.play().catch(() => {});
    setCurrentTrack(track);
    setIsPlaying(true);
    setProgress(0);
    setCurrentTime(0);
    
    // Save to local storage for History page
    try {
      const stored = JSON.parse(localStorage.getItem('bookmarkchat_listen_history') || '[]');
      const filtered = stored.filter(t => t.id !== track.id);
      filtered.unshift(track);
      localStorage.setItem('bookmarkchat_listen_history', JSON.stringify(filtered.slice(0, 50)));
    } catch (err) {}

    attachListeners(audio, track, queueSnap, historySnap);
  }, [attachListeners]);

  // ─── play ──────────────────────────────────────────────────────────────────
  const play = useCallback((track) => {
    const audio = audioRef.current;
    if (currentTrack?.id === track.id) {
      audio.play().catch(() => {});
      setIsPlaying(true);
      return;
    }
    // Push current into history before switching
    if (currentTrack) {
      setHistory((h) => [...h, currentTrack]);
    }
    setQueue((q) => {
      _loadAndPlay(audio, track, q, history);
      return q;
    });
  }, [currentTrack, history, _loadAndPlay]);

  // ─── pause ─────────────────────────────────────────────────────────────────
  const pause = useCallback(() => {
    audioRef.current.pause();
    setIsPlaying(false);
  }, []);

  // ─── togglePlay ────────────────────────────────────────────────────────────
  const togglePlay = useCallback(() => {
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
  }, [isPlaying]);

  // ─── seek ──────────────────────────────────────────────────────────────────
  const seek = useCallback((pct) => {
    const audio = audioRef.current;
    if (audio.duration) {
      audio.currentTime = (pct / 100) * audio.duration;
    }
  }, []);

  // ─── changeVolume ──────────────────────────────────────────────────────────
  const changeVolume = useCallback((v) => {
    setVolume(v);
    audioRef.current.volume = v;
  }, []);

  // ─── addToQueue ────────────────────────────────────────────────────────────
  const addToQueue = useCallback((track) => {
    setQueue((q) => {
      // Don't add if already in queue or is current track
      if (q.find((t) => t.id === track.id)) return q;
      return [...q, track];
    });
  }, []);

  // ─── removeFromQueue ───────────────────────────────────────────────────────
  const removeFromQueue = useCallback((trackId) => {
    setQueue((q) => q.filter((t) => t.id !== trackId));
  }, []);

  // ─── clearQueue ────────────────────────────────────────────────────────────
  const clearQueue = useCallback(() => {
    setQueue([]);
  }, []);

  // ─── skipNext ──────────────────────────────────────────────────────────────
  const skipNext = useCallback(() => {
    setQueue((q) => {
      if (q.length === 0) return q;
      const [next, ...rest] = q;
      setHistory((h) => (currentTrack ? [...h, currentTrack] : h));
      _loadAndPlay(audioRef.current, next, rest, history);
      return rest;
    });
  }, [currentTrack, history, _loadAndPlay]);

  // ─── skipPrev ──────────────────────────────────────────────────────────────
  const skipPrev = useCallback(() => {
    const audio = audioRef.current;
    // If more than 3 seconds into the track, restart instead of skipping back
    if (audio.currentTime > 3) {
      audio.currentTime = 0;
      return;
    }
    setHistory((h) => {
      if (h.length === 0) return h;
      const prev = h[h.length - 1];
      const newHistory = h.slice(0, -1);
      if (currentTrack) setQueue((q) => [currentTrack, ...q]);
      _loadAndPlay(audio, prev, queue, newHistory);
      return newHistory;
    });
  }, [currentTrack, queue, _loadAndPlay]);

  // ─── playQueue ─────────────────────────────────────────────────────────────
  // Load a list of tracks, start playing at startIndex, rest go into queue
  const playQueue = useCallback((tracks, startIndex = 0) => {
    if (!tracks || tracks.length === 0) return;
    const track = tracks[startIndex];
    const rest  = [...tracks.slice(0, startIndex), ...tracks.slice(startIndex + 1)];
    setHistory([]);
    setQueue(rest);
    _loadAndPlay(audioRef.current, track, rest, []);
  }, [_loadAndPlay]);

  return (
    <PlayerContext.Provider value={{
      currentTrack,
      isPlaying,
      progress,
      duration,
      currentTime,
      volume,
      queue,
      history,
      play,
      pause,
      togglePlay,
      seek,
      changeVolume,
      addToQueue,
      removeFromQueue,
      clearQueue,
      skipNext,
      skipPrev,
      playQueue,
    }}>
      {children}
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error('usePlayer must be used within PlayerProvider');
  return ctx;
}
