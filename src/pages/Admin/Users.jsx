// src/pages/Admin/Users.jsx
import { useState, useEffect } from 'react';
import { Users, Crown, Save, Search, Trash2, Shield } from 'lucide-react';
import { db } from '../../firebase/config';
import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import { deleteUserAdmin, updateUserRole } from '../../firebase/firestore';
import toast from 'react-hot-toast';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      // Just fetch all users for now. For large apps, pagination is better.
      const snap = await getDocs(collection(db, 'users'));
      const fetchedUsers = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      // Sort by creation date if available, otherwise by name
      fetchedUsers.sort((a, b) => {
        const timeA = a.createdAt?.seconds || 0;
        const timeB = b.createdAt?.seconds || 0;
        return timeB - timeA;
      });
      setUsers(fetchedUsers);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePlan = async (userId, newPlan) => {
    try {
      await updateDoc(doc(db, 'users', userId), { plan: newPlan });
      toast.success('User plan updated successfully');
      setUsers(users.map(u => u.id === userId ? { ...u, plan: newPlan } : u));
    } catch (err) {
      console.error(err);
      toast.error('Failed to update plan');
    }
  };

  const handleUpdateExpiry = async (userId, newExpiry) => {
    try {
      await updateDoc(doc(db, 'users', userId), { planExpiry: newExpiry });
      toast.success('User plan expiry updated successfully');
      setUsers(users.map(u => u.id === userId ? { ...u, planExpiry: newExpiry } : u));
    } catch (err) {
      console.error(err);
      toast.error('Failed to update plan expiry');
    }
  };

  const handleUpdateRole = async (userId, newRole) => {
    try {
      await updateUserRole(userId, newRole);
      toast.success('User role updated successfully');
      setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
    } catch (err) {
      console.error(err);
      toast.error('Failed to update role');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user? This will remove their profile.')) return;
    try {
      await deleteUserAdmin(userId);
      setUsers(users.filter(u => u.id !== userId));
      toast.success('User deleted successfully');
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete user');
    }
  };

  const filteredUsers = users.filter(u => 
    (u.username || '').toLowerCase().includes(search.toLowerCase()) ||
    (u.email || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="page animate-fade-in" style={{ maxWidth: 1000, margin: '0 auto', padding: '24px' }}>
      
      <div className="section-header" style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Users size={24} color="var(--accent)" />
          <h2 style={{ margin: 0 }}>Manage User Plans</h2>
        </div>
        
        <div className="artist-dir-search" style={{ margin: 0, width: '300px' }}>
          <Search size={16} className="artist-dir-search-icon" style={{ left: 12 }} />
          <input
            type="search"
            placeholder="Search users by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input"
            style={{ paddingLeft: 36 }}
          />
        </div>
      </div>

      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: 'var(--bg-glass)', borderBottom: '1px solid var(--border)' }}>
              <th style={{ padding: '16px', fontWeight: 600, color: 'var(--text-secondary)' }}>User</th>
              <th style={{ padding: '16px', fontWeight: 600, color: 'var(--text-secondary)' }}>Email</th>
              <th style={{ padding: '16px', fontWeight: 600, color: 'var(--text-secondary)' }}>Role</th>
              <th style={{ padding: '16px', fontWeight: 600, color: 'var(--text-secondary)' }}>Current Plan</th>
              <th style={{ padding: '16px', fontWeight: 600, color: 'var(--text-secondary)' }}>Expiry Date</th>
              <th style={{ padding: '16px', fontWeight: 600, color: 'var(--text-secondary)', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="6" style={{ padding: '24px', textAlign: 'center' }}>Loading users...</td></tr>
            ) : filteredUsers.length === 0 ? (
              <tr><td colSpan="6" style={{ padding: '24px', textAlign: 'center' }}>No users found.</td></tr>
            ) : (
              filteredUsers.map(user => (
                <tr key={user.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      {user.avatarUrl ? (
                        <img src={user.avatarUrl} alt={user.username} style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--bg-glass)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 700 }}>
                          {(user.username || 'U').slice(0,2).toUpperCase()}
                        </div>
                      )}
                      <span style={{ fontWeight: 600 }}>{user.username || 'Unnamed'}</span>
                    </div>
                  </td>
                  <td style={{ padding: '16px', color: 'var(--text-secondary)' }}>{user.email || 'N/A'}</td>
                  <td style={{ padding: '16px' }}>
                    <select 
                      className="input" 
                      style={{ padding: '6px 12px', fontSize: '0.75rem', width: 'auto', display: 'inline-block', background: 'var(--bg-glass)', border: 'none', textTransform: 'uppercase' }}
                      value={user.role || 'listener'}
                      onChange={(e) => handleUpdateRole(user.id, e.target.value)}
                    >
                      <option value="listener">Listener</option>
                      <option value="artist">Artist</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                  <td style={{ padding: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      {user.plan === 'gold_creator' ? <Crown size={14} color="#facc15" /> : null}
                      <span style={{ 
                        fontWeight: 600, 
                        color: user.plan === 'gold_creator' ? '#facc15' : user.plan === 'creator_pro' ? '#a855f7' : 'var(--text-primary)' 
                      }}>
                        {user.plan === 'gold_creator' ? 'Gold Creator' : user.plan === 'creator_pro' ? 'Creator Pro' : 'Free Artist'}
                      </span>
                    </div>
                  </td>
                  <td style={{ padding: '16px' }}>
                    <input 
                      type="date"
                      className="input"
                      style={{ padding: '6px 12px', fontSize: '0.75rem', width: 'auto', background: 'var(--bg-glass)', border: 'none' }}
                      value={user.planExpiry || ''}
                      onChange={(e) => handleUpdateExpiry(user.id, e.target.value)}
                    />
                  </td>
                  <td style={{ padding: '16px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
                      <select 
                        className="input" 
                        style={{ padding: '6px 12px', fontSize: '0.85rem', width: 'auto', display: 'inline-block' }}
                        value={user.plan || 'free'}
                        onChange={(e) => handleUpdatePlan(user.id, e.target.value)}
                      >
                        <option value="free">Free</option>
                        <option value="creator_pro">Creator Pro ($9.99/mo)</option>
                        <option value="gold_creator">Gold Creator ($24.99/mo)</option>
                      </select>
                      <button 
                        className="btn-icon" 
                        onClick={() => handleDeleteUser(user.id)}
                        title="Delete User"
                        style={{ color: '#ef4444' }}
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
