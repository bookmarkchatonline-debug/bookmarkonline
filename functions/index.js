const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();
const db = admin.firestore();

// Helper: write a live feed item
async function emitLiveFeed(item) {
  const docRef = db.collection('liveFeed').doc();
  await docRef.set({ ...item, createdAt: admin.firestore.FieldValue.serverTimestamp() });
}

// On track create: increment owner's upload count and emit feed
exports.onTrackCreate = functions.firestore
  .document('tracks/{trackId}')
  .onCreate(async (snap, context) => {
    const track = snap.data();
    const uid = track.uid;
    if (!uid) return null;

    const userRef = db.collection('users').doc(uid);
    await userRef.set({
      'stats.uploads': admin.firestore.FieldValue.increment(1),
      'stats.totalLikes': admin.firestore.FieldValue.increment(0),
    }, { merge: true });

    // emit live feed
    await emitLiveFeed({
      type: 'upload',
      uid,
      username: track.username || null,
      message: 'uploaded a new snippet',
      trackId: context.params.trackId,
      trackTitle: track.title || null,
    });

    return null;
  });

// On track delete: decrement uploads
exports.onTrackDelete = functions.firestore
  .document('tracks/{trackId}')
  .onDelete(async (snap, context) => {
    const track = snap.data();
    const uid = track?.uid;
    if (!uid) return null;
    const userRef = db.collection('users').doc(uid);
    await userRef.set({ 'stats.uploads': admin.firestore.FieldValue.increment(-1) }, { merge: true });
    return null;
  });

// When a like doc is created/deleted, adjust track likes and user stats
exports.onLikeCreate = functions.firestore
  .document('likes/{likeId}')
  .onCreate(async (snap) => {
    const like = snap.data();
    if (!like?.trackId) return null;
    const trackRef = db.collection('tracks').doc(like.trackId);
    await trackRef.update({ likes: admin.firestore.FieldValue.increment(1) });

    // increment owner totalLikes (best-effort)
    const trackSnap = await trackRef.get();
    if (trackSnap.exists) {
      const ownerUid = trackSnap.data().uid;
      if (ownerUid) {
        await db.collection('users').doc(ownerUid).set({ 'stats.totalLikes': admin.firestore.FieldValue.increment(1) }, { merge: true });
      }
    }

    // emit live feed
    await emitLiveFeed({ type: 'like', uid: like.uid, trackId: like.trackId, message: 'liked a track' });
    return null;
  });

exports.onLikeDelete = functions.firestore
  .document('likes/{likeId}')
  .onDelete(async (snap) => {
    const like = snap.data();
    if (!like?.trackId) return null;
    const trackRef = db.collection('tracks').doc(like.trackId);
    await trackRef.update({ likes: admin.firestore.FieldValue.increment(-1) });

    const trackSnap = await trackRef.get();
    if (trackSnap.exists) {
      const ownerUid = trackSnap.data().uid;
      if (ownerUid) {
        await db.collection('users').doc(ownerUid).set({ 'stats.totalLikes': admin.firestore.FieldValue.increment(-1) }, { merge: true });
      }
    }

    return null;
  });

// Callable: validate upload quota for a user before allowing client upload
exports.validateUploadQuota = functions.https.onCall(async (data, context) => {
  if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'User must be signed in');
  const uid = context.auth.uid;
  const userRef = db.collection('users').doc(uid);
  const userSnap = await userRef.get();
  const user = userSnap.exists ? userSnap.data() : {};
  const plan = user.plan || 'free';
  const freeLimit = 3;

  // count tracks owned by user
  const tracksSnap = await db.collection('tracks').where('uid', '==', uid).get();
  const count = tracksSnap.size;
  if (plan === 'free' && count >= freeLimit) {
    return { allowed: false, remaining: 0, limit: freeLimit };
  }
  return { allowed: true, remaining: plan === 'free' ? Math.max(0, freeLimit - count) : null, limit: plan === 'free' ? freeLimit : null };
});

// Scheduled: compute weekly winners (runs daily, picks top of last 7 days)
exports.computeWeeklyWinners = functions.pubsub.schedule('every 24 hours').onRun(async (context) => {
  const sevenDaysAgo = admin.firestore.Timestamp.fromMillis(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const snap = await db.collection('tracks').where('createdAt', '>=', sevenDaysAgo).orderBy('likes', 'desc').limit(5).get();
  const winners = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  if (winners.length === 0) return null;
  const entry = { weekStart: admin.firestore.FieldValue.serverTimestamp(), winners: winners.map(w => ({ id: w.id, title: w.title, username: w.username })) };
  await db.collection('weeklyWinners').doc().set(entry);
  return null;
});

// Scheduled: compute monthly Gold Tape winners (runs daily; picks monthly on day 1)
exports.computeMonthlyAwards = functions.pubsub.schedule('every 24 hours').onRun(async (context) => {
  const today = new Date();
  // only run the awarding logic on the 1st of the month
  if (today.getUTCDate() !== 1) return null;

  // simple heuristic: top tracks by likes in last 30 days
  const thirtyDaysAgo = admin.firestore.Timestamp.fromMillis(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const snap = await db.collection('tracks').where('createdAt', '>=', thirtyDaysAgo).orderBy('likes', 'desc').limit(10).get();
  const tracks = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  // choose best song, breakout, most consistent (placeholder rules)
  const bestSong = tracks[0];
  const awardDoc = {
    title: `Gold Tape - ${today.getUTCMonth()}/${today.getUTCFullYear()}`,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    awards: [],
  };
  if (bestSong) {
    awardDoc.awards.push({ category: 'Best Song', trackId: bestSong.id, username: bestSong.username, title: bestSong.title });
  }

  await db.collection('awards').doc().set(awardDoc);
  return null;
});
