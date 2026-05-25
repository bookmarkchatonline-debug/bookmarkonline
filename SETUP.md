# BookmarkChat.online — Setup Guide

## 1. Firebase Setup (Free Spark Plan)

### 1.1 Create Project
1. Go to https://console.firebase.google.com
2. Click **Add project** → name it `bookmarkchat`
3. Disable Google Analytics (not needed for MVP)

### 1.2 Enable Authentication
1. In Firebase console → **Build → Authentication**
2. Click **Get started**
3. Enable **Email/Password**
4. Enable **Google** (requires OAuth consent screen — use your email)

### 1.3 Enable Firestore
1. **Build → Firestore Database → Create database**
2. Choose **production mode**
3. Pick a region (e.g., `us-central`)
4. After creation, go to **Rules** tab and paste the content of `firestore.rules`

### 1.4 Get Your Config
1. **Project Settings** (gear icon) → **General** → scroll to **Your apps**
2. Click **Web app** (</> icon) → register app as `bookmarkchat-web`
3. Copy the `firebaseConfig` object — you'll need these values

### 1.5 Deploy Indexes
```bash
npm install -g firebase-tools
firebase login
firebase init firestore  # select your project
firebase deploy --only firestore:indexes
```

---

## 2. Cloudinary Setup (Free Plan)

### 2.1 Create Account
1. Go to https://cloudinary.com → Sign up (free)
2. Note your **Cloud Name** from the dashboard

### 2.2 Create Upload Presets
Go to **Settings → Upload → Upload presets → Add upload preset**

**Preset 1 — Audio:**
- Preset name: `bookmarkchat_audio`
- Signing mode: **Unsigned**
- Folder: `bookmarkchat/audio`
- Resource type: Auto (or Video — Cloudinary treats audio as video)

**Preset 2 — Images:**
- Preset name: `bookmarkchat_covers`
- Signing mode: **Unsigned**
- Folder: `bookmarkchat/covers`

---

## 3. Environment Variables

Edit the `.env` file in the project root:

```env
# Firebase
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=bookmarkchat-xxx.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=bookmarkchat-xxx
VITE_FIREBASE_STORAGE_BUCKET=bookmarkchat-xxx.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123...

# Cloudinary
VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name
VITE_CLOUDINARY_AUDIO_PRESET=bookmarkchat_audio
VITE_CLOUDINARY_IMAGE_PRESET=bookmarkchat_covers
```

---

## 4. Run Locally

```bash
npm install
npm run dev
```

Visit http://localhost:5173

---

## 5. Deploy to Vercel (Free)

```bash
npm install -g vercel
vercel
```

Or connect your GitHub repo at https://vercel.com/new

**Add environment variables** in Vercel dashboard → Project Settings → Environment Variables (same as your `.env` file)

### Custom Domain
1. In Vercel dashboard → Domains → Add `bookmarkchat.online`
2. Add CNAME record at your DNS provider pointing to `cname.vercel-dns.com`

---

## 6. Firestore Security Rules

The `firestore.rules` file is already configured. Deploy with:
```bash
firebase deploy --only firestore:rules
```

---

## Cost Summary (MVP)

| Service | Plan | Cost |
|---------|------|------|
| Firebase Auth | Spark (free) | $0 |
| Firestore | Spark (free) — 50k reads/day | $0 |
| Cloudinary | Free — 25GB storage, 25GB/mo bandwidth | $0 |
| Vercel | Hobby (free) | $0 |
| Domain | BookmarkChat.online | ~$10-15/year |

**Total: ~$10-15/year** (domain only)
