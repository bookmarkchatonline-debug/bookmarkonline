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
} from 'firebase/firestore';
import { db } from './config';

// ─── Tracks ──────────────────────────────────────────────────────────────────

/** Add a new track document */
export async function addTrack(trackData) {
  const ref = await addDoc(collection(db, 'tracks'), {
    ...trackData,
    likes: 0,
    createdAt: serverTimestamp(),
    isPublic: true,
  });
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
    where('isPublic', '==', true),
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
    where('isPublic', '==', true),
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
    where('uid', '==', uid),
    orderBy('createdAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/** Search tracks by title prefix or tag */
export async function searchTracks(term) {
  // Firestore doesn't support full-text, so we fetch all and filter client-side
  // For MVP this is fine (few tracks)
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
      return inTitle || inTags;
    });
}

/** Delete a track */
export async function deleteTrack(trackId) {
  await deleteDoc(doc(db, 'tracks', trackId));
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
    return false; // unliked
  } else {
    await setDoc(likeRef, { uid, trackId, createdAt: serverTimestamp() });
    await updateDoc(trackRef, { likes: increment(1) });
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
  // Fetch each track (Firestore doesn't support IN queries > 30 natively in some SDKs)
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

  // If username or avatarUrl is updated, cascade to all tracks owned by this user
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

