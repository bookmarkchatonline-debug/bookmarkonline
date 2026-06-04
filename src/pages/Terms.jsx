import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/auth.css';

export default function Terms() {
  return (
    <div className="auth-container">
      <div className="auth-card" style={{ maxWidth: '800px', width: '90%', margin: '40px auto', padding: '40px', background: 'var(--bg-card)', borderRadius: '16px', border: '1px solid var(--border)' }}>
        <h1 style={{ marginBottom: '20px', fontSize: '2rem', background: 'linear-gradient(135deg, #a855f7, #c026d3)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Terms of Service
        </h1>
        
        <div style={{ color: 'var(--text-secondary)', lineHeight: '1.6', fontSize: '0.95rem', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <p>Last updated: {new Date().toLocaleDateString()}</p>
          
          <section>
            <h2 style={{ color: 'var(--text-primary)', fontSize: '1.25rem', marginBottom: '10px' }}>1. Agreement to Terms</h2>
            <p>By accessing or using BookmarkChat, you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using or accessing this site.</p>
          </section>

          <section>
            <h2 style={{ color: 'var(--text-primary)', fontSize: '1.25rem', marginBottom: '10px' }}>2. Use License</h2>
            <p>Permission is granted to temporarily download one copy of the materials (information or software) on BookmarkChat's website for personal, non-commercial transitory viewing only.</p>
            <p style={{ marginTop: '10px' }}>This is the grant of a license, not a transfer of title, and under this license you may not:</p>
            <ul style={{ paddingLeft: '20px', marginTop: '10px' }}>
              <li>modify or copy the materials;</li>
              <li>use the materials for any commercial purpose, or for any public display (commercial or non-commercial);</li>
              <li>attempt to decompile or reverse engineer any software contained on BookmarkChat's website;</li>
              <li>remove any copyright or other proprietary notations from the materials; or</li>
              <li>transfer the materials to another person or "mirror" the materials on any other server.</li>
            </ul>
          </section>

          <section>
            <h2 style={{ color: 'var(--text-primary)', fontSize: '1.25rem', marginBottom: '10px' }}>3. User Content</h2>
            <p>You retain all of your ownership rights in your content, but you are required to grant us and other users of the site a limited license to use, store and copy that content and to distribute and make it available to third parties. You are solely responsible for your user content and the consequences of posting or publishing it.</p>
          </section>

          <section>
            <h2 style={{ color: 'var(--text-primary)', fontSize: '1.25rem', marginBottom: '10px' }}>4. Disclaimer</h2>
            <p>The materials on BookmarkChat's website are provided on an 'as is' basis. BookmarkChat makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.</p>
          </section>

          <section>
            <h2 style={{ color: 'var(--text-primary)', fontSize: '1.25rem', marginBottom: '10px' }}>5. Limitations</h2>
            <p>In no event shall BookmarkChat or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on BookmarkChat's website.</p>
          </section>
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
