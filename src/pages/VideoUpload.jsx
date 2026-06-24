// src/pages/VideoUpload.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, Video, Image, X, Plus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getUserProfile } from '../firebase/firestore';
import { addVideo } from '../firebase/videos';
import { uploadToCloudinary } from '../cloudinary/upload';
import toast from 'react-hot-toast';
import '../styles/videoupload.css';

export default function VideoUpload() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [videoFile, setVideoFile] = useState(null);
  const [videoPreview, setVideoPreview] = useState(null);
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    tags: [],
  });
  const [tagInput, setTagInput] = useState('');
  const [captions, setCaptions] = useState([]);
  const [captionInput, setCaptionInput] = useState({ start: '', end: '', text: '' });

  const handleVideoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('video/')) {
      toast.error('Please select a video file');
      return;
    }

    // Validate file size (max 100MB)
    if (file.size > 100 * 1024 * 1024) {
      toast.error('Video file too large (max 100MB)');
      return;
    }

    setVideoFile(file);
    const url = URL.createObjectURL(file);
    setVideoPreview(url);
  };

  const handleThumbnailChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    setThumbnailFile(file);
    const url = URL.createObjectURL(file);
    setThumbnailPreview(url);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };


  const handleAddTag = (e) => {
    e.preventDefault();
    const tag = tagInput.trim().toLowerCase().replace(/\s+/g, '-');
    if (tag && !formData.tags.includes(tag)) {
      setFormData(prev => ({ ...prev, tags: [...prev.tags, tag] }));
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleAddCaption = (e) => {
    e.preventDefault();
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

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!user) {
      toast.error('Please login to upload videos');
      navigate('/login');
      return;
    }

    if (!videoFile) {
      toast.error('Please select a video file');
      return;
    }

    if (!formData.title.trim()) {
      toast.error('Please enter a title');
      return;
    }

    setUploading(true);
    const toastId = toast.loading('Uploading video...');

    try {
      // Upload video to Cloudinary
      const videoUrl = await uploadToCloudinary(videoFile, 'video');
      
      // Upload thumbnail if provided
      let thumbnailUrl = null;
      if (thumbnailFile) {
        thumbnailUrl = await uploadToCloudinary(thumbnailFile, 'image');
      }

      // Get user profile
      const profile = await getUserProfile(user.uid);

      // Create video document
      const videoData = {
        uid: user.uid,
        username: profile?.username || 'Anonymous',
        avatarUrl: profile?.avatarUrl || null,
        title: formData.title.trim(),
        description: formData.description.trim(),
        videoUrl,
        thumbnailUrl,
        tags: formData.tags,
        captions: captions.sort((a, b) => a.start - b.start),
        duration: 0, // You can add video duration extraction
      };

      const videoId = await addVideo(videoData);
      toast.success('Video uploaded successfully!', { id: toastId });
      navigate(`/video/${videoId}`);
    } catch (err) {
      console.error('Failed to upload video:', err);
      toast.error('Failed to upload video', { id: toastId });
    } finally {
      setUploading(false);
    }
  };


  return (
    <div className="video-upload-page">
      <div className="video-upload-container">
        <h1>Upload Video</h1>
        <p className="video-upload-subtitle">Share your video content with the community</p>

        <form onSubmit={handleSubmit} className="video-upload-form">
          {/* Video Upload */}
          <div className="video-upload-section">
            <label className="video-upload-label">Video File *</label>
            {!videoPreview ? (
              <label className="video-upload-dropzone">
                <input
                  type="file"
                  accept="video/*"
                  onChange={handleVideoChange}
                  className="video-upload-input"
                />
                <Video size={48} />
                <p>Click to upload or drag and drop</p>
                <span>MP4, WebM, or MOV (max 100MB)</span>
              </label>
            ) : (
              <div className="video-preview-container">
                <video src={videoPreview} controls className="video-preview" />
                <button
                  type="button"
                  className="video-preview-remove"
                  onClick={() => {
                    setVideoFile(null);
                    setVideoPreview(null);
                  }}
                >
                  <X size={18} />
                </button>
              </div>
            )}
          </div>

          {/* Thumbnail Upload */}
          <div className="video-upload-section">
            <label className="video-upload-label">Thumbnail (Optional)</label>
            {!thumbnailPreview ? (
              <label className="video-upload-dropzone thumbnail">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleThumbnailChange}
                  className="video-upload-input"
                />
                <Image size={32} />
                <p>Upload thumbnail</p>
                <span>JPG, PNG, or GIF (recommended: 1280x720)</span>
              </label>
            ) : (
              <div className="thumbnail-preview-container">
                <img src={thumbnailPreview} alt="Thumbnail" className="thumbnail-preview" />
                <button
                  type="button"
                  className="video-preview-remove"
                  onClick={() => {
                    setThumbnailFile(null);
                    setThumbnailPreview(null);
                  }}
                >
                  <X size={18} />
                </button>
              </div>
            )}
          </div>

          {/* Title */}
          <div className="video-upload-section">
            <label className="video-upload-label" htmlFor="title">Title *</label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              placeholder="Enter video title..."
              className="video-upload-text-input"
              required
            />
          </div>

          {/* Description */}
          <div className="video-upload-section">
            <label className="video-upload-label" htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Describe your video..."
              className="video-upload-textarea"
              rows={5}
            />
          </div>


          {/* Tags */}
          <div className="video-upload-section">
            <label className="video-upload-label">Tags</label>
            <div className="video-tags-container">
              {formData.tags.map((tag) => (
                <div key={tag} className="video-tag">
                  #{tag}
                  <button type="button" onClick={() => handleRemoveTag(tag)}>
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
            <div className="video-tag-input-wrap">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                placeholder="Add a tag..."
                className="video-upload-text-input"
              />
              <button type="button" onClick={handleAddTag} className="btn-secondary">
                <Plus size={18} />
              </button>
            </div>
          </div>

          {/* Captions/Subtitles */}
          <div className="video-upload-section">
            <label className="video-upload-label">Captions/Subtitles (Optional)</label>
            <p className="video-upload-helper">Add timed captions for your video</p>
            
            <div className="caption-list">
              {captions.map((caption, index) => (
                <div key={index} className="caption-item">
                  <span className="caption-time">{caption.start}s - {caption.end}s:</span>
                  <span className="caption-text">{caption.text}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveCaption(index)}
                    className="caption-remove"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>

            <div className="caption-input-form">
              <input
                type="number"
                step="0.1"
                value={captionInput.start}
                onChange={(e) => setCaptionInput(prev => ({ ...prev, start: e.target.value }))}
                placeholder="Start (s)"
                className="caption-time-input"
              />
              <input
                type="number"
                step="0.1"
                value={captionInput.end}
                onChange={(e) => setCaptionInput(prev => ({ ...prev, end: e.target.value }))}
                placeholder="End (s)"
                className="caption-time-input"
              />
              <input
                type="text"
                value={captionInput.text}
                onChange={(e) => setCaptionInput(prev => ({ ...prev, text: e.target.value }))}
                placeholder="Caption text"
                className="caption-text-input"
              />
              <button type="button" onClick={handleAddCaption} className="btn-secondary">
                <Plus size={18} />
              </button>
            </div>
          </div>

          {/* Submit */}
          <div className="video-upload-actions">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="btn-secondary"
              disabled={uploading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={uploading || !videoFile || !formData.title.trim()}
            >
              {uploading ? 'Uploading...' : 'Upload Video'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
