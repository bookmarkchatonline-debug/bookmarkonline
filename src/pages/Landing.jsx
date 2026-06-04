// src/pages/Landing.jsx
import { useNavigate } from 'react-router-dom';
import { useEffect, useState, useRef } from 'react';
import {
  Music, Trophy, TrendingUp, Zap, ArrowRight,
  Play, Flame, ChevronDown, Upload, Star, Radio
} from 'lucide-react';
import '../styles/landing.css';

/* ─── Platform Features (replaces fake stats) ─────────────────────────────── */
const PLATFORM_FEATURES = [
  {
    icon: TrendingUp,
    color: '#a855f7',
    label: 'Live Rankings',
    desc: 'Real-time community-powered charts. Every stream moves the needle.',
    tag: 'LIVE',
  },
  {
    icon: Zap,
    color: '#facc15',
    label: 'Fresh Drops',
    desc: 'Every upload gets equal front-page visibility. No follower count required.',
    tag: 'NEW',
  },
  {
    icon: Trophy,
    color: '#f59e0b',
    label: 'Gold Tape Awards',
    desc: 'Monthly recognition for rising independent talent. Compete. Win. Grow.',
    tag: 'MONTHLY',
  },
  {
    icon: Star,
    color: '#22c55e',
    label: 'Artist Discovery',
    desc: 'Listeners find their next favourite artist through curated genre feeds.',
    tag: 'EXPLORE',
  },
];

/* ─── Recent Drops using real album covers ──────────────────────────────────── */
const RECENT_DROPS = [
  {
    cover: '/50BE1900-5D33-42B5-975D-410967114B15.png',
    title: 'Hold The Plug',
    artist: 'MASK504',
    genre: 'Hip Hop',
    rank: 1,
  },
  {
    cover: '/6A507A63-FE01-4DD2-A50B-DB0F339AE615.jpeg',
    title: 'John 3:16',
    artist: 'MASK504',
    genre: 'Rap',
    rank: 2,
  },
  {
    cover: '/72A736BB-2659-41AE-8AC5-1EFDDB864A5A.png',
    title: 'Holy',
    artist: 'MASK504',
    genre: 'Hip Hop',
    rank: 3,
  },
];

/* ─── Why Artists Join ──────────────────────────────────────────────────────── */
const WHY_CARDS = [
  {
    icon: Upload,
    color: '#a855f7',
    title: 'Upload Music',
    desc: 'Drop your tracks directly on the platform. No label. No gatekeeping.',
  },
  {
    icon: TrendingUp,
    color: '#22c55e',
    title: 'Build Fans',
    desc: 'Live rankings give every upload a fair shot at reaching new listeners.',
  },
  {
    icon: Trophy,
    color: '#facc15',
    title: 'Earn Recognition',
    desc: 'Compete for Gold Tape Awards — monthly recognition for independent artists.',
  },
  {
    icon: Radio,
    color: '#3b82f6',
    title: 'No Label Required',
    desc: 'Keep 100% of your rights. Your music, your brand, your audience.',
  },
];

export default function Landing() {
  const navigate = useNavigate();
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [activeTrack, setActiveTrack] = useState(null);
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play().catch(() => {});
    }
  }, []);

  return (
    <div className="landing-page">

      {/* ─── Top Nav ──────────────────────────────────────────────────────── */}
      <nav className="landing-nav">
        <div className="landing-nav-inner">
          <div className="landing-logo">
            <div className="landing-logo-mark">B</div>
            <span>Bookmark<span className="logo-accent">Chat</span></span>
          </div>
          <div className="landing-nav-actions">
            <button className="landing-nav-link" onClick={() => navigate('/login')}>Sign In</button>
            <button className="btn btn-primary landing-nav-cta" onClick={() => navigate('/register')}>
              Join Free
            </button>
          </div>
        </div>
      </nav>

      {/* ─── Hero ─────────────────────────────────────────────────────────── */}
      <section className="landing-hero">
        {/* Video background */}
        <div className="hero-video-bg">
          <video
            ref={videoRef}
            className="hero-video"
            src="/C67A763E-491A-4D42-B072-A4B6BCD1A68C.mov"
            autoPlay
            muted
            loop
            playsInline
            onCanPlay={() => setVideoLoaded(true)}
          />
          <div className="hero-video-overlay" />
        </div>

        {/* Ambient orbs */}
        <div className="landing-hero-bg">
          <div className="hero-orb hero-orb-1" />
          <div className="hero-orb hero-orb-2" />
          <div className="hero-stars" />
        </div>

        <div className="landing-hero-inner">
          {/* Left: Text */}
          <div className="landing-hero-text">
            <div className="landing-eyebrow">
              <span className="eyebrow-dot" />
              Independent Music Platform
            </div>
            <h1 className="landing-hero-h1">
              Upload Music.{' '}
              <span className="hero-gradient-text">Build Fans.</span>
              {' '}Earn Recognition.
            </h1>
            <p className="landing-hero-sub">
              BookmarkChat is where independent artists discover, compete, and grow.
              Drop your music, climb the live rankings, and compete for the{' '}
              <strong className="gold-accent">Gold Tape Award</strong> — no label required.
            </p>
            <div className="landing-hero-ctas">
              <button className="landing-cta-primary" onClick={() => navigate('/register')}>
                <Upload size={18} /> Upload Your Music
              </button>
              <button className="landing-cta-ghost" onClick={() => navigate('/login')}>
                Explore Platform <ArrowRight size={16} />
              </button>
            </div>

            {/* Platform feature pills */}
            <div className="hero-feature-pills">
              <div className="feature-pill"><TrendingUp size={13} /> Live Rankings</div>
              <div className="feature-pill"><Zap size={13} /> Fresh Drops</div>
              <div className="feature-pill pill-gold"><Trophy size={13} /> Gold Tape Awards</div>
              <div className="feature-pill"><Star size={13} /> Artist Discovery</div>
            </div>
          </div>

          {/* Right: Gold Tape Award trophy + artist photo */}
          <div className="landing-hero-visual">
            <div className="hero-award-frame">
              {/* Main award image */}
              <img
                src="/hero.png"
                alt="Gold Tape Award — Monthly recognition for independent artists"
                className="hero-award-img"
              />
              {/* Artist portrait floating card */}
              <div className="hero-artist-badge">
                <img
                  src="/A8108A3F-CC10-44C2-BEF9-0EA4F67E9F1A.jpeg"
                  alt="MASK504 artist photo"
                  className="artist-badge-img"
                />
                <div className="artist-badge-info">
                  <span className="artist-badge-name">MASK504</span>
                  <span className="artist-badge-label">🏆 Gold Tape Winner</span>
                </div>
              </div>
              {/* Live ranking card */}
              <div className="hero-ranking-card">
                <div className="live-pulse" />
                <span className="ranking-label">LIVE</span>
                <span className="ranking-text">Rankings updating</span>
              </div>
            </div>
          </div>
        </div>

        <div className="landing-scroll-hint">
          <ChevronDown size={20} />
        </div>
      </section>

      {/* ─── Platform Features (replaces fake stats) ──────────────────────── */}
      <section className="landing-platform-features">
        <div className="landing-section-inner">
          <div className="section-label">Platform Features</div>
          <h2 className="landing-section-title">Discover. Upload. Compete.</h2>
          <p className="landing-section-sub">
            Everything built for the independent artist — from your first upload to your first award.
          </p>
          <div className="platform-features-grid">
            {PLATFORM_FEATURES.map((f, i) => (
              <div key={i} className="platform-feature-card" style={{ '--feat-color': f.color }}>
                <div className="pf-tag" style={{ color: f.color, borderColor: `${f.color}40`, background: `${f.color}12` }}>
                  {f.tag}
                </div>
                <div className="pf-icon" style={{ background: `${f.color}18`, color: f.color }}>
                  <f.icon size={24} />
                </div>
                <h3 className="pf-label">{f.label}</h3>
                <p className="pf-desc">{f.desc}</p>
                <div className="pf-arrow"><ArrowRight size={14} /></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Recent Drops / Rankings showcase ────────────────────────────── */}
      <section className="landing-rankings">
        <div className="landing-section-inner">
          <div className="rankings-header">
            <div>
              <div className="section-label">
                <span className="live-dot-inline" />
                Live Rankings
              </div>
              <h2 className="landing-section-title" style={{ margin: 0 }}>
                Trending Right Now
              </h2>
            </div>
            <button className="see-all-btn" onClick={() => navigate('/login')}>
              See All Charts <ArrowRight size={14} />
            </button>
          </div>

          <div className="rankings-tracks">
            {RECENT_DROPS.map((track, i) => (
              <div
                key={i}
                className={`track-row ${activeTrack === i ? 'track-row-active' : ''}`}
                onClick={() => setActiveTrack(activeTrack === i ? null : i)}
              >
                <div className="track-rank">
                  <span className="rank-num">#{track.rank}</span>
                </div>
                <div className="track-cover-wrap">
                  <img src={track.cover} alt={track.title} className="track-cover" />
                  <div className="track-play-overlay">
                    <Play size={16} fill="white" color="white" />
                  </div>
                </div>
                <div className="track-info">
                  <div className="track-title">{track.title}</div>
                  <div className="track-artist">{track.artist} · {track.genre}</div>
                </div>
                <div className="track-waveform">
                  {[...Array(12)].map((_, j) => (
                    <div
                      key={j}
                      className={`waveform-bar ${activeTrack === i ? 'waveform-active' : ''}`}
                      style={{ height: `${20 + Math.sin(j * 1.2) * 14}px` }}
                    />
                  ))}
                </div>
                <div className="track-badge-trending">
                  <Flame size={12} /> Trending
                </div>
              </div>
            ))}
          </div>

          <div className="rankings-cta-row">
            <p className="rankings-cta-text">
              Upload your track and see where you rank in the community.
            </p>
            <button className="rankings-upload-btn" onClick={() => navigate('/register')}>
              <Upload size={16} /> Start Uploading
            </button>
          </div>
        </div>
      </section>

      {/* ─── Gold Tape Award Spotlight ────────────────────────────────────── */}
      <section className="landing-award-spotlight">
        <div className="award-spotlight-inner">
          <div className="award-spotlight-visual">
            <div className="award-glow-ring" />
            <img
              src="/hero.png"
              alt="Gold Tape Award"
              className="award-spotlight-trophy"
            />
          </div>
          <div className="award-spotlight-content">
            <div className="section-label" style={{ color: '#facc15' }}>Monthly Awards</div>
            <h2 className="landing-section-title award-title">
              The <span className="gold-gradient-text">Gold Tape Award</span>
            </h2>
            <p className="landing-section-sub" style={{ marginBottom: 28 }}>
              Every month, the community crowns the most impactful independent artist.
              No label backing needed — just raw talent and real listeners.
            </p>
            <ul className="award-list">
              <li><Trophy size={15} color="#facc15" /> Voted by the community</li>
              <li><TrendingUp size={15} color="#a855f7" /> Based on real streams &amp; engagement</li>
              <li><Star size={15} color="#22c55e" /> Open to every artist on the platform</li>
              <li><Zap size={15} color="#3b82f6" /> Winners featured on the homepage</li>
            </ul>
            <button className="btn btn-primary mission-cta" onClick={() => navigate('/register')}>
              Compete for Gold Tape <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </section>

      {/* ─── Artist Showcase ──────────────────────────────────────────────── */}
      <section className="landing-artist-showcase">
        <div className="landing-section-inner">
          <div className="section-label">Featured Artists</div>
          <h2 className="landing-section-title">Artists on the Platform</h2>
          <p className="landing-section-sub">
            Discover music from independent artists building their fanbase right now.
          </p>
          <div className="artist-cards-grid">
            {/* Album card 1 */}
            <div className="artist-album-card" onClick={() => navigate('/login')}>
              <div className="album-cover-wrap">
                <img
                  src="/50BE1900-5D33-42B5-975D-410967114B15.png"
                  alt="MASK504 - Hold The Plug"
                  className="album-cover-img"
                />
                <div className="album-play-btn"><Play size={20} fill="white" color="white" /></div>
                <div className="album-rank-badge">#1</div>
              </div>
              <div className="album-card-info">
                <div className="album-card-title">Hold The Plug</div>
                <div className="album-card-artist">MASK504</div>
                <div className="album-card-genre">Hip Hop · New Orleans</div>
              </div>
            </div>
            {/* Album card 2 */}
            <div className="artist-album-card" onClick={() => navigate('/login')}>
              <div className="album-cover-wrap">
                <img
                  src="/6A507A63-FE01-4DD2-A50B-DB0F339AE615.jpeg"
                  alt="MASK504 - John 3:16"
                  className="album-cover-img"
                />
                <div className="album-play-btn"><Play size={20} fill="white" color="white" /></div>
                <div className="album-rank-badge">#2</div>
              </div>
              <div className="album-card-info">
                <div className="album-card-title">John 3:16</div>
                <div className="album-card-artist">MASK504</div>
                <div className="album-card-genre">Rap · Dark</div>
              </div>
            </div>
            {/* Album card 3 */}
            <div className="artist-album-card" onClick={() => navigate('/login')}>
              <div className="album-cover-wrap">
                <img
                  src="/72A736BB-2659-41AE-8AC5-1EFDDB864A5A.png"
                  alt="MASK504 - Holy"
                  className="album-cover-img"
                />
                <div className="album-play-btn"><Play size={20} fill="white" color="white" /></div>
                <div className="album-rank-badge">#3</div>
              </div>
              <div className="album-card-info">
                <div className="album-card-title">Holy</div>
                <div className="album-card-artist">MASK504</div>
                <div className="album-card-genre">Hip Hop · Gospel Rap</div>
              </div>
            </div>
            {/* Artist photo card */}
            <div className="artist-profile-card" onClick={() => navigate('/login')}>
              <div className="artist-profile-photo-wrap">
                <img
                  src="/A8108A3F-CC10-44C2-BEF9-0EA4F67E9F1A.jpeg"
                  alt="MASK504 artist"
                  className="artist-profile-photo"
                />
                <div className="artist-profile-overlay">
                  <div className="artist-profile-name">MASK504</div>
                  <div className="artist-profile-tag">🏆 Gold Tape Artist</div>
                  <button className="artist-follow-btn">View Profile</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Why Join ─────────────────────────────────────────────────────── */}
      <section className="landing-why">
        <div className="landing-section-inner">
          <div className="section-label">Why Artists Choose BookmarkChat</div>
          <h2 className="landing-section-title">Built Different. Built for You.</h2>
          <div className="why-cards-grid">
            {WHY_CARDS.map((card, i) => (
              <div key={i} className="why-card" style={{ '--card-accent': card.color }}>
                <div className="why-card-icon" style={{ background: `${card.color}18`, color: card.color }}>
                  <card.icon size={22} />
                </div>
                <h3 className="why-card-title">{card.title}</h3>
                <p className="why-card-desc">{card.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Final CTA ────────────────────────────────────────────────────── */}
      <section className="landing-final-cta">
        <div className="final-cta-inner">
          <div className="final-cta-glow" />
          <img src="/hero.png" alt="Gold Tape Award" className="final-cta-trophy" />
          <div className="final-cta-badge">
            <Flame size={14} color="#f97316" /> Free to Join
          </div>
          <h2 className="final-cta-title">Your music deserves to be heard.</h2>
          <p className="final-cta-sub">
            Upload today. Build your fanbase. Compete for the Gold Tape Award.
          </p>
          <div className="final-cta-btns">
            <button className="final-btn btn-primary" onClick={() => navigate('/register')}>
              <Upload size={18} /> Upload Your Music
            </button>
            <button className="final-btn btn-ghost" onClick={() => navigate('/login')}>
              Already have an account? Sign In
            </button>
          </div>
        </div>
      </section>

      {/* ─── Footer ───────────────────────────────────────────────────────── */}
      <footer className="landing-footer">
        <div className="landing-footer-inner">
          <div className="landing-logo" style={{ fontSize: '1rem' }}>
            <div className="landing-logo-mark" style={{ width: 28, height: 28, fontSize: '0.85rem' }}>B</div>
            <span>Bookmark<span className="logo-accent">Chat</span></span>
          </div>
          <p className="footer-tagline">The home for rising independent artists.</p>
          <div className="footer-links">
            <button onClick={() => navigate('/login')}>Sign In</button>
            <button onClick={() => navigate('/register')}>Sign Up</button>
          </div>
          <p className="footer-copy">© {new Date().getFullYear()} BookmarkChat. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
