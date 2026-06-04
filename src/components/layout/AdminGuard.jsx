import { useState } from 'react';
import { Lock } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

export default function AdminGuard({ children }) {
  const { user, profile } = useAuth();
  
  // Also allow Firebase auth users who are marked as admin, or explicitly the owner email.
  const isFirebaseAdmin = profile?.role === 'admin' || user?.email === 'bookmarkchatonline@gmail.com';
  
  const [isAuthenticated, setIsAuthenticated] = useState(
    isFirebaseAdmin || sessionStorage.getItem('adminAuth') === 'true'
  );
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  if (isAuthenticated || isFirebaseAdmin) {
    return children;
  }

  const handleLogin = (e) => {
    e.preventDefault();
    if (email === 'bookmarkchatonline@gmail.com' && password === 'BookMarkChatOnline@@2026') {
      sessionStorage.setItem('adminAuth', 'true');
      setIsAuthenticated(true);
      toast.success('Admin access granted');
    } else {
      toast.error('Invalid admin credentials');
    }
  };

  return (
    <div className="page animate-fade-in" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
      <div style={{ background: 'var(--bg-card)', padding: '40px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', maxWidth: '400px', width: '100%', textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
          <div style={{ width: 48, height: 48, background: 'var(--bg-glass)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Lock size={24} color="var(--accent)" />
          </div>
        </div>
        <h2 style={{ marginBottom: '10px' }}>Admin Access Required</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '30px', fontSize: '0.9rem' }}>Please enter the admin credentials to access this area.</p>
        
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="input-group">
            <input 
              type="email" 
              className="input" 
              placeholder="Admin Email" 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              required
            />
          </div>
          <div className="input-group">
            <input 
              type="password" 
              className="input" 
              placeholder="Admin Password" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              required
            />
          </div>
          <button type="submit" className="btn btn-primary" style={{ marginTop: '10px' }}>
            Access Admin Area
          </button>
        </form>
      </div>
    </div>
  );
}
