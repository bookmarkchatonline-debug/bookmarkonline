// src/pages/Profile.jsx
import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  getUserProfile, getUserTracks, getLikedTracks,
  updateUserProfile,
} from '../firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { usePlayer } from '../context/PlayerContext';
import { upsertUserProfile } from '../firebase/auth';
import { uploadCoverImage } from '../cloudinary/upload';
import { auth } from '../firebase/config';
import { updateProfile as authUpdateProfile } from 'firebase/auth';
import TrackCard from '../components/track/TrackCard';
import {
  Music, Upload, Heart, PlayCircle, Edit3,
  Check, X, BarChart2, Zap, Star, Camera, Settings,
} from 'lucide-react';
import toast from 'react-hot-toast';
import '../styles/pages.css';
import '../styles/components.css';

// ─── Stat Card ───────────────────────────────────────────────────────────────
function StatCard({ value, label, icon: Icon, color }) {
  const formatted =
    value >= 1000000
      ? `${(value / 1000000).toFixed(1)}M`
      : value >= 1000
      ? `${(value / 1000).toFixed(1)}k`
      : value;

  return (
    <div className="profile-stat-card">
      <div className="profile-stat-card-icon" style={{ background: color }}>
        <Icon size={16} color="#fff" />
      </div>
      <div className="profile-stat-card-value">{formatted}</div>
      <div className="profile-stat-card-label">{label}</div>
    </div>
  );
}

// ─── Tab Button ──────────────────────────────────────────────────────────────
function Tab({ active, onClick, children, count }) {
  return (
    <button
      className={`profile-tab${active ? ' active' : ''}`}
      onClick={onClick}
    >
      {children}
      {count !== undefined && (
        <span className={`profile-tab-badge${active ? ' active' : ''}`}>{count}</span>
      )}
    </button>
  );
}

// ─── Main Profile Page ────────────────────────────────────────────────────────
export default function Profile() {
  const { uid }       = useParams();
  const { user, profile: myProfile, refreshProfile } = useAuth();
  const { playQueue } = usePlayer();
  const navigate      = useNavigate();

  const [profile,      setProfile]      = useState(null);
  const [tracks,       setTracks]       = useState([]);
  const [likedTracks,  setLikedTracks]  = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [likedLoading, setLikedLoading] = useState(false);
  const [tab,          setTab]          = useState('uploads');

  // Edit profile states
  const [showEditModal, setShowEditModal]     = useState(false);
  const [editUsername,  setEditUsername]      = useState('');
  const [editBio,       setEditBio]           = useState('');
  const [editAvatarUrl, setEditAvatarUrl]     = useState('');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [savingProfile, setSavingProfile]     = useState(false);

  const isOwn = user?.uid === uid;

  // ── Load profile + uploads ────────────────────────────────────────────────
  useEffect(() => {
    setLoading(true);
    setTab('uploads');

    let active = true;

    const loadData = async () => {
      let prof = null;
      try {
        prof = await getUserProfile(uid);
      } catch (err) {
        console.error('Error loading user profile:', err);
      }

      if (!active) return;

      // Fallback: If this is the logged-in user, and the firestore doc fetch failed
      // or returned null, but we have their profile in the AuthContext, use that!
      if (!prof && user?.uid === uid && myProfile) {
        prof = myProfile;
      }

      setProfile(prof);

      try {
        const trks = await getUserTracks(uid);
        if (!active) return;
        setTracks(trks);
      } catch (err) {
        console.error('Error loading user tracks:', err);
        if (active) {
          setTracks([]);
        }
      }

      if (active) {
        setLoading(false);
      }
    };

    loadData();

    return () => {
      active = false;
    };
  }, [uid, user, myProfile]);

  // ── Load liked tracks lazily ───────────────────────────────────────────────
  const handleTabLiked = useCallback(async () => {
    setTab('liked');
    if (likedTracks.length > 0) return; // already loaded
    setLikedLoading(true);
    try {
      const liked = await getLikedTracks(uid);
      setLikedTracks(liked);
    } finally {
      setLikedLoading(false);
    }
  }, [uid, likedTracks.length]);

  // ── Avatar Change (Cloudinary Image Upload) ───────────────────────────────
  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    setUploadingAvatar(true);
    try {
      const res = await uploadCoverImage(file);
      setEditAvatarUrl(res.url);
      toast.success('Avatar photo uploaded!');
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Avatar upload failed');
    } finally {
      setUploadingAvatar(false);
    }
  };

  // ── Save Full Profile Customizations ──────────────────────────────────────
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!editUsername.trim()) {
      toast.error('Username cannot be empty');
      return;
    }
    setSavingProfile(true);
    try {
      // 1. Update Firebase Auth Profile
      if (auth.currentUser) {
        await authUpdateProfile(auth.currentUser, {
          displayName: editUsername.trim(),
          photoURL: editAvatarUrl || null,
        });
      }

      // 2. Update Firestore Doc (this will automatically cascade to all tracks too!)
      const updatedFields = {
        username: editUsername.trim(),
        bio: editBio.trim(),
        avatarUrl: editAvatarUrl || null,
      };
      await updateUserProfile(uid, updatedFields);

      // 3. Update local state
      setProfile((p) => ({
        ...p,
        ...updatedFields,
      }));

      // 4. Refresh global AuthContext
      await refreshProfile();

      toast.success('Profile saved successfully!');
      setShowEditModal(false);
    } catch (err) {
      console.error(err);
      toast.error('Failed to save profile: ' + err.message);
    } finally {
      setSavingProfile(false);
    }
  };

  // ── Derived stats ─────────────────────────────────────────────────────────
  const totalLikes = tracks.reduce((s, t) => s + (t.likes || 0), 0);
  const topTrack   = [...tracks].sort((a, b) => (b.likes || 0) - (a.likes || 0))[0];

  const displayedTracks =
    tab === 'popular'
      ? [...tracks].sort((a, b) => (b.likes || 0) - (a.likes || 0))
      : tracks;

  const initials =
    (profile?.username || myProfile?.username || '?')
      .slice(0, 2)
      .toUpperCase();

  // ── Loading skeleton ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="profile-page">
        <div className="profile-skeleton-banner" />
        <div className="profile-skeleton-avatar" />
        <div style={{ display: 'flex', gap: 12, marginTop: 60, flexWrap: 'wrap' }}>
          {[1, 2, 3].map((i) => (
            <div key={i} className="profile-skeleton-stat" />
          ))}
        </div>
        <div style={{ marginTop: 28, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[1, 2, 3].map((i) => (
            <div key={i} className="profile-skeleton-track" style={{ opacity: 1 - i * 0.2 }} />
          ))}
        </div>
      </div>
    );
  }

  // ── Not found ─────────────────────────────────────────────────────────────
  if (!profile) {
    const isCurrentUser = user?.uid === uid;
    return (
      <div className="page">
        <div className="empty-state" style={{ paddingTop: 80 }}>
          <div className="profile-ghost-avatar">?</div>
          <h2 style={{ marginTop: 16, fontSize: '1.4rem', fontWeight: 800 }}>
            {isCurrentUser ? 'Setting up your profile...' : 'User not found'}
          </h2>
          <p style={{ color: 'var(--text-secondary)', marginTop: 6, maxWidth: '360px', margin: '6px auto 0' }}>
            {isCurrentUser
              ? 'We are preparing your account profile document. Click below to initialize it now.'
              : "This profile doesn't exist or may have been removed."}
          </p>
          {isCurrentUser ? (
            <button
              className="btn btn-primary"
              style={{ marginTop: 20 }}
              onClick={async () => {
                setLoading(true);
                try {
                  const profileData = {
                    uid: user.uid,
                    username: user.displayName || user.email?.split('@')[0] || 'Anonymous',
                    email: user.email || '',
                    avatarUrl: user.photoURL || null,
                    bio: '',
                    createdAt: new Date(),
                  };
                  await upsertUserProfile(user.uid, profileData, 3);
                  await refreshProfile();
                  window.location.reload();
                } catch (err) {
                  console.error('Manual profile setup failed:', err);
                  toast.error('Could not initialize profile. Try again in a few seconds.');
                  setLoading(false);
                }
              }}
            >
              Setup Profile Now
            </button>
          ) : (
            <button className="btn btn-ghost" style={{ marginTop: 20 }} onClick={() => navigate('/')}>
              Go Home
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="profile-page animate-fade-in">

      {/* ── Banner ──────────────────────────────────────────────────────── */}
      <div className="profile-banner-wrap">
        <div className="profile-banner-bg" />
        <div className="profile-banner-overlay" />
        {/* Banner music notes decoration */}
        <div className="profile-banner-deco" aria-hidden="true">
          {['🎵', '🎶', '🎸', '🎤', '🎧'].map((e, i) => (
            <span key={i} className="profile-banner-emoji" style={{ animationDelay: `${i * 0.4}s` }}>
              {e}
            </span>
          ))}
        </div>
      </div>

      {/* ── Profile Header ──────────────────────────────────────────────── */}
      <div className="profile-header-row">
        {/* Avatar */}
        <div className="profile-avatar-ring">
          {profile.avatarUrl ? (
            <img src={profile.avatarUrl} alt={profile.username} className="profile-avatar-img" />
          ) : (
            <div className="profile-avatar-initials">{initials}</div>
          )}
          {/* Online / playing indicator */}
          <span className="profile-avatar-dot" aria-hidden="true" />
        </div>

        {/* Name + bio */}
        <div className="profile-identity">
          <div className="profile-username-row">
            <h1 className="profile-display-name">{profile.username}</h1>
            {tracks.length > 0 && (
              <span className="profile-verified-badge" title="Active creator">⭐</span>
            )}
          </div>
          <div className="profile-handle">@{profile.username.toLowerCase().replace(/\s+/g, '_')}</div>

          {/* Bio — editable for owner */}
          <div className="profile-bio-row">
            <p className="profile-bio-text">
              {profile.bio || (isOwn ? 'Add a bio to tell people about yourself…' : 'No bio yet.')}
            </p>
            {isOwn && (
              <button
                className="profile-bio-edit-btn"
                onClick={() => {
                  setEditUsername(profile.username || '');
                  setEditBio(profile.bio || '');
                  setEditAvatarUrl(profile.avatarUrl || '');
                  setShowEditModal(true);
                }}
                aria-label="Edit profile"
              >
                <Edit3 size={13} />
              </button>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="profile-header-actions">
          {isOwn ? (
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                className="btn btn-ghost"
                onClick={() => {
                  setEditUsername(profile.username || '');
                  setEditBio(profile.bio || '');
                  setEditAvatarUrl(profile.avatarUrl || '');
                  setShowEditModal(true);
                }}
                id="profile-edit-btn"
              >
                <Settings size={15} />
                Edit Profile
              </button>
              <button
                className="btn btn-primary"
                onClick={() => navigate('/upload')}
                id="profile-upload-btn"
              >
                <Upload size={15} />
                Upload Snippet
              </button>
            </div>
          ) : (
            tracks.length > 0 && (
              <button
                className="btn btn-primary"
                onClick={() => playQueue(tracks, 0)}
                id="profile-play-all-btn"
              >
                <PlayCircle size={15} />
                Play All
              </button>
            )
          )}
        </div>
      </div>

      {/* ── Stat Cards ──────────────────────────────────────────────────── */}
      <div className="profile-stats-row">
        <StatCard
          value={tracks.length}
          label="Uploads"
          icon={Music}
          color="linear-gradient(135deg, #a855f7, #c026d3)"
        />
        <StatCard
          value={totalLikes}
          label="Total Likes"
          icon={Heart}
          color="linear-gradient(135deg, #ec4899, #f43f5e)"
        />
        <StatCard
          value={topTrack?.likes || 0}
          label="Best Track"
          icon={Star}
          color="linear-gradient(135deg, #f59e0b, #ef4444)"
        />
        <StatCard
          value={tracks.filter((t) => (t.likes || 0) > 0).length}
          label="Liked By Others"
          icon={BarChart2}
          color="linear-gradient(135deg, #06b6d4, #3b82f6)"
        />
      </div>

      {/* ── Top Track Highlight ──────────────────────────────────────────── */}
      {topTrack && topTrack.likes > 0 && (
        <div className="profile-top-track">
          <div className="profile-top-track-label">
            <Zap size={13} color="var(--accent)" />
            Most Liked Track
          </div>
          <div className="profile-top-track-inner">
            {topTrack.coverUrl ? (
              <img src={topTrack.coverUrl} alt={topTrack.title} className="profile-top-cover" />
            ) : (
              <div className="profile-top-cover profile-top-cover-placeholder">
                <Music size={20} color="rgba(255,255,255,0.5)" />
              </div>
            )}
            <div className="profile-top-info">
              <div className="profile-top-title">{topTrack.title}</div>
              <div className="profile-top-likes">❤️ {topTrack.likes} likes</div>
            </div>
            <button
              className="play-all-btn"
              onClick={() => navigate(`/track/${topTrack.id}`)}
              style={{ flexShrink: 0, fontSize: '0.75rem', padding: '6px 12px' }}
            >
              <PlayCircle size={14} />
              Play
            </button>
          </div>
        </div>
      )}

      {/* ── Tabs ────────────────────────────────────────────────────────── */}
      <div className="profile-tabs-row">
        <Tab active={tab === 'uploads'} onClick={() => setTab('uploads')} count={tracks.length}>
          Uploads
        </Tab>
        <Tab active={tab === 'popular'} onClick={() => setTab('popular')}>
          Most Liked
        </Tab>
        {isOwn && (
          <Tab active={tab === 'liked'} onClick={handleTabLiked} count={likedTracks.length || undefined}>
            Liked
          </Tab>
        )}

        {/* Play all visible tracks */}
        {tab !== 'liked' && tracks.length > 0 && (
          <button
            className="play-all-btn"
            onClick={() => playQueue(displayedTracks, 0)}
            style={{ marginLeft: 'auto' }}
            id="profile-play-tab-btn"
          >
            <PlayCircle size={14} />
            Play All
          </button>
        )}
      </div>

      {/* ── Track List ──────────────────────────────────────────────────── */}
      {tab === 'liked' ? (
        likedLoading ? (
          <div className="tracks-grid">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} style={{ height: 72, background: 'var(--bg-card)', borderRadius: 'var(--radius-md)', opacity: 1 - i * 0.2 }} />
            ))}
          </div>
        ) : likedTracks.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><Heart size={40} opacity={0.3} /></div>
            <p>You haven't liked any tracks yet.</p>
            <button className="btn btn-ghost" onClick={() => navigate('/discover')}>
              Discover Music
            </button>
          </div>
        ) : (
          <div className="tracks-grid">
            {likedTracks.map((track) => (
              <TrackCard key={track.id} track={track} />
            ))}
          </div>
        )
      ) : displayedTracks.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"><Music size={40} opacity={0.3} /></div>
          <p>{isOwn ? "You haven't uploaded any snippets yet." : 'No tracks uploaded yet.'}</p>
          {isOwn && (
            <button className="btn btn-primary" onClick={() => navigate('/upload')}>
              Upload Your First Snippet
            </button>
          )}
        </div>
      ) : (
        <div className="tracks-grid">
          {displayedTracks.map((track) => (
            <TrackCard key={track.id} track={track} />
          ))}
        </div>
      )}

      {/* ─── Edit Profile Modal ─────────────────────────────────────────── */}
      {showEditModal && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Edit Profile</h2>
              <button className="modal-close-btn" onClick={() => setShowEditModal(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="modal-form">
              {/* Avatar Upload Container */}
              <div className="edit-avatar-container">
                <div className="edit-avatar-wrapper" onClick={() => document.getElementById('avatar-file-input').click()}>
                  {editAvatarUrl ? (
                    <img src={editAvatarUrl} alt="Avatar preview" className="edit-avatar-img" />
                  ) : (
                    <div className="edit-avatar-placeholder">{initials}</div>
                  )}
                  
                  <div className="edit-avatar-overlay">
                    <Camera size={18} />
                    <span className="edit-avatar-label">Change</span>
                  </div>

                  {uploadingAvatar && (
                    <div className="edit-avatar-spinner">
                      <div className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }} />
                      <span>Uploading...</span>
                    </div>
                  )}
                </div>
                <span className="input-label" style={{ fontSize: '0.7rem', marginTop: 4 }}>Click photo to change</span>
                <input
                  id="avatar-file-input"
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  style={{ display: 'none' }}
                />
              </div>

              {/* Username Input */}
              <div className="input-group">
                <label className="input-label" htmlFor="edit-username-input">Username *</label>
                <input
                  id="edit-username-input"
                  type="text"
                  className="input"
                  placeholder="Your display name..."
                  value={editUsername}
                  onChange={(e) => setEditUsername(e.target.value)}
                  required
                  maxLength={30}
                />
              </div>

              {/* Bio Textarea */}
              <div className="input-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label className="input-label" htmlFor="edit-bio-input">Bio</label>
                  <span className="modal-input-char-count">{editBio.length} / 160</span>
                </div>
                <textarea
                  id="edit-bio-input"
                  className="input"
                  style={{ resize: 'none' }}
                  rows={3}
                  placeholder="Tell the community about yourself..."
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  maxLength={160}
                />
              </div>

              {/* Actions */}
              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-ghost modal-btn-cancel"
                  onClick={() => setShowEditModal(false)}
                  disabled={savingProfile}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary modal-btn-save"
                  disabled={savingProfile || uploadingAvatar}
                >
                  {savingProfile ? (
                    <>
                      <div className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} />
                      Saving...
                    </>
                  ) : (
                    'Apply Changes'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
