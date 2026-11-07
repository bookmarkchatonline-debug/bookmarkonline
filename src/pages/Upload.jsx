import { useState, useCallback, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowRight, Image, Globe, X, Video, Music, Plus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { uploadAudio, uploadCoverImage, uploadToCloudinary } from '../cloudinary/upload';
import { addTrack, getUserTracks, getUserProfile } from '../firebase/firestore';
import { addVideo, getUserVideos } from '../firebase/videos';
import AudioDropzone from '../components/upload/AudioDropzone';
import toast from 'react-hot-toast';
import '../styles/upload.css';

export default function Upload() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // If navigating from somewhere else asking for video, default to video
  const initialType = location.pathname === '/video-upload' ? 'video' : 'audio';

  const [uploadType, setUploadType] = useState(initialType); // 'audio' or 'video'
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState([]);
  
  // Audio specific
  const [audioFile, setAudioFile] = useState(null);
  const [audioDuration, setAudioDuration] = useState(null);
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState('');
  
  // Video specific
  const [videoFile, setVideoFile] = useState(null);
  const [videoPreview, setVideoPreview] = useState(null);
  const [captions, setCaptions] = useState([]);
  const [captionInput, setCaptionInput] = useState({ start: '', end: '', text: '' });

  // Progress & State
  const [audioProgress, setAudioProgress] = useState(0);
  const [imageProgress, setImageProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  
  // Limits
  const [trackCount, setTrackCount] = useState(0);
  const [loadingCount, setLoadingCount] = useState(true);

  const userPlan = profile?.plan || 'free';
  const isFreePlan = userPlan === 'free';
  const isCreatorPro = userPlan === 'creator_pro';
  
  const songLimit = isFreePlan ? 3 : isCreatorPro ? 10 : null; // null = unlimited
  const remainingUploads = songLimit !== null ? Math.max(0, songLimit - trackCount) : null;
  const isLimitReached = songLimit !== null && trackCount >= songLimit;

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    let active = true;
    Promise.all([
      getUserTracks(user.uid),
      getUserVideos(user.uid)
    ])
      .then(([tracks]) => {
        if (active) {
          setTrackCount(tracks.length);
          // Video limit isn't tracked currently in the same way, but could be added
          setLoadingCount(false);
        }
      })
      .catch(() => {
        if (active) setLoadingCount(false);
      });
    return () => { active = false; };
  }, [user, navigate]);

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleAudioReady = useCallback((file, dur) => {
    setAudioFile(file);
    setAudioDuration(dur);
  }, []);

  const handleVideoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('video/')) {
      toast.error('Please select a video file');
      return;
    }
    if (file.size > 100 * 1024 * 1024) {
      toast.error('Video file too large (max 100MB)');
      return;
    }
    setVideoFile(file);
    const url = URL.createObjectURL(file);
    setVideoPreview(url);
  };

  const handleCoverChange = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    if (!f.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }
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

  // Video Captions Handlers
  const handleAddCaption = () => {
    if (!captionInput.start || !captionInput.end || !captionInput.text.trim()) {
      toast.error('Please fill all caption fields');
      return;
    }
    const start = parseFloat(captionInput.start);
    const end = parseFloat(captionInput.end);
    if (isNaN(start) || isNaN(end) || start >= end) {
      toast.error('Invalid caption times');
      return;
    }
    setCaptions(prev => [...prev, { start, end, text: captionInput.text }]);
    setCaptionInput({ start: '', end: '', text: '' });
  };

  const handleRemoveCaption = (index) => {
    setCaptions(prev => prev.filter((_, i) => i !== index));
  };

  // ── Submit ───────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (uploadType === 'audio') {
      if (!audioFile) { toast.error('Please select an audio file'); return; }
      if (!title.trim()) { toast.error('Please enter a track title'); return; }
      if (isLimitReached) {
        if (isFreePlan) toast.error('Free plan limit reached (3 songs). Upgrade to upload more.');
        else if (isCreatorPro) toast.error('Creator Pro plan limit reached (10 songs). Upgrade to Gold Creator for unlimited uploads.');
        else toast.error('Upload limit reached. Upgrade your plan to upload more songs.');
        return;
      }
    } else {
      if (!videoFile) { toast.error('Please select a video file'); return; }
      if (!title.trim()) { toast.error('Please enter a video title'); return; }
    }

    setUploading(true);
    const toastId = toast.loading(uploadType === 'audio' ? 'Uploading track...' : 'Uploading video...');

    try {
      if (uploadType === 'audio') {
        const { url: audioUrl, duration } = await uploadAudio(audioFile, setAudioProgress);
        let coverUrl = null;
        if (coverFile) {
          const res = await uploadCoverImage(coverFile, setImageProgress);
          coverUrl = res.url;
        }

        const trackId = await addTrack({
          title: title.trim(),
          tags,
          audioUrl,
          coverUrl,
          duration: duration || audioDuration || 0,
          uid: user.uid,
          username: profile?.username || user.displayName || user.email.split('@')[0],
          avatarUrl: profile?.avatarUrl || user.photoURL || null,
        });

        toast.success('🎵 Track published successfully!', { id: toastId });
        setTrackCount((prev) => prev + 1);
        navigate(`/track/${trackId}`);
        
      } else {
        const videoUrl = await uploadToCloudinary(videoFile, 'video', setAudioProgress);
        let thumbnailUrl = null;
        if (coverFile) {
          thumbnailUrl = await uploadToCloudinary(coverFile, 'image', setImageProgress);
        }

        const userProfile = await getUserProfile(user.uid);
        const videoData = {
          uid: user.uid,
          username: userProfile?.username || user.displayName || user.email.split('@')[0],
          avatarUrl: userProfile?.avatarUrl || user.photoURL || null,
          title: title.trim(),
          description: description.trim(),
          videoUrl,
          thumbnailUrl,
          tags,
          captions: captions.sort((a, b) => a.start - b.start),
          duration: 0,
        };

        const videoId = await addVideo(videoData);
        toast.success('🎬 Video published successfully!', { id: toastId });
        navigate(`/video/${videoId}`);
      }
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Upload failed. Please try again.', { id: toastId });
    } finally {
      setUploading(false);
      setAudioProgress(0);
      setImageProgress(0);
    }
  };

  const totalProgress = audioProgress > 0
    ? coverFile ? Math.round((audioProgress + imageProgress) / 2) : audioProgress
    : 0;

  if (!user) return null;

  return (
    <div className="creator-studio-wrapper animate-fade-in">
      
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="creator-studio-header">
        <h1 className="creator-studio-title">Creator Studio</h1>
        <p className="creator-studio-desc">Publish your latest tracks and videos to the community.</p>

        {uploadType === 'audio' && (
          <div className="creator-plan-banner">
            <div className="creator-plan-info">
              <div className="creator-plan-title">
                {isFreePlan ? 'Free Artist Plan' : isCreatorPro ? 'Creator Pro Plan' : 'Gold Creator Plan'}
              </div>
              <div className="creator-plan-sub">
                {loadingCount
                  ? 'Checking your upload slots...'
                  : songLimit !== null
                  ? `${remainingUploads} of ${songLimit} song uploads remaining`
                  : 'Unlimited song uploads and creator tools'}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              {remainingUploads === 0 && (
                <button type="button" className="btn btn-outline" onClick={() => navigate('/profile')}>
                  Manage Uploads
                </button>
              )}
              {(isFreePlan || (isCreatorPro && remainingUploads === 0)) && (
                <button type="button" className="btn btn-primary" onClick={() => navigate('/upgrade')}>
                  Upgrade Plan
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Type Selector ───────────────────────────────────────────────── */}
      <div className="upload-type-selector">
        <button 
          type="button" 
          className={`upload-type-btn ${uploadType === 'audio' ? 'active' : ''}`}
          onClick={() => setUploadType('audio')}
        >
          <Music className="upload-type-icon" size={32} />
          <div>
            <div className="upload-type-name">Music Snippet</div>
            <div className="upload-type-desc">Upload 15-30s audio clips</div>
          </div>
        </button>
        <button 
          type="button" 
          className={`upload-type-btn ${uploadType === 'video' ? 'active' : ''}`}
          onClick={() => setUploadType('video')}
        >
          <Video className="upload-type-icon" size={32} />
          <div>
            <div className="upload-type-name">Music Video</div>
            <div className="upload-type-desc">Upload full performances</div>
          </div>
        </button>
      </div>

      {/* ── Form ────────────────────────────────────────────────────────── */}
      <div className="upload-form-card">
        <form onSubmit={handleSubmit}>
          <div className="upload-form-grid">
            
            {/* Left Column: Media & Details */}
            <div className="upload-left-col">
              
              {/* Media Dropzone */}
              <div className="upload-input-group">
                <label className="upload-label">
                  {uploadType === 'audio' ? 'Audio File *' : 'Video File *'}
                </label>
                
                {uploadType === 'audio' ? (
                  <AudioDropzone onFileReady={handleAudioReady} />
                ) : (
                  <>
                    {!videoPreview ? (
                      <label className="upload-dropzone">
                        <input
                          type="file"
                          accept="video/*"
                          onChange={handleVideoChange}
                          style={{ display: 'none' }}
                        />
                        <Video className="upload-dropzone-icon" size={40} />
                        <div>
                          <div className="upload-dropzone-title">Click to upload video</div>
                          <div className="upload-dropzone-sub">MP4, WebM, or MOV (max 100MB)</div>
                        </div>
                      </label>
                    ) : (
                      <div className="upload-dropzone" style={{ border: 'none' }}>
                        <video src={videoPreview} controls className="upload-preview-media" />
                        <button
                          type="button"
                          className="btn-icon"
                          style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,0.5)' }}
                          onClick={() => { setVideoFile(null); setVideoPreview(null); }}
                        >
                          <X size={20} color="#fff" />
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Title */}
              <div className="upload-input-group">
                <label className="upload-label" htmlFor="title">Title *</label>
                <input
                  id="title"
                  type="text"
                  className="input"
                  placeholder={uploadType === 'audio' ? "Enter a catchy name for your snippet..." : "Enter video title..."}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  maxLength={80}
                />
              </div>

              {/* Description (Video only) */}
              {uploadType === 'video' && (
                <div className="upload-input-group">
                  <label className="upload-label" htmlFor="description">Description</label>
                  <textarea
                    id="description"
                    className="input"
                    rows={4}
                    placeholder="Describe your video..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>
              )}

              {/* Tags */}
              <div className="upload-input-group">
                <label className="upload-label">Tags</label>
                <div className="input" style={{ display: 'flex', flexWrap: 'wrap', gap: 8, minHeight: '48px', alignItems: 'center' }}>
                  {tags.map((t) => (
                    <span key={t} className="tag active" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      #{t}
                      <button type="button" className="btn-icon" style={{ padding: 0, width: 16, height: 16 }} onClick={() => removeTag(t)}>
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                  <input
                    type="text"
                    placeholder={tags.length === 0 ? "hiphop underground (space/enter to add)" : ""}
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleTagKeyDown}
                    onBlur={addTag}
                    style={{ flex: 1, minWidth: 150, background: 'transparent', border: 'none', color: 'var(--text-primary)', outline: 'none' }}
                  />
                </div>
              </div>

              {/* Captions (Video only) */}
              {uploadType === 'video' && (
                <div className="upload-input-group">
                  <label className="upload-label">Captions (Optional)</label>
                  
                  {captions.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
                      {captions.map((cap, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'var(--bg-elevated)', padding: '8px 12px', borderRadius: 'var(--radius-md)' }}>
                          <span style={{ fontSize: '0.875rem', color: 'var(--accent)', fontWeight: 600, minWidth: '80px' }}>
                            {cap.start}s - {cap.end}s
                          </span>
                          <span style={{ fontSize: '0.875rem', flex: 1 }}>{cap.text}</span>
                          <button type="button" className="btn-icon" onClick={() => handleRemoveCaption(i)}>
                            <X size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input type="number" step="0.1" placeholder="Start (s)" className="input" style={{ width: '80px' }} value={captionInput.start} onChange={e => setCaptionInput({...captionInput, start: e.target.value})} />
                    <input type="number" step="0.1" placeholder="End (s)" className="input" style={{ width: '80px' }} value={captionInput.end} onChange={e => setCaptionInput({...captionInput, end: e.target.value})} />
                    <input type="text" placeholder="Caption text" className="input" style={{ flex: 1 }} value={captionInput.text} onChange={e => setCaptionInput({...captionInput, text: e.target.value})} />
                    <button type="button" className="btn btn-outline" style={{ padding: '0 12px' }} onClick={handleAddCaption}>
                      <Plus size={18} />
                    </button>
                  </div>
                </div>
              )}

            </div>

            {/* Right Column: Artwork & Settings */}
            <div className="upload-right-col">
              
              <div className="upload-input-group">
                <label className="upload-label">
                  {uploadType === 'audio' ? 'Cover Artwork (Optional)' : 'Thumbnail (Optional)'}
                </label>
                
                <label className="upload-dropzone" style={{ height: 280, padding: 0 }}>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleCoverChange}
                    style={{ display: 'none' }}
                  />
                  {coverPreview ? (
                    <>
                      <img src={coverPreview} alt="Artwork" className="upload-preview-media" />
                      <div className="upload-preview-overlay">
                        <Image size={24} color="#fff" />
                        <span style={{ color: '#fff', fontWeight: 600, fontSize: '0.875rem' }}>Change Image</span>
                      </div>
                    </>
                  ) : (
                    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <Image className="upload-dropzone-icon" size={40} style={{ marginBottom: 12 }} />
                      <div className="upload-dropzone-title">Upload {uploadType === 'audio' ? 'Cover' : 'Thumbnail'}</div>
                      <div className="upload-dropzone-sub">JPG, PNG, WEBP<br/>(1:1 ratio recommended)</div>
                    </div>
                  )}
                </label>
              </div>

              {/* Visibility Settings */}
              <div className="upload-input-group" style={{ background: 'var(--bg-elevated)', padding: '16px', borderRadius: 'var(--radius-md)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Globe size={16} /> Public Immediately
                    </div>
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                      Live instantly after publishing.
                    </div>
                  </div>
                  <label className="toggle">
                    <input type="checkbox" checked readOnly />
                    <span className="toggle-slider" />
                  </label>
                </div>
              </div>

              {/* Progress */}
              {uploading && (
                <div className="upload-progress-container">
                  <div className="upload-progress-bar-bg">
                    <div className="upload-progress-fill" style={{ width: `${totalProgress}%` }} />
                  </div>
                  <div className="upload-progress-text">
                    <span>{totalProgress < 100 ? 'Uploading...' : 'Processing...'}</span>
                    <span>{totalProgress}%</span>
                  </div>
                </div>
              )}

            </div>
          </div>

          <div className="upload-actions">
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => navigate(-1)}
              disabled={uploading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={uploading || (uploadType === 'audio' ? !audioFile : !videoFile)}
              style={{ minWidth: '160px' }}
            >
              {uploading ? (
                <>
                  <div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />
                  Publishing...
                </>
              ) : (
                <>
                  Publish {uploadType === 'audio' ? 'Snippet' : 'Video'}
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
