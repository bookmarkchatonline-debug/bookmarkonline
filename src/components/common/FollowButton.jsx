// src/components/common/FollowButton.jsx
import { useState, useEffect } from 'react';
import { UserPlus, UserCheck } from 'lucide-react';
import { followUser, unfollowUser, isFollowing as checkFollowing } from '../../firebase/firestore';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

export default function FollowButton({ targetUid, onFollowChange, size = 'md' }) {
  const { user } = useAuth();
  const [following, setFollowing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || user.uid === targetUid) {
      setLoading(false);
      return;
    }
    let active = true;
    checkFollowing(user.uid, targetUid).then((result) => {
      if (active) {
        setFollowing(result);
        setLoading(false);
      }
    });
    return () => { active = false; };
  }, [user, targetUid]);

  if (!user || user.uid === targetUid) return null;

  const handleClick = async (e) => {
    e.stopPropagation();
    if (loading) return;
    setLoading(true);

    try {
      if (following) {
        await unfollowUser(user.uid, targetUid);
        setFollowing(false);
        onFollowChange?.(-1);
      } else {
        await followUser(user.uid, targetUid);
        setFollowing(true);
        toast.success('Following!');
        onFollowChange?.(1);
      }
    } catch (err) {
      toast.error('Failed to update follow');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const sizeClass = size === 'sm' ? 'btn-sm' : size === 'lg' ? 'btn-lg' : '';

  return (
    <button
      className={`btn ${following ? 'btn-ghost follow-btn-active' : 'btn-primary'} ${sizeClass} follow-btn`}
      onClick={handleClick}
      disabled={loading}
      id="follow-btn"
    >
      {following ? (
        <>
          <UserCheck size={size === 'sm' ? 13 : 15} />
          Following
        </>
      ) : (
        <>
          <UserPlus size={size === 'sm' ? 13 : 15} />
          Follow
        </>
      )}
    </button>
  );
}
