import { useEffect, useState } from 'react';
import VideoFeedItem from '../components/video/VideoFeedItem';
import { getNewestVideos } from '../firebase/videos';
import toast from 'react-hot-toast';
import '../styles/videofeed.css';

export default function Reels() {
  const [reels, setReels] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReels();
  }, []);

  const loadReels = async () => {
    try {
      setLoading(true);
      // Fetch newest videos and filter on client to only keep isReel === true.
      // In a production app, we would query explicitly if composite indexes were available,
      // but this avoids creating new indexes while safely filtering.
      // We fetch a larger limit to ensure we hit enough reels.
      const data = await getNewestVideos(100); 
      const onlyReels = data.filter(v => v.isReel === true);
      setReels(onlyReels);
    } catch (err) {
      console.error('Failed to load reels:', err);
      toast.error('Failed to load reels');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="videos-immersive-page">
      {/* Floating Header Area */}
      <div className="videos-immersive-header">
        <div className="videos-immersive-tabs">
          <button className="videos-tab active">
            <span>For You</span>
          </button>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="videos-loading-overlay">
          <div className="spinner" />
        </div>
      )}

      {/* Vertical Feed */}
      {!loading && (
        <div className="video-feed-container">
          {reels.length === 0 ? (
            <div className="videos-empty">
              <p>No Reels yet. Be the first to upload one!</p>
            </div>
          ) : (
            reels.map(reel => (
              <VideoFeedItem key={reel.id} video={reel} />
            ))
          )}
        </div>
      )}
    </div>
  );
}
