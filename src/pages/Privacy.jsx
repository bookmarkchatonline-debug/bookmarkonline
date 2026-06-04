import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/auth.css'; // Reusing auth background styles

export default function Privacy() {
  return (
    <div className="auth-container">
      <div className="auth-card" style={{ maxWidth: '800px', width: '90%', margin: '40px auto', padding: '40px', background: 'var(--bg-card)', borderRadius: '16px', border: '1px solid var(--border)' }}>
        <h1 style={{ marginBottom: '20px', fontSize: '2rem', background: 'linear-gradient(135deg, #a855f7, #c026d3)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Privacy Policy
        </h1>
        
        <div style={{ color: 'var(--text-secondary)', lineHeight: '1.6', fontSize: '0.95rem', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <p>Last updated: {new Date().toLocaleDateString()}</p>
          
          <section>
            <h2 style={{ color: 'var(--text-primary)', fontSize: '1.25rem', marginBottom: '10px' }}>1. Introduction</h2>
            <p>Welcome to BookmarkChat. We respect your privacy and are committed to protecting your personal data. This privacy policy will inform you as to how we look after your personal data when you visit our platform and tell you about your privacy rights and how the law protects you.</p>
          </section>

          <section>
            <h2 style={{ color: 'var(--text-primary)', fontSize: '1.25rem', marginBottom: '10px' }}>2. Data We Collect</h2>
            <p>We may collect, use, store and transfer different kinds of personal data about you which we have grouped together as follows:</p>
            <ul style={{ paddingLeft: '20px', marginTop: '10px' }}>
              <li><strong>Identity Data</strong> includes first name, last name, username or similar identifier.</li>
              <li><strong>Contact Data</strong> includes email address.</li>
              <li><strong>Technical Data</strong> includes internet protocol (IP) address, your login data, browser type and version, time zone setting and location, operating system and platform.</li>
              <li><strong>Profile Data</strong> includes your username and password, uploads made by you, your interests, preferences, feedback and survey responses.</li>
            </ul>
          </section>

          <section>
            <h2 style={{ color: 'var(--text-primary)', fontSize: '1.25rem', marginBottom: '10px' }}>3. How We Use Your Data</h2>
            <p>We will only use your personal data when the law allows us to. Most commonly, we will use your personal data in the following circumstances:</p>
            <ul style={{ paddingLeft: '20px', marginTop: '10px' }}>
              <li>Where we need to perform the contract we are about to enter into or have entered into with you.</li>
              <li>Where it is necessary for our legitimate interests (or those of a third party) and your interests and fundamental rights do not override those interests.</li>
              <li>Where we need to comply with a legal obligation.</li>
            </ul>
          </section>

          <section>
            <h2 style={{ color: 'var(--text-primary)', fontSize: '1.25rem', marginBottom: '10px' }}>4. Data Security</h2>
            <p>We have put in place appropriate security measures to prevent your personal data from being accidentally lost, used or accessed in an unauthorised way, altered or disclosed. In addition, we limit access to your personal data to those employees, agents, contractors and other third parties who have a business need to know.</p>
          </section>

          <section>
            <h2 style={{ color: 'var(--text-primary)', fontSize: '1.25rem', marginBottom: '10px' }}>5. Your Legal Rights</h2>
            <p>Under certain circumstances, you have rights under data protection laws in relation to your personal data, including the right to request access, correction, erasure, restriction, transfer, to object to processing, to portability of data and (where the lawful ground of processing is consent) to withdraw consent.</p>
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
