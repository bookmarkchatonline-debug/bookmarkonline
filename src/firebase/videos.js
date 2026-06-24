// src/firebase/videos.js
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
  arrayUnion,
  arrayRemove,
} from 'firebase/firestore';
import { db } from './config';
import { updateCreatorLevel, addNotification } from './firestore';

// ─── Videos ──────────────────────────────────────────────────────────────────

/** Add a new video document */
export async function addVideo(videoData) {
  const ref = await addDoc(collection(db, 'videos'), {
    ...videoData,
    likes: 0,
    views: 0,
    commentCount: 0,
    createdAt: serverTimestamp(),
    isPublic: true,
  });

  // increment user's video upload count
  if (videoData.uid) {
    try {
      await updateDoc(doc(db, 'users', videoData.uid), {
        'stats.videoUploads': increment(1),
      });
      await updateCreatorLevel(videoData.uid);
    } catch (err) {
      console.warn('Failed to increment user video upload count', err);
    }
  }

  // Emit a live feed item
  try {
    await addDoc(collection(db, 'liveFeed'), {
      type: 'video',
      uid: videoData.uid || null,
      username: videoData.username || null,
      avatarUrl: videoData.avatarUrl || null,
      message: 'uploaded a new video',
      videoId: ref.id,
      videoTitle: videoData.title || null,
      videoThumbnail: videoData.thumbnailUrl || null,
      createdAt: serverTimestamp(),
    });
  } catch (err) {
    console.warn('Failed to write liveFeed item', err);
  }

  return ref.id;
}

/** Get a single video by id */
export async function getVideo(videoId) {
  const snap = await getDoc(doc(db, 'videos', videoId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}

/** Increment video view count */
export async function incrementVideoViews(videoId) {
  try {
    await updateDoc(doc(db, 'videos', videoId), {
      views: increment(1),
    });
  } catch (err) {
    console.warn('Failed to increment video views', err);
  }
}

/** Get top liked videos */
export async function getTopVideos(limitCount = 20) {
  const q = query(
    collection(db, 'videos'),
    orderBy('likes', 'desc'),
    limit(limitCount)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/** Get newest videos */
export async function getNewestVideos(limitCount = 20) {
  const q = query(
    collection(db, 'videos'),
    orderBy('createdAt', 'desc'),
    limit(limitCount)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/** Get trending videos (most views in last 7 days) */
export async function getTrendingVideos(limitCount = 20) {
  const q = query(
    collection(db, 'videos'),
    where('isPublic', '==', true),
    limit(100)
  );
  const snap = await getDocs(q);
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .sort((a, b) => (b.views || 0) - (a.views || 0))
    .slice(0, limitCount);
}

/** Get videos by user uid */
export async function getUserVideos(uid) {
  const q = query(
    collection(db, 'videos'),
    where('uid', '==', uid)
  );
  const snap = await getDocs(q);
  const videos = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  return videos.sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
}

/** Search videos by title or tags */
export async function searchVideos(term) {
  const q = query(
    collection(db, 'videos'),
    where('isPublic', '==', true),
    limit(200)
  );
  const snap = await getDocs(q);
  const lower = term.toLowerCase().trim();
  const filtered = snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .filter((v) => {
      const inTitle = v.title?.toLowerCase().includes(lower);
      const inDesc = v.description?.toLowerCase().includes(lower);
      const inTags = v.tags?.some((tag) => tag.toLowerCase().includes(lower));
      const inArtist = v.username?.toLowerCase().includes(lower);
      return inTitle || inDesc || inTags || inArtist;
    });
  filtered.sort((a, b) => (b.views || 0) - (a.views || 0));
  return filtered;
}

/** Delete a video */
export async function deleteVideo(videoId, uid) {
  // Delete video comments
  const commentsQuery = query(collection(db, 'videoComments'), where('videoId', '==', videoId));
  const commentsSnap = await getDocs(commentsQuery);
  const batch = writeBatch(db);
  commentsSnap.docs.forEach((d) => batch.delete(d.ref));
  await batch.commit();

  // Delete the video
  await deleteDoc(doc(db, 'videos', videoId));
  
  if (uid) {
    try {
      await updateDoc(doc(db, 'users', uid), {
        'stats.videoUploads': increment(-1),
      });
      await updateCreatorLevel(uid);
    } catch (err) {
      console.warn('Failed to decrement user video upload count', err);
    }
  }
}

// ─── Video Likes ─────────────────────────────────────────────────────────────

const videoLikeId = (uid, videoId) => `${uid}_${videoId}`;

/** Toggle video like */
export async function toggleVideoLike(uid, videoId) {
  const id = videoLikeId(uid, videoId);
  const likeRef = doc(db, 'videoLikes', id);
  const videoRef = doc(db, 'videos', videoId);
  const snap = await getDoc(likeRef);

  if (snap.exists()) {
    await deleteDoc(likeRef);
    await updateDoc(videoRef, { likes: increment(-1) });
    try {
      const videoSnap = await getDoc(videoRef);
      if (videoSnap.exists()) {
        const ownerUid = videoSnap.data().uid;
        if (ownerUid) {
          await updateDoc(doc(db, 'users', ownerUid), {
            'stats.totalLikes': increment(-1),
          });
          await updateCreatorLevel(ownerUid);
        }
      }
    } catch (err) { console.warn('Failed to decrement owner likes', err); }
    return false;
  } else {
    await setDoc(likeRef, { uid, videoId, createdAt: serverTimestamp() });
    await updateDoc(videoRef, { likes: increment(1) });

    let videoTitle = '';
    let videoOwnerUid = null;
    let videoThumbnail = null;
    try {
      const videoSnap = await getDoc(videoRef);
      if (videoSnap.exists()) {
        const data = videoSnap.data();
        videoOwnerUid = data.uid;
        videoTitle = data.title || '';
        videoThumbnail = data.thumbnailUrl || null;
        if (videoOwnerUid) {
          await updateDoc(doc(db, 'users', videoOwnerUid), {
            'stats.totalLikes': increment(1),
          });
          await updateCreatorLevel(videoOwnerUid);
        }
      }
    } catch (err) { console.warn('Failed to increment owner likes', err); }

    // Create notification
    if (videoOwnerUid && videoOwnerUid !== uid) {
      try {
        const likerSnap = await getDoc(doc(db, 'users', uid));
        const likerName = likerSnap.exists() ? likerSnap.data().username : 'Someone';
        await addNotification(videoOwnerUid, {
          type: 'videoLike',
          message: `${likerName} liked your video "${videoTitle}"`,
          fromUid: uid,
          videoId,
        });
      } catch (err) { console.warn('Failed to create video like notification', err); }
    }

    return true;
  }
}

/** Check if user has liked a video */
export async function hasLikedVideo(uid, videoId) {
  const snap = await getDoc(doc(db, 'videoLikes', videoLikeId(uid, videoId)));
  return snap.exists();
}

// ─── Video Comments ──────────────────────────────────────────────────────────

/** Add a comment to a video */
export async function addVideoComment(videoId, uid, username, avatarUrl, text) {
  const ref = await addDoc(collection(db, 'videoComments'), {
    videoId,
    uid,
    username: username || 'Anonymous',
    avatarUrl: avatarUrl || null,
    text,
    likes: 0,
    createdAt: serverTimestamp(),
  });

  // Increment comment count on video
  await updateDoc(doc(db, 'videos', videoId), {
    commentCount: increment(1),
  });

  // Notify video owner
  try {
    const videoSnap = await getDoc(doc(db, 'videos', videoId));
    if (videoSnap.exists()) {
      const videoData = videoSnap.data();
      if (videoData.uid && videoData.uid !== uid) {
        await addNotification(videoData.uid, {
          type: 'videoComment',
          message: `${username} commented on your video "${videoData.title}"`,
          fromUid: uid,
          videoId,
          commentId: ref.id,
        });
      }
    }
  } catch (err) {
    console.warn('Failed to create comment notification', err);
  }

  return ref.id;
}

/** Get comments for a video */
export async function getVideoComments(videoId, limitCount = 50) {
  const q = query(
    collection(db, 'videoComments'),
    where('videoId', '==', videoId),
    limit(limitCount * 2)
  );
  const snap = await getDocs(q);
  const comments = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  comments.sort((a, b) => {
    const tA = a.createdAt?.toMillis ? a.createdAt.toMillis() : (a.createdAt?.seconds ? a.createdAt.seconds * 1000 : 0);
    const tB = b.createdAt?.toMillis ? b.createdAt.toMillis() : (b.createdAt?.seconds ? b.createdAt.seconds * 1000 : 0);
    return tB - tA;
  });
  return comments.slice(0, limitCount);
}

/** Delete a comment */
export async function deleteVideoComment(commentId, videoId) {
  await deleteDoc(doc(db, 'videoComments', commentId));
  await updateDoc(doc(db, 'videos', videoId), {
    commentCount: increment(-1),
  });
}

/** Toggle comment like */
export async function toggleCommentLike(uid, commentId) {
  const likeId = `${uid}_${commentId}`;
  const likeRef = doc(db, 'commentLikes', likeId);
  const commentRef = doc(db, 'videoComments', commentId);
  const snap = await getDoc(likeRef);

  if (snap.exists()) {
    await deleteDoc(likeRef);
    await updateDoc(commentRef, { likes: increment(-1) });
    return false;
  } else {
    await setDoc(likeRef, { uid, commentId, createdAt: serverTimestamp() });
    await updateDoc(commentRef, { likes: increment(1) });
    return true;
  }
}

/** Check if user has liked a comment */
export async function hasLikedComment(uid, commentId) {
  const likeId = `${uid}_${commentId}`;
  const snap = await getDoc(doc(db, 'commentLikes', likeId));
  return snap.exists();
}

// ─── Video Captions/Subtitles ───────────────────────────────────────────────

/** Add/Update captions for a video */
export async function updateVideoCaptions(videoId, captions) {
  await updateDoc(doc(db, 'videos', videoId), {
    captions: captions || [],
  });
}

/** Get video captions */
export async function getVideoCaptions(videoId) {
  const videoSnap = await getDoc(doc(db, 'videos', videoId));
  if (!videoSnap.exists()) return [];
  return videoSnap.data().captions || [];
}
