// src/context/SettingsContext.jsx
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';

const SettingsContext = createContext();

export function useSettings() {
  return useContext(SettingsContext);
}

export function SettingsProvider({ children }) {
  const [uiSoundsEnabled, setUiSoundsEnabled] = useState(() => {
    const saved = localStorage.getItem('uiSoundsEnabled');
    return saved !== null ? JSON.parse(saved) : true;
  });

  const [uiSoundVolume, setUiSoundVolume] = useState(() => {
    const saved = localStorage.getItem('uiSoundVolume');
    return saved !== null ? parseFloat(saved) : 0.5;
  });

  const audioCtxRef = useRef(null);

  useEffect(() => {
    localStorage.setItem('uiSoundsEnabled', JSON.stringify(uiSoundsEnabled));
  }, [uiSoundsEnabled]);

  useEffect(() => {
    localStorage.setItem('uiSoundVolume', uiSoundVolume.toString());
  }, [uiSoundVolume]);

  const initAudioCtx = () => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
  };

  const playUiSound = useCallback((type = 'click') => {
    if (!uiSoundsEnabled) return;
    try {
      initAudioCtx();
      const ctx = audioCtxRef.current;
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc.connect(gainNode);
      gainNode.connect(ctx.destination);

      if (type === 'click') {
        // A short, satisfying click/pop sound
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.05);
        
        gainNode.gain.setValueAtTime(uiSoundVolume, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);

        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.05);
      } else if (type === 'pop') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(400, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(800, ctx.currentTime + 0.05);

        gainNode.gain.setValueAtTime(uiSoundVolume * 0.5, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);

        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.1);
      }
    } catch (err) {
      console.warn('UI sound failed', err);
    }
  }, [uiSoundsEnabled, uiSoundVolume]);

  const value = {
    uiSoundsEnabled,
    setUiSoundsEnabled,
    uiSoundVolume,
    setUiSoundVolume,
    playUiSound,
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}
