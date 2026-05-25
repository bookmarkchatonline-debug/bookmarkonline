// src/components/upload/AudioDropzone.jsx
import { useState, useRef, useCallback } from 'react';
import { Music, Upload, CheckCircle, AlertCircle, X } from 'lucide-react';
import { validateAudioDuration } from '../../cloudinary/upload';

const ACCEPTED = ['audio/mpeg', 'audio/wav', 'audio/aac', 'audio/mp4', 'audio/ogg', 'audio/webm'];

export default function AudioDropzone({ onFileReady }) {
  const [dragOver, setDragOver] = useState(false);
  const [file, setFile] = useState(null);
  const [duration, setDuration] = useState(null);
  const [error, setError] = useState('');
  const [validating, setValidating] = useState(false);
  const inputRef = useRef();

  const processFile = useCallback(async (f) => {
    setError('');
    setFile(null);
    setDuration(null);

    if (!ACCEPTED.includes(f.type) && !f.name.match(/\.(mp3|wav|aac|m4a|ogg)$/i)) {
      setError('Please upload an MP3, WAV, AAC, or OGG file.');
      return;
    }

    setValidating(true);
    try {
      const dur = await validateAudioDuration(f);
      setFile(f);
      setDuration(dur);
      onFileReady(f, dur);
    } catch (err) {
      setError(err.message);
    } finally {
      setValidating(false);
    }
  }, [onFileReady]);

  const onDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) processFile(f);
  };

  const onInputChange = (e) => {
    const f = e.target.files[0];
    if (f) processFile(f);
  };

  const clear = (e) => {
    e.stopPropagation();
    setFile(null);
    setDuration(null);
    setError('');
    onFileReady(null, null);
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div>
      <div
        className={`dropzone${dragOver ? ' drag-over' : ''}${file ? ' has-file' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        onClick={() => !file && inputRef.current?.click()}
        role="button"
        tabIndex={0}
        aria-label="Upload audio file"
      >
        <input
          ref={inputRef}
          type="file"
          accept=".mp3,.wav,.aac,.m4a,.ogg,audio/*"
          style={{ display: 'none' }}
          onChange={onInputChange}
          id="audio-file-input"
        />

        {validating ? (
          <>
            <div className="dropzone-icon">
              <div className="spinner" />
            </div>
            <div className="dropzone-title">Validating audio...</div>
          </>
        ) : file ? (
          <>
            <div className="dropzone-icon" style={{ background: 'rgba(34,197,94,0.15)' }}>
              <CheckCircle size={24} color="var(--success)" />
            </div>
            <div className="dropzone-file-name">{file.name}</div>
            <div className="dropzone-duration">
              Duration: {Math.round(duration)}s ✓ (15–30s max)
            </div>
            <button
              className="dropzone-btn"
              onClick={clear}
              style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <X size={12} /> Remove
            </button>
          </>
        ) : (
          <>
            <div className="dropzone-icon">
              <Music size={24} />
            </div>
            <div className="dropzone-title">Drag &amp; Drop Audio</div>
            <div className="dropzone-subtitle">MP3, WAV or AAC · 15–30 seconds max</div>
            <button className="dropzone-btn" onClick={(e) => { e.stopPropagation(); inputRef.current?.click(); }}>
              <Upload size={13} style={{ display: 'inline', marginRight: 5 }} />
              Select File
            </button>
          </>
        )}
      </div>

      {error && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          marginTop: 10,
          padding: '10px 14px',
          background: 'rgba(239,68,68,0.08)',
          border: '1px solid rgba(239,68,68,0.2)',
          borderRadius: 'var(--radius-sm)',
          color: 'var(--error)',
          fontSize: '0.8125rem',
        }}>
          <AlertCircle size={15} />
          {error}
        </div>
      )}
    </div>
  );
}
