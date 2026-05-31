// src/firebase/firestore.js
import {
  collection,
  addDoc,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  increment,
  setDoc,
  writeBatch,
  onSnapshot,
  arrayUnion,
  arrayRemove,
} from 'firebase/firestore';
import { db } from './config';

// ─── Tracks ──────────────────────────────────────────────────────────────────

/** Add a new track document */
export async function addTrack(trackData) {
  const ref = await addDoc(collection(db, 'tracks'), {
    ...trackData,
    likes: 0,
    plays: 0,
    weeklyLikes: 0,
    createdAt: serverTimestamp(),
    isPublic: true,
  });

  // increment user's upload count (best-effort)
  if (trackData.uid) {
    try {
      await updateDoc(doc(db, 'users', trackData.uid), {
        'stats.uploads': increment(1),
      });
      // Recalculate creator level after upload
      await updateCreatorLevel(trackData.uid);
    } catch (err) {
      console.warn('Failed to increment user upload count', err);
    }
  }

  // Emit a live feed item
  try {
    await addDoc(collection(db, 'liveFeed'), {
      type: 'upload',
      uid: trackData.uid || null,
      username: trackData.username || null,
      avatarUrl: trackData.avatarUrl || null,
      message: 'uploaded a new snippet',
      trackId: ref.id,
      trackTitle: trackData.title || null,
      trackCoverUrl: trackData.coverUrl || null,
      createdAt: serverTimestamp(),
    });
  } catch (err) {
    console.warn('Failed to write liveFeed item', err);
  }

  return ref.id;
}

/** Get a single track by id */
export async function getTrack(trackId) {
  const snap = await getDoc(doc(db, 'tracks', trackId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}

/** Get home feed — top liked + newest */
export async function getTopTracks(limitCount = 20) {
  const q = query(
    collection(db, 'tracks'),
    orderBy('likes', 'desc'),
    limit(limitCount)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/** Get newest tracks */
export async function getNewestTracks(limitCount = 20) {
  const q = query(
    collection(db, 'tracks'),
    orderBy('createdAt', 'desc'),
    limit(limitCount)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/** Get tracks by user uid */
export async function getUserTracks(uid) {
  const q = query(
    collection(db, 'tracks'),
    where('uid', '==', uid)
  );
  const snap = await getDocs(q);
  const tracks = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  return tracks.sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
}

/** Search tracks by title prefix or tag */
export async function searchTracks(term) {
  const q = query(
    collection(db, 'tracks'),
    where('isPublic', '==', true),
    orderBy('likes', 'desc'),
    limit(200)
  );
  const snap = await getDocs(q);
  const lower = term.toLowerCase().trim();
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .filter((t) => {
      const inTitle = t.title?.toLowerCase().includes(lower);
      const inTags = t.tags?.some((tag) => tag.toLowerCase().includes(lower));
      const inArtist = t.username?.toLowerCase().includes(lower);
      return inTitle || inTags || inArtist;
    });
}

/** Delete a track */
export async function deleteTrack(trackId, uid) {
  await deleteDoc(doc(db, 'tracks', trackId));
  
  if (uid) {
    try {
      await updateDoc(doc(db, 'users', uid), {
        'stats.uploads': increment(-1),
      });
      await updateCreatorLevel(uid);
    } catch (err) {
      console.warn('Failed to decrement user upload count', err);
    }
  }
}

/** Get rising tracks — tracks uploaded in last 7 days with most likes */
export async function getRisingTracks(limitCount = 10) {
  const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const q = query(
    collection(db, 'tracks'),
    where('isPublic', '==', true),
    where('createdAt', '>=', cutoff),
    orderBy('createdAt', 'desc'),
    limit(100)
  );
  const snap = await getDocs(q);
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .sort((a, b) => (b.likes || 0) - (a.likes || 0))
    .slice(0, limitCount);
}

// ─── Likes ───────────────────────────────────────────────────────────────────

const likeId = (uid, trackId) => `${uid}_${trackId}`;

/** Toggle like — returns new liked state */
export async function toggleLike(uid, trackId) {
  const id = likeId(uid, trackId);
  const likeRef = doc(db, 'likes', id);
  const trackRef = doc(db, 'tracks', trackId);
  const snap = await getDoc(likeRef);

  if (snap.exists()) {
    await deleteDoc(likeRef);
    await updateDoc(trackRef, { likes: increment(-1) });
    try {
      const trackSnap = await getDoc(trackRef);
      if (trackSnap.exists()) {
        const ownerUid = trackSnap.data().uid;
        if (ownerUid) {
          await updateDoc(doc(db, 'users', ownerUid), {
            'stats.totalLikes': increment(-1),
            'stats.weeklyLikes': increment(-1),
          });
          await updateCreatorLevel(ownerUid);
        }
      }
    } catch (err) { console.warn('Failed to decrement owner likes', err); }

    return false; // unliked
  } else {
    await setDoc(likeRef, { uid, trackId, createdAt: serverTimestamp() });
    await updateDoc(trackRef, { likes: increment(1) });

    let trackTitle = '';
    let trackOwnerUid = null;
    let trackCoverUrl = null;
    try {
      const trackSnap = await getDoc(trackRef);
      if (trackSnap.exists()) {
        const data = trackSnap.data();
        trackOwnerUid = data.uid;
        trackTitle = data.title || '';
        trackCoverUrl = data.coverUrl || null;
        if (trackOwnerUid) {
          await updateDoc(doc(db, 'users', trackOwnerUid), {
            'stats.totalLikes': increment(1),
            'stats.weeklyLikes': increment(1),
          });
          await updateCreatorLevel(trackOwnerUid);
        }
      }
    } catch (err) { console.warn('Failed to increment owner likes', err); }

    // Emit feed
    try {
      // Get liker info
      const likerSnap = await getDoc(doc(db, 'users', uid));
      const likerData = likerSnap.exists() ? likerSnap.data() : {};
      await addDoc(collection(db, 'liveFeed'), {
        type: 'like',
        uid,
        username: likerData.username || 'Someone',
        avatarUrl: likerData.avatarUrl || null,
        trackId,
        trackTitle,
        trackCoverUrl,
        message: 'liked a track',
        createdAt: serverTimestamp(),
      });
    } catch (err) { console.warn('Failed to write liveFeed like', err); }

    // Create notification for track owner
    if (trackOwnerUid && trackOwnerUid !== uid) {
      try {
        const likerSnap = await getDoc(doc(db, 'users', uid));
        const likerName = likerSnap.exists() ? likerSnap.data().username : 'Someone';
        await addNotification(trackOwnerUid, {
          type: 'like',
          message: `${likerName} liked your track "${trackTitle}"`,
          fromUid: uid,
          trackId,
        });
      } catch (err) { console.warn('Failed to create like notification', err); }
    }

    return true; // liked
  }
}

/** Check if user has liked a track */
export async function hasLiked(uid, trackId) {
  const snap = await getDoc(doc(db, 'likes', likeId(uid, trackId)));
  return snap.exists();
}

/** Get all track IDs liked by a user */
export async function getUserLikes(uid) {
  const q = query(collection(db, 'likes'), where('uid', '==', uid));
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data().trackId);
}

/** Get full track objects for all tracks a user has liked */
export async function getLikedTracks(uid) {
  const trackIds = await getUserLikes(uid);
  if (trackIds.length === 0) return [];
  const promises = trackIds.map((id) => getDoc(doc(db, 'tracks', id)));
  const snaps = await Promise.all(promises);
  return snaps
    .filter((s) => s.exists())
    .map((s) => ({ id: s.id, ...s.data() }));
}

// ─── Users ───────────────────────────────────────────────────────────────────

/** Get user profile by uid */
export async function getUserProfile(uid) {
  const snap = await getDoc(doc(db, 'users', uid));
  if (!snap.exists()) return null;
  return snap.data();
}

/** Update user profile fields and cascade changes to tracks if necessary */
export async function updateUserProfile(uid, fields) {
  await updateDoc(doc(db, 'users', uid), fields);

  if (fields.username !== undefined || fields.avatarUrl !== undefined) {
    const trackFields = {};
    if (fields.username !== undefined) trackFields.username = fields.username;
    if (fields.avatarUrl !== undefined) trackFields.avatarUrl = fields.avatarUrl;

    const q = query(
      collection(db, 'tracks'),
      where('uid', '==', uid)
    );
    const snap = await getDocs(q);
    const promises = snap.docs.map((trackDoc) =>
      updateDoc(doc(db, 'tracks', trackDoc.id), trackFields)
    );
    await Promise.all(promises);
  }
}

/** Search users/artists by username */
export async function searchUsers(term, limitCount = 20) {
  const q = query(
    collection(db, 'users'),
    orderBy('stats.totalLikes', 'desc'),
    limit(200)
  );
  const snap = await getDocs(q);
  const lower = term.toLowerCase().trim();
  return snap.docs
    .map((d) => ({ uid: d.id, ...d.data() }))
    .filter((u) => u.username?.toLowerCase().includes(lower))
    .slice(0, limitCount);
}

// ─── Follow System ──────────────────────────────────────────────────────────

const followId = (followerUid, targetUid) => `${followerUid}_${targetUid}`;

/** Follow a user */
export async function followUser(followerUid, targetUid) {
  if (followerUid === targetUid) return;
  const id = followId(followerUid, targetUid);
  const ref = doc(db, 'follows', id);
  const snap = await getDoc(ref);
  if (snap.exists()) return; // already following

  await setDoc(ref, {
    followerUid,
    targetUid,
    createdAt: serverTimestamp(),
  });

  // Update counts
  try {
    await updateDoc(doc(db, 'users', targetUid), { 'stats.followers': increment(1) });
    await updateDoc(doc(db, 'users', followerUid), { 'stats.following': increment(1) });
  } catch (err) { console.warn('Failed to update follow counts', err); }

  // Emit feed
  try {
    const followerSnap = await getDoc(doc(db, 'users', followerUid));
    const targetSnap = await getDoc(doc(db, 'users', targetUid));
    const followerData = followerSnap.exists() ? followerSnap.data() : {};
    const targetData = targetSnap.exists() ? targetSnap.data() : {};
    await addDoc(collection(db, 'liveFeed'), {
      type: 'follow',
      uid: followerUid,
      username: followerData.username || 'Someone',
      avatarUrl: followerData.avatarUrl || null,
      targetUid,
      targetUsername: targetData.username || 'an artist',
      message: `started following ${targetData.username || 'an artist'}`,
      createdAt: serverTimestamp(),
    });
  } catch (err) { console.warn('Failed to write follow feed', err); }

  // Notification
  try {
    const followerSnap = await getDoc(doc(db, 'users', followerUid));
    const followerName = followerSnap.exists() ? followerSnap.data().username : 'Someone';
    await addNotification(targetUid, {
      type: 'follow',
      message: `${followerName} started following you`,
      fromUid: followerUid,
    });
  } catch (err) { console.warn('Failed to create follow notification', err); }

  await updateCreatorLevel(targetUid);
}

/** Unfollow a user */
export async function unfollowUser(followerUid, targetUid) {
  const id = followId(followerUid, targetUid);
  const ref = doc(db, 'follows', id);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;

  await deleteDoc(ref);

  try {
    await updateDoc(doc(db, 'users', targetUid), { 'stats.followers': increment(-1) });
    await updateDoc(doc(db, 'users', followerUid), { 'stats.following': increment(-1) });
  } catch (err) { console.warn('Failed to update follow counts', err); }
}

/** Check if user is following another */
export async function isFollowing(followerUid, targetUid) {
  if (!followerUid || !targetUid) return false;
  const snap = await getDoc(doc(db, 'follows', followId(followerUid, targetUid)));
  return snap.exists();
}

/** Get follower count */
export async function getFollowerCount(uid) {
  const q = query(collection(db, 'follows'), where('targetUid', '==', uid));
  const snap = await getDocs(q);
  return snap.size;
}

/** Get following count */
export async function getFollowingCount(uid) {
  const q = query(collection(db, 'follows'), where('followerUid', '==', uid));
  const snap = await getDocs(q);
  return snap.size;
}

// ─── Creator Levels ─────────────────────────────────────────────────────────

const CREATOR_LEVELS = [
  { name: 'Rising Artist', minLikes: 0, minFollowers: 0 },
  { name: 'Trending', minLikes: 10, minFollowers: 3 },
  { name: 'Gold Creator', minLikes: 50, minFollowers: 15 },
  { name: 'Platinum', minLikes: 200, minFollowers: 50 },
];

/** Compute creator level from stats */
export function computeCreatorLevel(stats) {
  const totalLikes = stats?.totalLikes || 0;
  const followers = stats?.followers || 0;

  let level = CREATOR_LEVELS[0].name;
  for (const tier of CREATOR_LEVELS) {
    if (totalLikes >= tier.minLikes || followers >= tier.minFollowers) {
      level = tier.name;
    }
  }
  return level;
}

/** Get progress to next level as 0-100 */
export function getCreatorLevelProgress(stats) {
  const totalLikes = stats?.totalLikes || 0;
  const currentIdx = CREATOR_LEVELS.findIndex(
    (t) => t.name === computeCreatorLevel(stats)
  );
  if (currentIdx >= CREATOR_LEVELS.length - 1) return 100;
  const current = CREATOR_LEVELS[currentIdx];
  const next = CREATOR_LEVELS[currentIdx + 1];
  const range = next.minLikes - current.minLikes;
  if (range === 0) return 100;
  const progress = ((totalLikes - current.minLikes) / range) * 100;
  return Math.min(100, Math.max(0, Math.round(progress)));
}

/** Get next level info */
export function getNextLevel(stats) {
  const currentLevel = computeCreatorLevel(stats);
  const currentIdx = CREATOR_LEVELS.findIndex((t) => t.name === currentLevel);
  if (currentIdx >= CREATOR_LEVELS.length - 1) return null;
  return CREATOR_LEVELS[currentIdx + 1];
}

/** Get all level tiers */
export function getCreatorLevels() {
  return CREATOR_LEVELS;
}

/** Update a user's creator level based on their stats */
export async function updateCreatorLevel(uid) {
  try {
    const prof = await getUserProfile(uid);
    if (!prof) return;
    const newLevel = computeCreatorLevel(prof.stats);
    const oldLevel = prof.creatorLevel || 'Rising Artist';
    if (newLevel !== oldLevel) {
      await updateDoc(doc(db, 'users', uid), { creatorLevel: newLevel });
      // Emit level-up feed event
      try {
        await addDoc(collection(db, 'liveFeed'), {
          type: 'levelup',
          uid,
          username: prof.username || 'An artist',
          avatarUrl: prof.avatarUrl || null,
          message: `leveled up to ${newLevel}!`,
          oldLevel,
          newLevel,
          createdAt: serverTimestamp(),
        });
        await addNotification(uid, {
          type: 'levelup',
          message: `Congrats! You've reached ${newLevel} status! 🎉`,
        });
      } catch (err) { console.warn('Failed to emit level up events', err); }
    }
  } catch (err) {
    console.warn('Failed to update creator level', err);
  }
}

// ─── Engagement Score ───────────────────────────────────────────────────────

/** Calculate engagement score for an artist */
export function calculateEngagementScore(stats) {
  const likes = stats?.totalLikes || 0;
  const followers = stats?.followers || 0;
  const uploads = stats?.uploads || 0;
  return likes * 3 + followers * 5 + uploads * 2;
}

// ─── Discovery & Recognition ───────────────────────────────────────────────

/** Top creators by total likes (role=artist) */
export async function getTopCreators(limitCount = 6) {
  const q = query(
    collection(db, 'users'),
    orderBy('stats.totalLikes', 'desc'),
    limit(limitCount)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ uid: d.id, ...d.data() }));
}

/** Get all artists for directory/rankings */
export async function getAllArtists(limitCount = 50) {
  const q = query(
    collection(db, 'users'),
    where('role', '==', 'artist'),
    orderBy('stats.totalLikes', 'desc'),
    limit(limitCount)
  );
  const snap = await getDocs(q);
  return snap.docs
    .map((d) => ({ uid: d.id, ...d.data() }))
    .map((a) => ({
      ...a,
      engagementScore: calculateEngagementScore(a.stats),
    }))
    .sort((a, b) => b.engagementScore - a.engagementScore);
}

/** Get artist rankings with computed positions */
export async function getArtistRankings(limitCount = 50) {
  const artists = await getAllArtists(limitCount);
  return artists.map((artist, index) => ({
    ...artist,
    rank: index + 1,
    rankDelta: artist.stats?.rankDelta || 0,
  }));
}

/** Live feed activity items */
export async function getLiveFeed(limitCount = 15) {
  const q = query(
    collection(db, 'liveFeed'),
    orderBy('createdAt', 'desc'),
    limit(limitCount)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/** Gold Tape Awards (monthly) */
export async function getGoldTapeAwards(limitCount = 5) {
  const q = query(
    collection(db, 'awards'),
    orderBy('createdAt', 'desc'),
    limit(limitCount)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/** Get latest award (current month) */
export async function getLatestAward() {
  const q = query(
    collection(db, 'awards'),
    orderBy('createdAt', 'desc'),
    limit(1)
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  return { id: snap.docs[0].id, ...snap.docs[0].data() };
}

/** Weekly winners */
export async function getWeeklyWinners(limitCount = 5) {
  const q = query(
    collection(db, 'weeklyWinners'),
    orderBy('weekStart', 'desc'),
    limit(limitCount)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/** Opportunities for creators */
export async function getOpportunities(limitCount = 10) {
  const q = query(
    collection(db, 'opportunities'),
    where('isActive', '==', true),
    orderBy('deadline', 'asc'),
    limit(limitCount)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/** Get all opportunities including inactive */
export async function getAllOpportunities(limitCount = 20) {
  const q = query(
    collection(db, 'opportunities'),
    orderBy('deadline', 'desc'),
    limit(limitCount)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

// ─── Notifications ──────────────────────────────────────────────────────────

/** Add a notification for a user */
export async function addNotification(uid, data) {
  return addDoc(collection(db, 'notifications'), {
    uid,
    ...data,
    read: false,
    createdAt: serverTimestamp(),
  });
}

/** Get notifications for a user */
export async function getNotifications(uid, limitCount = 20) {
  const q = query(
    collection(db, 'notifications'),
    where('uid', '==', uid),
    orderBy('createdAt', 'desc'),
    limit(limitCount)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/** Get unread notification count */
export async function getUnreadNotificationCount(uid) {
  const q = query(
    collection(db, 'notifications'),
    where('uid', '==', uid),
    where('read', '==', false)
  );
  const snap = await getDocs(q);
  return snap.size;
}

/** Mark notification as read */
export async function markNotificationRead(notifId) {
  await updateDoc(doc(db, 'notifications', notifId), { read: true });
}

/** Mark all notifications as read */
export async function markAllNotificationsRead(uid) {
  const q = query(
    collection(db, 'notifications'),
    where('uid', '==', uid),
    where('read', '==', false)
  );
  const snap = await getDocs(q);
  const batch = writeBatch(db);
  snap.docs.forEach((d) => batch.update(d.ref, { read: true }));
  await batch.commit();
}

// ─── Award Publishing ───────────────────────────────────────────────────────

/** Publish a Gold Tape Award with categories and winners */
export async function publishGoldTapeAward(awardData) {
  const ref = await addDoc(collection(db, 'awards'), {
    ...awardData,
    createdAt: serverTimestamp(),
  });

  // Grant badges and notifications to winners
  if (awardData.categories) {
    for (const cat of awardData.categories) {
      if (cat.winnerUid) {
        try {
          // Add badge
          await addDoc(collection(db, 'users', cat.winnerUid, 'badges'), {
            type: 'goldtape',
            category: cat.name,
            awardId: ref.id,
            title: `Gold Tape: ${cat.name}`,
            awardedAt: serverTimestamp(),
          });
          // Notify winner
          await addNotification(cat.winnerUid, {
            type: 'award',
            message: `🏆 You won Gold Tape: ${cat.name}!`,
            awardId: ref.id,
          });
          // Level up to Gold Tape Winner if applicable
          await updateDoc(doc(db, 'users', cat.winnerUid), {
            creatorLevel: 'Gold Tape Winner',
          });
          // Feed event
          await addDoc(collection(db, 'liveFeed'), {
            type: 'award',
            uid: cat.winnerUid,
            username: cat.winnerName || 'An artist',
            message: `won Gold Tape: ${cat.name}! 🏆`,
            awardId: ref.id,
            createdAt: serverTimestamp(),
          });
        } catch (err) {
          console.warn(`Failed to grant badge to ${cat.winnerUid}`, err);
        }
      }
    }
  }

  return ref.id;
}

/** Get user badges */
export async function getUserBadges(uid) {
  const q = query(
    collection(db, 'users', uid, 'badges'),
    orderBy('awardedAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

// ─── Waitlist / Upgrade ─────────────────────────────────────────────────────

/** Add email to upgrade waitlist */
export async function joinUpgradeWaitlist(email, uid, plan) {
  return addDoc(collection(db, 'waitlist'), {
    email,
    uid: uid || null,
    plan,
    createdAt: serverTimestamp(),
  });
}

// ─── Playlists ─────────────────────────────────────────────────────────────

export async function createPlaylist(uid, name, isPublic = true) {
  const ref = await addDoc(collection(db, 'playlists'), {
    uid,
    name,
    isPublic,
    tracks: [],
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function getUserPlaylists(uid) {
  const q = query(
    collection(db, 'playlists'),
    where('uid', '==', uid)
  );
  const snap = await getDocs(q);
  const playlists = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  return playlists.sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
}

export async function addTrackToPlaylist(playlistId, trackId) {
  const ref = doc(db, 'playlists', playlistId);
  await updateDoc(ref, {
    tracks: arrayUnion(trackId)
  });
}

export async function removeTrackFromPlaylist(playlistId, trackId) {
  const ref = doc(db, 'playlists', playlistId);
  await updateDoc(ref, {
    tracks: arrayRemove(trackId)
  });
}

export async function getPlaylistTracks(playlistId) {
  const snap = await getDoc(doc(db, 'playlists', playlistId));
  if (!snap.exists()) return [];
  const trackIds = snap.data().tracks || [];
  if (trackIds.length === 0) return [];
  
  const promises = trackIds.map((id) => getDoc(doc(db, 'tracks', id)));
  const snaps = await Promise.all(promises);
  return snaps
    .filter((s) => s.exists())
    .map((s) => ({ id: s.id, ...s.data() }));
}
