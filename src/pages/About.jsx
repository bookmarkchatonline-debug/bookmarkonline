import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/auth.css';

export default function About() {
  return (
    <div className="auth-container">
      <div className="auth-card" style={{ maxWidth: '800px', width: '90%', margin: '40px auto', padding: '40px', background: 'var(--bg-card)', borderRadius: '16px', border: '1px solid var(--border)' }}>
        <h1 style={{ marginBottom: '20px', fontSize: '2rem', background: 'linear-gradient(135deg, #a855f7, #c026d3)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          About BookmarkChat
        </h1>
        
        <div style={{ color: 'var(--text-secondary)', lineHeight: '1.6', fontSize: '1.05rem', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <p>
            BookmarkChat is the ultimate platform for independent artists and music enthusiasts. We are dedicated to providing a space where emerging talent can thrive, connect with fans, and find life-changing opportunities.
          </p>
          
          <div style={{ marginTop: '20px' }}>
            <h2 style={{ color: 'var(--text-primary)', fontSize: '1.35rem', marginBottom: '10px' }}>Our Mission</h2>
            <p>
              Our mission is to democratize the music industry by giving independent artists the tools they need to succeed. Whether it's through community engagement, exclusive opportunities, or fair discovery algorithms, we are here to support your journey.
            </p>
          </div>

          <div style={{ marginTop: '20px' }}>
            <h2 style={{ color: 'var(--text-primary)', fontSize: '1.35rem', marginBottom: '10px' }}>What We Offer</h2>
            <ul style={{ paddingLeft: '20px', marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <li><strong>Fair Discovery:</strong> Get your music heard by real people, not just algorithms.</li>
              <li><strong>Exclusive Opportunities:</strong> Apply for gigs, label meetings, and brand partnerships directly on the platform.</li>
              <li><strong>Vibrant Community:</strong> Connect with other artists, producers, and fans who share your passion.</li>
              <li><strong>Artist Development:</strong> Access resources and tools designed to help you grow your career.</li>
            </ul>
          </div>
          
          <div style={{ marginTop: '20px', padding: '20px', background: 'rgba(168, 85, 247, 0.1)', borderRadius: '12px', border: '1px solid rgba(168, 85, 247, 0.2)' }}>
            <h3 style={{ color: '#a855f7', fontSize: '1.2rem', marginBottom: '10px' }}>Join the Movement</h3>
            <p style={{ margin: 0 }}>
              Whether you're an artist looking for your big break or a listener searching for your new favorite track, BookmarkChat is the place to be.
            </p>
          </div>
        </div>

        <div style={{ marginTop: '40px', paddingTop: '20px', borderTop: '1px solid var(--border)', textAlign: 'center' }}>
          <Link to="/" style={{ color: '#a855f7', textDecoration: 'none', fontWeight: 500 }}>
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
