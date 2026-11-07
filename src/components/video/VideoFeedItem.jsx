import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Pause, Heart, MessageCircle, Share2, Volume2, VolumeX, Music } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { toggleVideoLike, hasLikedVideo } from '../../firebase/videos';
import toast from 'react-hot-toast';
import ShareToChatModal from '../track/ShareToChatModal';
import VideoCommentsDrawer from './VideoCommentsDrawer';
import '../../styles/videofeed.css';

function formatViews(views) {
  if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M`;
  if (views >= 1000) return `${(views / 1000).toFixed(1)}K`;
  return views || 0;
}

export default function VideoFeedItem({ video }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(video.likes || 0);
  const [commentCount, setCommentCount] = useState(video.commentCount || 0);
  
  const [shareOpen, setShareOpen] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [showDescription, setShowDescription] = useState(false);

  // Check initial like status
  useEffect(() => {
    if (user && video.id) {
      hasLikedVideo(user.uid, video.id).then(setLiked).catch(console.error);
    }
  }, [user, video.id]);

  // Handle intersection observer playback
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Attempt to play
            if (videoRef.current) {
              videoRef.current.play().then(() => {
                setIsPlaying(true);
              }).catch(err => {
                console.warn('Autoplay failed:', err);
                setIsPlaying(false);
              });
            }
          } else {
            // Pause
            if (videoRef.current) {
              videoRef.current.pause();
              videoRef.current.currentTime = 0; // Optional: reset when scrolling away
              setIsPlaying(false);
            }
          }
        });
      },
      { threshold: 0.6 } // Needs to be 60% visible to play
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      if (containerRef.current) {
        observer.unobserve(containerRef.current);
      }
    };
  }, []);

  const togglePlay = (e) => {
    e.stopPropagation();
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        videoRef.current.play().then(() => setIsPlaying(true)).catch(console.error);
      }
    }
  };

  const toggleMute = (e) => {
    e.stopPropagation();
    setIsMuted(!isMuted);
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
    }
  };

  const handleLike = async (e) => {
    e.stopPropagation();
    if (!user) {
      toast.error('Sign in to like videos');
      return;
    }
    try {
      const newLiked = await toggleVideoLike(user.uid, video.id);
      setLiked(newLiked);
      setLikeCount(prev => newLiked ? prev + 1 : prev - 1);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="video-feed-item" ref={containerRef}>
      {/* Video Player */}
      <video
        ref={videoRef}
        src={video.videoUrl}
        poster={video.thumbnailUrl}
        className="video-feed-player"
        loop
        playsInline
        muted={isMuted}
        onClick={togglePlay}
      />

      {/* Play/Pause Overlay Indicator */}
      {!isPlaying && (
        <div className="video-feed-play-overlay" onClick={togglePlay}>
          <div className="video-feed-play-icon">
            <Play size={48} fill="white" />
          </div>
        </div>
      )}

      {/* Overlay UI */}
      <div className="video-feed-overlay" onClick={togglePlay}>
        
        {/* Top Controls */}
        <div className="video-feed-top-controls">
          <button className="video-feed-mute-btn" onClick={toggleMute} aria-label={isMuted ? "Unmute" : "Mute"}>
            {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
          </button>
        </div>

        {/* Bottom Area: Info & Actions */}
        <div className="video-feed-bottom">
          
          {/* Left Info Area */}
          <div className="video-feed-info" onClick={e => e.stopPropagation()}>
            <div className="video-feed-creator" onClick={() => navigate(`/profile/${video.uid}`)}>
              <div className="video-feed-avatar">
                {video.avatarUrl ? (
                  <img src={video.avatarUrl} alt={video.username} />
                ) : (
                  <div className="video-feed-avatar-placeholder">
                    {video.username?.charAt(0)?.toUpperCase() || 'A'}
                  </div>
                )}
              </div>
              <span className="video-feed-username">@{video.username?.replace(/\s+/g, '')?.toLowerCase() || 'artist'}</span>
            </div>
            
            <h3 className="video-feed-title" onClick={() => navigate(`/video/${video.id}`)}>
              {video.title}
            </h3>
            
            {video.description && (
              <div className={`video-feed-description ${showDescription ? 'expanded' : ''}`}>
                <span onClick={() => setShowDescription(!showDescription)}>
                  {video.description}
                </span>
              </div>
            )}
            
            {/* Displaying tags if they exist */}
            {video.tags && video.tags.length > 0 && (
              <div className="video-feed-tags">
                {video.tags.map(tag => (
                  <span key={tag}>#{tag}</span>
                ))}
              </div>
            )}
            
            <div className="video-feed-music-tag">
              <Music size={12} />
              <span>Original Audio - {video.username}</span>
            </div>
          </div>

          {/* Right Action Rail */}
          <div className="video-feed-actions" onClick={e => e.stopPropagation()}>
            <button className="video-feed-action-btn" onClick={handleLike} aria-label="Like video">
              <div className="video-feed-icon-wrap">
                <Heart size={28} fill={liked ? 'var(--accent)' : 'rgba(255,255,255,0.9)'} color={liked ? 'var(--accent)' : 'transparent'} />
              </div>
              <span>{formatViews(likeCount)}</span>
            </button>

            <button className="video-feed-action-btn" onClick={() => setCommentsOpen(true)} aria-label="Comment on video">
              <div className="video-feed-icon-wrap">
                <MessageCircle size={28} fill="rgba(255,255,255,0.9)" color="transparent" />
              </div>
              <span>{formatViews(commentCount)}</span>
            </button>

            <button className="video-feed-action-btn" onClick={() => setShareOpen(true)} aria-label="Share video">
              <div className="video-feed-icon-wrap">
                <Share2 size={28} fill="rgba(255,255,255,0.9)" color="transparent" />
              </div>
              <span>Share</span>
            </button>
          </div>
        </div>
      </div>

      {/* Modals/Drawers */}
      <VideoCommentsDrawer 
        isOpen={commentsOpen} 
        onClose={() => setCommentsOpen(false)} 
        videoId={video.id}
        onCommentAdded={() => setCommentCount(prev => prev + 1)}
      />

      <ShareToChatModal 
        isOpen={shareOpen} 
        onClose={() => setShareOpen(false)} 
        track={{...video, isVideo: true}} 
      />
    </div>
  );
}
