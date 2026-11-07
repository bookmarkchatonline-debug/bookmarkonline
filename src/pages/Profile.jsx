import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  getUserProfile, getUserTracks, getLikedTracks,
  updateUserProfile, getUserBadges,
  getCreatorLevelProgress, getNextLevel, computeCreatorLevel,
  getUserPlaylists, getPlaylistTracks,
} from '../firebase/firestore';
import { getUserVideos } from '../firebase/videos';
import VideoCard from '../components/video/VideoCard';
import { db } from '../firebase/config';
import { collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { usePlayer } from '../context/PlayerContext';
import { upsertUserProfile } from '../firebase/auth';
import { uploadCoverImage } from '../cloudinary/upload';
import { auth } from '../firebase/config';
import { updateProfile as authUpdateProfile } from 'firebase/auth';
import TrackCard from '../components/track/TrackCard';
import CreatorBadge from '../components/common/CreatorBadge';
import FollowButton from '../components/common/FollowButton';
import {
  Music, Upload, Heart, PlayCircle, Edit3,
  X, Star, Settings, Users, TrendingUp, Award,
  Calendar, Crown, ListMusic, MessageSquare, Video, Info, Zap
} from 'lucide-react';
import Cropper from 'react-easy-crop';
import { getCroppedImg } from '../utils/canvasUtils';
import toast from 'react-hot-toast';
import '../styles/profile.css';
import '../styles/pages.css';

// ─── Stat Card ───────────────────────────────────────────────────────────────
function StatItem({ value, label }) {
  const formatted =
    value >= 1000000
      ? `${(value / 1000000).toFixed(1)}M`
      : value >= 1000
      ? `${(value / 1000).toFixed(1)}k`
      : value;

  return (
    <div className="profile-stat-item">
      <div className="profile-stat-value">{formatted}</div>
      <div className="profile-stat-label">{label}</div>
    </div>
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
  const [badges,       setBadges]       = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [likedLoading, setLikedLoading] = useState(false);
  const [tab,          setTab]          = useState('uploads');
  const [followerCount, setFollowerCount] = useState(0);
  const [playlists,    setPlaylists]    = useState([]);
  const [playlistsLoading, setPlaylistsLoading] = useState(false);
  const [activePlaylistId, setActivePlaylistId] = useState(null);
  const [activePlaylistTracks, setActivePlaylistTracks] = useState([]);
  const [activePlaylistLoading, setActivePlaylistLoading] = useState(false);
  const [videos, setVideos] = useState([]);
  const [videosLoading, setVideosLoading] = useState(false);

  // Edit profile states
  const [showEditModal, setShowEditModal]     = useState(false);
  const [editUsername,  setEditUsername]      = useState('');
  const [editBio,       setEditBio]           = useState('');
  const [editAvatarUrl, setEditAvatarUrl]     = useState('');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [savingProfile, setSavingProfile]     = useState(false);

  // Avatar Cropping states
  const [cropImageSrc, setCropImageSrc] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [showCropModal, setShowCropModal] = useState(false);

  const fileInputRef = useRef(null);

  const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

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

      if (!prof && user?.uid === uid && myProfile) {
        prof = myProfile;
      }

      setProfile(prof);
      setFollowerCount(prof?.stats?.followers || 0);

      try {
        const trks = await getUserTracks(uid);
        if (!active) return;
        setTracks(trks);
      } catch (err) {
        console.error('Error loading user tracks:', err);
        if (active) setTracks([]);
      }

      // Load badges
      try {
        const b = await getUserBadges(uid);
        if (!active) return;
        setBadges(b);
      } catch (err) {
        console.warn('Error loading badges:', err);
      }

      if (active) setLoading(false);
    };

    loadData();
    return () => { active = false; };
  }, [uid, user, myProfile]);

  // ── Load liked tracks lazily ───────────────────────────────────────────────
  const handleTabLiked = useCallback(async () => {
    setTab('liked');
    if (likedTracks.length > 0) return;
    setLikedLoading(true);
    try {
      const liked = await getLikedTracks(uid);
      setLikedTracks(liked);
    } finally {
      setLikedLoading(false);
    }
  }, [uid, likedTracks.length]);

  // ── Load playlists lazily ───────────────────────────────────────────────
  const handleTabPlaylists = useCallback(async () => {
    setTab('playlists');
    setActivePlaylistId(null);
    if (playlists.length > 0) return;
    setPlaylistsLoading(true);
    try {
      const p = await getUserPlaylists(uid);
      setPlaylists(p);
    } finally {
      setPlaylistsLoading(false);
    }
  }, [uid, playlists.length]);

  // ── Load videos lazily ───────────────────────────────────────────────
  const handleTabVideos = useCallback(async () => {
    setTab('videos');
    if (videos.length > 0) return;
    setVideosLoading(true);
    try {
      const v = await getUserVideos(uid);
      setVideos(v);
    } finally {
      setVideosLoading(false);
    }
  }, [uid, videos.length]);

  const handlePlayPlaylist = async (playlistId) => {
    try {
      const t = await getPlaylistTracks(playlistId);
      if (t.length > 0) playQueue(t, 0);
      else toast.error('Playlist is empty');
    } catch(err) {
      toast.error('Failed to play playlist');
    }
  };

  const handleTogglePlaylist = async (playlistId) => {
    if (activePlaylistId === playlistId) {
      setActivePlaylistId(null);
      return;
    }
    setActivePlaylistId(playlistId);
    setActivePlaylistTracks([]);
    setActivePlaylistLoading(true);
    try {
      const t = await getPlaylistTracks(playlistId);
      setActivePlaylistTracks(t);
    } catch (err) {
      toast.error('Failed to load playlist tracks');
    } finally {
      setActivePlaylistLoading(false);
    }
  };

  const handleTrackDeleted = (deletedId) => {
    setTracks((prev) => prev.filter((t) => t.id !== deletedId));
    setLikedTracks((prev) => prev.filter((t) => t.id !== deletedId));
    if (isOwn) refreshProfile();
  };

  const handleMessageClick = async () => {
    if (!user) {
      toast.error('Please log in to send a message');
      navigate('/login');
      return;
    }
    try {
      const q = query(collection(db, 'chats'), where('participants', 'array-contains', user.uid));
      const snap = await getDocs(q);
      const existingChat = snap.docs.find(d => d.data().participants.includes(uid));
      
      if (existingChat) {
        navigate(`/messages/${existingChat.id}`);
      } else {
        const newChatRef = await addDoc(collection(db, 'chats'), {
          participants: [user.uid, uid],
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          lastMessage: ''
        });
        navigate(`/messages/${newChatRef.id}`);
      }
    } catch (err) {
      toast.error('Failed to start conversation');
      console.error(err);
    }
  };

  // ── Avatar Change ───────────────────────────────────────────────────────
  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setCropImageSrc(reader.result);
      setShowCropModal(true);
    };
    reader.readAsDataURL(file);
    e.target.value = ''; // Reset input
  };

  const handleCropSave = async () => {
    try {
      setUploadingAvatar(true);
      setShowCropModal(false);
      const croppedImageBlob = await getCroppedImg(cropImageSrc, croppedAreaPixels);
      const file = new File([croppedImageBlob], "avatar.jpg", { type: "image/jpeg" });
      const res = await uploadCoverImage(file);
      setEditAvatarUrl(res.url);
      toast.success('Avatar photo uploaded!');
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Avatar upload failed');
    } finally {
      setUploadingAvatar(false);
      setCropImageSrc(null);
    }
  };

  // ── Save Full Profile ──────────────────────────────────────────────────
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!editUsername.trim()) {
      toast.error('Username cannot be empty');
      return;
    }
    setSavingProfile(true);
    try {
      if (auth.currentUser) {
        await authUpdateProfile(auth.currentUser, {
          displayName: editUsername.trim(),
          photoURL: editAvatarUrl || null,
        });
      }
      const updatedFields = {
        username: editUsername.trim(),
        bio: editBio.trim(),
        avatarUrl: editAvatarUrl || null,
      };
      await updateUserProfile(uid, updatedFields);
      setProfile((p) => ({ ...p, ...updatedFields }));
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

  const levelProgress = getCreatorLevelProgress(profile?.stats);
  const nextLevel = getNextLevel(profile?.stats);
  const currentLevel = profile?.creatorLevel || computeCreatorLevel(profile?.stats);

  const memberSince = profile?.createdAt?.seconds
    ? new Date(profile.createdAt.seconds * 1000).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : null;

  const planName = profile?.plan === 'creator_pro' ? 'Creator Pro' : profile?.plan === 'gold_creator' ? 'Gold Creator' : 'Free Plan';
  
  const planExpires = profile?.planExpiresAt?.seconds
    ? new Date(profile.planExpiresAt.seconds * 1000).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : null;

  // ── Loading skeleton ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="profile-page-wrapper animate-fade-in">
        <div className="profile-skeleton-cover" />
        <div className="profile-skeleton-avatar" />
        <div style={{ display: 'flex', gap: 12, marginTop: 24, padding: '0 40px', flexWrap: 'wrap' }}>
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton-card" style={{ width: 100, height: 40 }} />
          ))}
        </div>
        <div className="profile-content-layout">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="skeleton-card" style={{ height: 80, opacity: 1 - i * 0.2 }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── Not found ─────────────────────────────────────────────────────────────
  if (!profile) {
    return (
      <div className="profile-page-wrapper animate-fade-in">
        <div className="profile-empty-state" style={{ margin: '80px 40px' }}>
          <div className="profile-empty-icon"><Users size={32} /></div>
          {isOwn ? (
            <>
              <h3>Setting up your profile...</h3>
              <p>We are preparing your account profile document. Click below to initialize it now.</p>
              <button
                className="btn btn-primary"
                onClick={async () => {
                  setLoading(true);
                  try {
                    const profileData = {
                      uid: user.uid,
                      username: user.displayName || user.email?.split('@')[0] || 'Anonymous',
                      email: user.email || '',
                      avatarUrl: user.photoURL || null,
                      bio: '',
                      role: 'artist',
                      plan: 'free',
                      creatorLevel: 'Rising Artist',
                      stats: { followers: 0, following: 0, totalLikes: 0, weeklyLikes: 0, uploads: 0, rankDelta: 0 },
                      createdAt: new Date(),
                    };
                    await upsertUserProfile(user.uid, profileData, 3);
                    await refreshProfile();
                    window.location.reload();
                  } catch (err) {
                    console.error('Manual profile setup failed:', err);
                    toast.error('Could not initialize profile.');
                    setLoading(false);
                  }
                }}
              >
                Setup Profile Now
              </button>
            </>
          ) : (
            <>
              <h3>User not found</h3>
              <p>This profile doesn't exist or may have been removed.</p>
              <button className="btn btn-ghost" onClick={() => navigate('/')}>
                Go Home
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="profile-page-wrapper animate-fade-in">

      {/* ── Hero Cover ──────────────────────────────────────────────────────── */}
      <div className="profile-hero">
        <div className="profile-hero-cover" />
      </div>

      {/* ── Profile Header ──────────────────────────────────────────────────── */}
      <div className="profile-header-container">
        
        {/* Avatar */}
        <div className="profile-avatar-wrapper">
          {profile.avatarUrl ? (
            <img src={profile.avatarUrl} alt={profile.username} className="profile-avatar-img" />
          ) : (
            <div className="profile-avatar-fallback">{initials}</div>
          )}
        </div>

        {/* Identity & Bio */}
        <div className="profile-identity-section">
          <div className="profile-name-row">
            <h1 className="profile-display-name">{profile.username}</h1>
            <CreatorBadge level={currentLevel} size="md" />
            {badges.length > 0 && (
              <span title="Award Winner">🏆</span>
            )}
          </div>
          <div className="profile-handle">@{profile.username.toLowerCase().replace(/\s+/g, '_')}</div>
          {profile.bio && <p className="profile-bio">{profile.bio}</p>}
        </div>

        {/* Stats */}
        <div className="profile-stats-container">
          <StatItem value={tracks.length} label="Tracks" />
          <StatItem value={totalLikes} label="Likes" />
          <StatItem value={followerCount} label="Followers" />
          <StatItem value={profile.stats?.following || 0} label="Following" />
        </div>

        {/* Actions */}
        <div className="profile-actions-row">
          {isOwn ? (
            <>
              <button
                className="btn btn-ghost"
                onClick={() => {
                  setEditUsername(profile.username || '');
                  setEditBio(profile.bio || '');
                  setEditAvatarUrl(profile.avatarUrl || '');
                  setShowEditModal(true);
                }}
              >
                <Settings size={18} />
                Edit Profile
              </button>
              <button className="btn btn-primary" onClick={() => navigate('/upload')}>
                <Upload size={18} />
                Upload
              </button>
            </>
          ) : (
            <>
              <FollowButton targetUid={uid} onFollowChange={(delta) => setFollowerCount((c) => Math.max(0, c + delta))} />
              <button className="btn btn-outline" onClick={handleMessageClick}>
                <MessageSquare size={18} />
                Message
              </button>
              {tracks.length > 0 && (
                <button className="btn btn-primary" onClick={() => playQueue(tracks, 0)}>
                  <PlayCircle size={18} />
                  Play All
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* ── Layout Content ──────────────────────────────────────────────────── */}
      <div className="profile-content-layout">
        
        {/* Left Column (Music) */}
        <div className="profile-main-column">
          
          {/* Featured Track */}
          {topTrack && topTrack.likes > 0 && tracks.length > 0 && (
            <div className="profile-featured-track">
              <div className="profile-featured-header">
                <Zap size={16} />
                Featured Track
              </div>
              <TrackCard track={topTrack} />
            </div>
          )}

          {/* Navigation Tabs */}
          <div className="profile-nav-tabs">
            <button className={`profile-nav-tab ${tab === 'uploads' ? 'active' : ''}`} onClick={() => setTab('uploads')}>
              Tracks <span className="profile-nav-tab-badge">{tracks.length}</span>
            </button>
            <button className={`profile-nav-tab ${tab === 'popular' ? 'active' : ''}`} onClick={() => setTab('popular')}>
              Most Liked
            </button>
            <button className={`profile-nav-tab ${tab === 'videos' ? 'active' : ''}`} onClick={handleTabVideos}>
              Videos {videos.length > 0 && <span className="profile-nav-tab-badge">{videos.length}</span>}
            </button>
            <button className={`profile-nav-tab ${tab === 'playlists' ? 'active' : ''}`} onClick={handleTabPlaylists}>
              Playlists
            </button>
            {isOwn && (
              <button className={`profile-nav-tab ${tab === 'liked' ? 'active' : ''}`} onClick={handleTabLiked}>
                Liked {likedTracks.length > 0 && <span className="profile-nav-tab-badge">{likedTracks.length}</span>}
              </button>
            )}
          </div>

          {/* Tab Content */}
          <div className="profile-tab-content">
            {(tab === 'uploads' || tab === 'popular') && (
              displayedTracks.length === 0 ? (
                <div className="profile-empty-state">
                  <div className="profile-empty-icon"><Music size={32} /></div>
                  <p>{isOwn ? "You haven't uploaded any tracks yet." : "No tracks uploaded yet."}</p>
                </div>
              ) : (
                <div className="tracks-grid">
                  {displayedTracks.map(track => (
                    <TrackCard key={track.id} track={track} onTrackDeleted={handleTrackDeleted} />
                  ))}
                </div>
              )
            )}

            {tab === 'videos' && (
              videosLoading ? (
                <div className="videos-grid">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="skeleton-card" style={{ height: 200 }} />
                  ))}
                </div>
              ) : videos.length === 0 ? (
                <div className="profile-empty-state">
                  <div className="profile-empty-icon"><Video size={32} /></div>
                  <p>{isOwn ? "You haven't uploaded any videos yet." : "No videos yet."}</p>
                </div>
              ) : (
                <div className="videos-grid">
                  {videos.map(video => (
                    <VideoCard key={video.id} video={video} onVideoDeleted={(id) => setVideos(prev => prev.filter(v => v.id !== id))} />
                  ))}
                </div>
              )
            )}

            {tab === 'playlists' && (
              playlistsLoading ? (
                <div className="tracks-grid">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="skeleton-card" style={{ height: 72 }} />
                  ))}
                </div>
              ) : playlists.length === 0 ? (
                <div className="profile-empty-state">
                  <div className="profile-empty-icon"><ListMusic size={32} /></div>
                  <p>{isOwn ? "You haven't created any playlists yet." : "No public playlists."}</p>
                </div>
              ) : (
                <div className="tracks-grid">
                  {playlists.filter(p => isOwn || p.isPublic).map((pl) => (
                    <div key={pl.id} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div 
                        className="track-card" 
                        style={{ padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
                        onClick={() => handleTogglePlaylist(pl.id)}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                          <div style={{ width: '48px', height: '48px', background: 'var(--bg-elevated)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Music size={24} color="var(--text-muted)" />
                          </div>
                          <div>
                            <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>{pl.name}</h3>
                            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', margin: 0 }}>
                              {pl.tracks?.length || 0} tracks
                            </p>
                          </div>
                        </div>
                        <button 
                          className="btn-icon" 
                          onClick={(e) => { e.stopPropagation(); handlePlayPlaylist(pl.id); }}
                          style={{ color: 'var(--accent)' }}
                          aria-label="Play Playlist"
                        >
                          <PlayCircle size={24} />
                        </button>
                      </div>
                      {activePlaylistId === pl.id && (
                        <div style={{ paddingLeft: '16px', display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                          {activePlaylistLoading ? (
                            <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem', padding: '12px' }}>Loading tracks...</div>
                          ) : activePlaylistTracks.length === 0 ? (
                            <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem', padding: '12px' }}>No tracks in this playlist</div>
                          ) : (
                            activePlaylistTracks.map(track => (
                              <TrackCard key={track.id} track={track} onTrackDeleted={handleTrackDeleted} />
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )
            )}

            {tab === 'liked' && (
              likedLoading ? (
                <div className="tracks-grid">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="skeleton-card" style={{ height: 72 }} />
                  ))}
                </div>
              ) : likedTracks.length === 0 ? (
                <div className="profile-empty-state">
                  <div className="profile-empty-icon"><Heart size={32} /></div>
                  <p>You haven't liked any tracks yet.</p>
                </div>
              ) : (
                <div className="tracks-grid">
                  {likedTracks.map((track) => (
                    <TrackCard key={track.id} track={track} onTrackDeleted={handleTrackDeleted} />
                  ))}
                </div>
              )
            )}
          </div>
        </div>

        {/* Right Column (Info) */}
        <div className="profile-side-column">
          
          <div className="rail-card">
            <h3 className="rail-title"><Info size={16} /> About Creator</h3>
            
            <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {memberSince && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)' }}>
                  <Calendar size={16} /> Member since {memberSince}
                </div>
              )}
              {isOwn && profile?.plan !== 'free' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent)' }}>
                  <Star size={16} /> {planName} {planExpires ? `(Expires: ${planExpires})` : ''}
                </div>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.875rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Current Level</span>
                  <span style={{ fontWeight: 600, color: 'var(--accent)' }}>{currentLevel}</span>
                </div>
                <div style={{ width: '100%', height: '8px', background: 'var(--bg-elevated)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: `${levelProgress}%`, height: '100%', background: 'var(--accent-grad)' }} />
                </div>
                {nextLevel && (
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'right' }}>
                    Next: {nextLevel.name} ({nextLevel.minLikes} likes)
                  </div>
                )}
              </div>
            </div>
          </div>

          {badges.length > 0 && (
            <div className="rail-card" style={{ marginTop: '24px' }}>
              <h3 className="rail-title"><Award size={16} /> Badges</h3>
              <div className="profile-badges-grid" style={{ marginTop: '16px' }}>
                {badges.map((badge) => (
                  <div key={badge.id} className="profile-badge-item">
                    <div className="profile-badge-item-icon">🏆</div>
                    <div className="profile-badge-item-name">{badge.title || badge.category}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

      </div>

      {/* ── Edit Modal ──────────────────────────────────────────────────────── */}
      {showEditModal && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h2>Edit Profile</h2>
              <button className="btn-icon" onClick={() => setShowEditModal(false)}><X size={20} /></button>
            </div>
            
            <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                <div className="profile-avatar-wrapper" style={{ width: '96px', height: '96px', margin: 0 }}>
                  {editAvatarUrl ? (
                    <img src={editAvatarUrl} alt="Avatar" className="profile-avatar-img" />
                  ) : (
                    <div className="profile-avatar-fallback" style={{ fontSize: '1.5rem' }}>{initials}</div>
                  )}
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  style={{ display: 'none' }}
                  id="avatar-upload"
                  ref={fileInputRef}
                />
                <button type="button" className="btn btn-outline" onClick={() => fileInputRef.current?.click()}>
                  Change Photo
                </button>
              </div>

              <div className="form-group">
                <label>Display Name</label>
                <input
                  type="text"
                  className="input"
                  value={editUsername}
                  onChange={(e) => setEditUsername(e.target.value)}
                  placeholder="e.g. DJ Cool"
                  required
                />
              </div>

              <div className="form-group">
                <label>Bio</label>
                <textarea
                  className="input"
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  placeholder="Tell us about yourself..."
                  rows={4}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowEditModal(false)} disabled={savingProfile}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={savingProfile}>
                  {savingProfile ? 'Saving...' : 'Save Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Crop Modal ──────────────────────────────────────────────────────── */}
      {showCropModal && cropImageSrc && (
        <div className="modal-backdrop" style={{ zIndex: 1100 }}>
          <div className="modal-content" style={{ maxWidth: '500px', height: '500px', display: 'flex', flexDirection: 'column' }}>
            <div className="modal-header">
              <h2>Crop Avatar</h2>
              <button className="btn-icon" onClick={() => { setShowCropModal(false); setCropImageSrc(null); }}><X size={20} /></button>
            </div>
            
            <div style={{ flex: 1, position: 'relative', background: '#000', borderRadius: '8px', overflow: 'hidden', margin: '16px 0' }}>
              <Cropper
                image={cropImageSrc}
                crop={crop}
                zoom={zoom}
                aspect={1}
                cropShape="round"
                showGrid={false}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
              <span style={{ fontSize: '0.875rem' }}>Zoom</span>
              <input
                type="range"
                min={1} max={3} step={0.1}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                style={{ flex: 1 }}
              />
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button className="btn btn-ghost" onClick={() => { setShowCropModal(false); setCropImageSrc(null); }}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleCropSave} disabled={uploadingAvatar}>
                {uploadingAvatar ? 'Uploading...' : 'Save Photo'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
