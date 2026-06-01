// src/pages/Landing.jsx
import { useNavigate } from 'react-router-dom';
import { useEffect, useState, useRef } from 'react';
import {
  Music, Trophy, Users, Zap, TrendingUp, Star, ArrowRight,
  Shield, Radio, Flame, ChevronDown, Play, Heart
} from 'lucide-react';
import '../styles/landing.css';

const WHY_CARDS = [
  {
    icon: Shield,
    color: '#a855f7',
    title: 'Keep 100% Ownership',
    desc: 'Your music, your rights. Always. No label contracts. No revenue splits.',
  },
  {
    icon: TrendingUp,
    color: '#22c55e',
    title: 'Get Discovered Through Rankings',
    desc: 'Fresh Streams and live rankings give every upload a fair shot at the top.',
  },
  {
    icon: Trophy,
    color: '#facc15',
    title: 'Win Gold Tape Awards',
    desc: 'Monthly awards recognising independent talent. Real recognition, real opportunities.',
  },
  {
    icon: Users,
    color: '#3b82f6',
    title: 'Build a Real Fanbase',
    desc: 'Connect directly with listeners who truly support your art — no algorithm gatekeeping.',
  },
  {
    icon: Radio,
    color: '#f43f5e',
    title: 'No Label Required',
    desc: 'No labels, no managers. Just your talent and the community that believes in it.',
  },
];

const FEATURES = [
  { icon: '🎧', label: 'Fresh Streams', desc: 'Every upload gets equal visibility' },
  { icon: '📊', label: 'Live Rankings', desc: 'Real-time community-powered charts' },
  { icon: '🏆', label: 'Gold Tape Awards', desc: 'Monthly recognition for rising artists' },
  { icon: '🌐', label: 'Artist Profiles', desc: 'A home for your brand and discography' },
  { icon: '🔥', label: 'Trending Tracks', desc: 'Discover what the community loves most' },
  { icon: '💬', label: 'Live Feed', desc: 'Stay connected with every upload & like' },
];

const STATS = [
  { value: '15K+', label: 'Active Artists' },
  { value: '120K+', label: 'Tracks Uploaded' },
  { value: '2.3M+', label: 'Monthly Listeners' },
  { value: '50+', label: 'Gold Tape Winners' },
];

const TESTIMONIALS = [
  { name: 'Kairo Beats', genre: 'Hip Hop', text: 'Went from 0 to 12.4K listeners in 30 days. BookmarkChat changed everything.', rise: '▲12.4K' },
  { name: 'Ryy', genre: 'R&B', text: 'I won a Gold Tape Award in my second month. No label. Just music and community.', rise: '▲9.8K' },
  { name: 'The Boys', genre: 'Alternative', text: 'Reached #1 trending with our latest drop. The rankings here are legit.', rise: '#1' },
];

function useCountUp(target, duration = 1800, start = false) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!start) return;
    let startTime = null;
    const step = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      setCount(Math.floor(progress * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration, start]);
  return count;
}

export default function Landing() {
  const navigate = useNavigate();
  const [statsVisible, setStatsVisible] = useState(false);
  const [waveActive, setWaveActive] = useState(false);
  const statsRef = useRef(null);

  useEffect(() => {
    setWaveActive(true);
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setStatsVisible(true); },
      { threshold: 0.3 }
    );
    if (statsRef.current) observer.observe(statsRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="landing-page">
      {/* ─── Top Nav ─────────────────────────────────────────── */}
      <nav className="landing-nav">
        <div className="landing-nav-inner">
          <div className="landing-logo">
            <div className="landing-logo-mark">B</div>
            <span>Bookmark<span className="logo-accent">Chat</span></span>
          </div>
          <div className="landing-nav-actions">
            <button className="landing-nav-link" onClick={() => navigate('/login')}>Sign In</button>
            <button className="btn btn-primary landing-nav-cta" onClick={() => navigate('/register')}>
              Sign Up Free
            </button>
          </div>
        </div>
      </nav>

      {/* ─── Hero ─────────────────────────────────────────────── */}
      <section className="landing-hero">
        <div className="landing-hero-bg">
          <div className="hero-orb hero-orb-1" />
          <div className="hero-orb hero-orb-2" />
          <div className="hero-stars" />
        </div>

        <div className="landing-hero-inner">
          <div className="landing-hero-text">
            <div className="landing-eyebrow">
              <span className="eyebrow-dot" />
              The Future of Independent Music
            </div>
            <h1 className="landing-hero-h1">
              Where Independent Artists <span className="hero-gradient-text">Get Discovered</span>{' '}
              Before the Industry Finds Them
            </h1>
            <p className="landing-hero-sub">
              BookmarkChat is the community where the next generation of artists starts.
              Upload your music, build your fanbase, compete for Gold Tape Awards — no label required.
            </p>
            <div className="landing-hero-ctas">
              <button className="btn btn-primary landing-cta-primary" onClick={() => navigate('/register')}>
                <Music size={18} /> Start for Free
              </button>
              <button className="btn btn-ghost landing-cta-ghost" onClick={() => navigate('/login')}>
                Explore the Platform <ArrowRight size={16} />
              </button>
            </div>
            <div className="landing-hero-social-proof">
              <div className="sp-avatars">
                {['K','R','V','L','T'].map((l, i) => (
                  <div key={i} className="sp-avatar" style={{ left: i * 22 }}>
                    {l}
                  </div>
                ))}
              </div>
              <span className="sp-text">Join 15,000+ independent artists building their future</span>
            </div>
          </div>

          <div className="landing-hero-visual">
            <div className="hero-img-frame">
              <img src="/hero-illustration.png" alt="Artist on stage" className="hero-illustration" />
              <div className="hero-img-overlay" />
              {/* Floating cards */}
              <div className="floating-card fc-top-right">
                <Trophy size={14} color="#facc15" />
                <span>Gold Tape Awards</span>
              </div>
              <div className="floating-card fc-bottom-left">
                <div className="live-pulse" />
                <span>Live Rankings</span>
              </div>
              <div className="floating-card fc-mid-left">
                <TrendingUp size={13} color="#22c55e" />
                <span className="fc-green">+12.4K this week</span>
              </div>
            </div>
          </div>
        </div>

        <div className="landing-scroll-hint">
          <ChevronDown size={20} />
        </div>
      </section>

      {/* ─── Why Artists Join ──────────────────────────────────── */}
      <section className="landing-why">
        <div className="landing-section-inner">
          <div className="section-label">Why Artists Choose BookmarkChat</div>
          <h2 className="landing-section-title">
            Join a Movement, Not Just a Website
          </h2>
          <p className="landing-section-sub">
            Everything you need to go from unknown to unstoppable — without signing away your music.
          </p>

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

      {/* ─── Stats ─────────────────────────────────────────────── */}
      <section className="landing-stats" ref={statsRef}>
        <div className="landing-stats-inner">
          <div className="stats-headline">Numbers Don't Lie</div>
          <div className="stats-grid">
            {STATS.map((s, i) => (
              <div key={i} className="stat-item">
                <div className="stat-value">{s.value}</div>
                <div className="stat-label">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Mission Statement ─────────────────────────────────── */}
      <section className="landing-mission">
        <div className="mission-inner">
          <div className="mission-glow" />
          <div className="mission-icon">🎙️</div>
          <blockquote className="mission-quote">
            "This is where the next generation of artists starts."
          </blockquote>
          <p className="mission-sub">
            BookmarkChat was built for the artist who's ready to be heard — without begging a label for permission.
            Every upload gets a fair chance. Every listen counts. Every artist matters.
          </p>
          <button className="btn btn-primary mission-cta" onClick={() => navigate('/register')}>
            Start Your Journey <ArrowRight size={16} />
          </button>
        </div>
      </section>

      {/* ─── Features ──────────────────────────────────────────── */}
      <section className="landing-features">
        <div className="landing-section-inner">
          <div className="section-label">Everything You Need</div>
          <h2 className="landing-section-title">Built for Independent Artists</h2>
          <div className="features-grid">
            {FEATURES.map((f, i) => (
              <div key={i} className="feature-card">
                <div className="feature-emoji">{f.icon}</div>
                <div className="feature-label">{f.label}</div>
                <div className="feature-desc">{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Testimonials ──────────────────────────────────────── */}
      <section className="landing-testimonials">
        <div className="landing-section-inner">
          <div className="section-label">Artist Success Stories</div>
          <h2 className="landing-section-title">Real Artists. Real Growth.</h2>
          <div className="testimonials-grid">
            {TESTIMONIALS.map((t, i) => (
              <div key={i} className="testimonial-card">
                <div className="testimonial-header">
                  <div className="testimonial-avatar">{t.name[0]}</div>
                  <div>
                    <div className="testimonial-name">{t.name}</div>
                    <div className="testimonial-genre">{t.genre}</div>
                  </div>
                  <div className="testimonial-rise">{t.rise}</div>
                </div>
                <p className="testimonial-text">"{t.text}"</p>
                <div className="testimonial-hearts">
                  {[...Array(5)].map((_, j) => (
                    <Heart key={j} size={12} fill="#a855f7" color="#a855f7" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Final CTA ─────────────────────────────────────────── */}
      <section className="landing-final-cta">
        <div className="final-cta-inner">
          <div className="final-cta-glow" />
          <div className="final-cta-badge">
            <Flame size={14} color="#f97316" /> Free to Join
          </div>
          <h2 className="final-cta-title">Your music deserves to be heard.</h2>
          <p className="final-cta-sub">
            Upload today and join a community that supports you — not the other way around.
          </p>
          <div className="final-cta-btns">
            <button className="btn btn-primary final-btn" onClick={() => navigate('/register')}>
              <Music size={18} /> Upload Your Track
            </button>
            <button className="btn btn-ghost final-btn" onClick={() => navigate('/login')}>
              Already have an account? Sign In
            </button>
          </div>
        </div>
      </section>

      {/* ─── Footer ─────────────────────────────────────────────── */}
      <footer className="landing-footer">
        <div className="landing-footer-inner">
          <div className="landing-logo" style={{ fontSize: '1rem' }}>
            <div className="landing-logo-mark" style={{ width: 28, height: 28, fontSize: '0.85rem' }}>B</div>
            <span>Bookmark<span className="logo-accent">Chat</span></span>
          </div>
          <p className="footer-tagline">The home for rising artists.</p>
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
