// src/components/track/LikeButton.jsx
import { useState, useEffect, useCallback } from 'react';
import { Heart } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { toggleLike, hasLiked } from '../../firebase/firestore';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function LikeButton({ trackId, initialLikes = 0, size = 'sm' }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [liked, setLiked] = useState(false);
  const [likes, setLikes] = useState(initialLikes);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user && trackId) {
      hasLiked(user.uid, trackId).then(setLiked);
    }
  }, [user, trackId]);

  // Sync likes with prop changes
  useEffect(() => {
    setLikes(initialLikes);
  }, [initialLikes]);

  const handleLike = useCallback(async (e) => {
    e.stopPropagation();
    if (!user) {
      toast.error('Sign in to like tracks');
      navigate('/login');
      return;
    }
    if (loading) return;
    setLoading(true);
    try {
      const newState = await toggleLike(user.uid, trackId);
      setLiked(newState);
      setLikes((prev) => (newState ? prev + 1 : prev - 1));
    } catch {
      toast.error('Failed to update like');
    } finally {
      setLoading(false);
    }
  }, [user, trackId, loading, navigate]);

  return (
    <button
      className={`like-btn${liked ? ' liked' : ''}`}
      onClick={handleLike}
      disabled={loading}
      aria-label={liked ? 'Unlike' : 'Like'}
      id={`like-btn-${trackId}`}
    >
      <Heart
        className="like-icon"
        size={size === 'lg' ? 18 : 14}
        fill={liked ? 'currentColor' : 'none'}
      />
      <span>{likes >= 1000 ? `${(likes / 1000).toFixed(1)}k` : likes}</span>
    </button>
  );
}
