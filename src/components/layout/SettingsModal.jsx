// src/components/layout/SettingsModal.jsx
import { X, Volume2, Bell } from 'lucide-react';
import { useSettings } from '../../context/SettingsContext';
import { useEffect, useRef } from 'react';

export default function SettingsModal({ isOpen, onClose }) {
  const { uiSoundsEnabled, setUiSoundsEnabled, uiSoundVolume, setUiSoundVolume, playUiSound } = useSettings();
  const modalRef = useRef(null);

  useEffect(() => {
    if (isOpen && modalRef.current) {
      modalRef.current.focus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 1000 }}>
      <div 
        className="modal-content animate-scale-in" 
        onClick={e => e.stopPropagation()}
        style={{ maxWidth: '400px', width: '90%' }}
        role="dialog"
        aria-modal="true"
        aria-label="Settings"
        tabIndex="-1"
        ref={modalRef}
      >
        <div className="modal-header">
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>App Settings</h2>
          <button className="btn-icon" onClick={onClose} aria-label="Close Settings">
            <X size={20} />
          </button>
        </div>

        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          <div className="settings-section">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <Bell size={18} color="var(--accent)" />
              <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>UI Sounds</h3>
            </div>
            
            <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', marginBottom: '16px' }}>
              <span>Enable button sounds</span>
              <input 
                type="checkbox" 
                checked={uiSoundsEnabled} 
                onChange={(e) => {
                  setUiSoundsEnabled(e.target.checked);
                  if (e.target.checked) playUiSound('pop');
                }}
                style={{ width: '18px', height: '18px', accentColor: 'var(--accent)' }}
              />
            </label>

            <div style={{ opacity: uiSoundsEnabled ? 1 : 0.5, pointerEvents: uiSoundsEnabled ? 'auto' : 'none', transition: 'opacity 0.2s' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.875rem' }}>
                <span>Sound Volume</span>
                <span>{Math.round(uiSoundVolume * 100)}%</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Volume2 size={16} color="var(--text-muted)" />
                <input 
                  type="range" 
                  min="0.1" max="1" step="0.1" 
                  value={uiSoundVolume}
                  onChange={(e) => setUiSoundVolume(parseFloat(e.target.value))}
                  onMouseUp={() => playUiSound('pop')}
                  onTouchEnd={() => playUiSound('pop')}
                  style={{ flex: 1, accentColor: 'var(--accent)' }}
                />
              </div>
            </div>
          </div>
          
        </div>

        <div className="modal-footer" style={{ marginTop: '12px' }}>
          <button className="btn btn-primary" onClick={onClose} style={{ width: '100%' }}>Done</button>
        </div>
      </div>
    </div>
  );
}
