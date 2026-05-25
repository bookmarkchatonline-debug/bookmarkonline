// src/pages/Upload.jsx
import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Image, Globe, X, Tag } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { uploadAudio, uploadCoverImage } from '../cloudinary/upload';
import { addTrack } from '../firebase/firestore';
import AudioDropzone from '../components/upload/AudioDropzone';
import toast from 'react-hot-toast';
import '../styles/pages.css';
import '../styles/components.css';

export default function Upload() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState([]);
  const [audioFile, setAudioFile] = useState(null);
  const [audioDuration, setAudioDuration] = useState(null);
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState('');
  const [audioProgress, setAudioProgress] = useState(0);
  const [imageProgress, setImageProgress] = useState(0);
  const [uploading, setUploading] = useState(false);

  // Redirect if not logged in
  if (!user) {
    navigate('/login');
    return null;
  }

  const handleAudioReady = useCallback((file, dur) => {
    setAudioFile(file);
    setAudioDuration(dur);
  }, []);

  const handleCoverChange = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setCoverFile(f);
    const url = URL.createObjectURL(f);
    setCoverPreview(url);
  };

  const handleTagKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ' || e.key === ',') {
      e.preventDefault();
      addTag();
    }
  };

  const addTag = () => {
    const t = tagInput.trim().replace(/^#/, '').toLowerCase();
    if (t && !tags.includes(t) && tags.length < 10) {
      setTags((prev) => [...prev, t]);
    }
    setTagInput('');
  };

  const removeTag = (t) => setTags((prev) => prev.filter((x) => x !== t));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!audioFile) { toast.error('Please select an audio file'); return; }
    if (!title.trim()) { toast.error('Please enter a track title'); return; }

    setUploading(true);
    try {
      // Upload audio
      const { url: audioUrl, duration } = await uploadAudio(audioFile, setAudioProgress);

      // Upload cover if provided
      let coverUrl = null;
      if (coverFile) {
        const res = await uploadCoverImage(coverFile, setImageProgress);
        coverUrl = res.url;
      }

      // Save to Firestore
      const trackId = await addTrack({
        title: title.trim(),
        tags,
        audioUrl,
        coverUrl,
        duration,
        uid: user.uid,
        username: profile?.username || user.displayName || user.email.split('@')[0],
        avatarUrl: profile?.avatarUrl || user.photoURL || null,
      });

      toast.success('🎵 Snippet published!');
      navigate(`/track/${trackId}`);
    } catch (err) {
      toast.error(err.message || 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const totalProgress = audioProgress > 0
    ? coverFile ? Math.round((audioProgress + imageProgress) / 2) : audioProgress
    : 0;

  return (
    <div className="upload-page animate-fade-in">
      <div className="upload-hero">
        <h1>Publish Snippet</h1>
        <p>Share your latest sound bites. Upload short audio clips (15–30s) to the BookmarkChat community.</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="upload-grid">
          {/* Left: form */}
          <div className="upload-form">
            {/* Title */}
            <div className="input-group">
              <label className="input-label" htmlFor="track-title">Track Title *</label>
              <input
                id="track-title"
                type="text"
                className="input"
                placeholder="Enter a catchy name for your snippet..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                maxLength={80}
              />
            </div>

            {/* Tags */}
            <div className="input-group">
              <label className="input-label" htmlFor="track-tags">Tags</label>
              <div className="input" style={{ display: 'flex', flexWrap: 'wrap', gap: 6, minHeight: 46, alignItems: 'center', cursor: 'text' }}
                onClick={(e) => e.currentTarget.querySelector('input')?.focus()}>
                {tags.map((t) => (
                  <span
                    key={t}
                    className="tag active"
                    style={{ cursor: 'default', display: 'flex', alignItems: 'center', gap: 4 }}
                  >
                    #{t}
                    <button type="button" onClick={() => removeTag(t)} style={{ color: 'inherit', display: 'flex' }}>
                      <X size={10} />
                    </button>
                  </span>
                ))}
                <input
                  id="track-tags"
                  type="text"
                  placeholder={tags.length === 0 ? 'hiphop underground chill (space/enter to add)' : ''}
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleTagKeyDown}
                  onBlur={addTag}
                  style={{ flex: 1, minWidth: 120, background: 'transparent', border: 'none', color: 'var(--text-primary)', fontSize: '0.9375rem' }}
                />
              </div>
            </div>

            {/* Audio dropzone */}
            <div>
              <div className="input-label" style={{ marginBottom: 8 }}>Audio File *</div>
              <AudioDropzone onFileReady={handleAudioReady} />
            </div>

            {/* Public toggle */}
            <div className="publish-toggle-row">
              <div className="publish-toggle-info">
                <div className="publish-toggle-title">
                  <Globe size={14} style={{ display: 'inline', marginRight: 6, verticalAlign: 'middle' }} />
                  Public Immediately
                </div>
                <div className="publish-toggle-sub">Your snippet will be live as soon as you publish.</div>
              </div>
              <label className="toggle">
                <input type="checkbox" checked readOnly />
                <span className="toggle-slider" />
              </label>
            </div>
          </div>

          {/* Right: cover + submit */}
          <div className="upload-right">
            {/* Cover image */}
            <div>
              <div className="input-label" style={{ marginBottom: 8 }}>Cover Image (optional)</div>
              <label htmlFor="cover-input" className="cover-dropzone" style={{ cursor: 'pointer' }}>
                {coverPreview ? (
                  <>
                    <img src={coverPreview} alt="Cover preview" />
                    <div className="cover-dropzone-overlay">
                      <Image size={20} color="#fff" />
                      <span style={{ fontSize: '0.8rem', color: '#fff', fontWeight: 600 }}>Change</span>
                    </div>
                  </>
                ) : (
                  <>
                    <Image size={28} color="var(--text-muted)" />
                    <span className="cover-label">Upload Cover</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>JPG, PNG, WEBP</span>
                  </>
                )}
              </label>
              <input
                id="cover-input"
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleCoverChange}
              />
            </div>

            {/* Upload progress */}
            {uploading && (
              <div className="upload-progress">
                <div className="upload-progress-bar">
                  <div className="upload-progress-fill" style={{ width: `${totalProgress}%` }} />
                </div>
                <div className="upload-progress-text">
                  {totalProgress < 100 ? `Uploading... ${totalProgress}%` : 'Saving track...'}
                </div>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              className="upload-submit"
              disabled={uploading || !audioFile}
              id="publish-btn"
            >
              {uploading ? (
                <>
                  <div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />
                  Publishing...
                </>
              ) : (
                <>
                  PUBLISH SNIPPET
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
