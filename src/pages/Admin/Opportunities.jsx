// src/pages/Admin/Opportunities.jsx
import { useState, useEffect } from 'react';
import { Calendar, Plus, Trash2, CheckCircle, Zap } from 'lucide-react';
import { db } from '../../firebase/config';
import { collection, addDoc, getDocs, deleteDoc, doc, serverTimestamp, query, orderBy } from 'firebase/firestore';
import toast from 'react-hot-toast';
import '../../styles/admin.css';

export default function AdminOpportunities() {
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [title, setTitle] = useState('');
  const [type, setType] = useState('Contest');
  const [description, setDescription] = useState('');
  const [requirements, setRequirements] = useState('');
  const [prize, setPrize] = useState('');
  const [deadline, setDeadline] = useState('');
  const [isUrgent, setIsUrgent] = useState(false);
  const [link, setLink] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadOpps();
  }, []);

  const loadOpps = async () => {
    try {
      const q = query(collection(db, 'opportunities'), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      setOpportunities(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error(err);
      toast.error('Failed to load opportunities');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!title || !description || !deadline) {
      toast.error('Title, description, and deadline are required');
      return;
    }

    setSubmitting(true);
    try {
      await addDoc(collection(db, 'opportunities'), {
        title,
        type,
        description,
        requirements,
        prize,
        deadline,
        isUrgent,
        link,
        createdAt: serverTimestamp(),
        isActive: true
      });
      
      toast.success('Opportunity created!');
      setTitle(''); setDescription(''); setRequirements(''); setPrize(''); setDeadline(''); setLink(''); setIsUrgent(false);
      loadOpps();
    } catch (err) {
      console.error(err);
      toast.error('Failed to create opportunity');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this opportunity?')) return;
    try {
      await deleteDoc(doc(db, 'opportunities', id));
      setOpportunities(opportunities.filter(o => o.id !== id));
      toast.success('Deleted');
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete');
    }
  };

  return (
    <div className="admin-workspace animate-fade-in" style={{ flexDirection: 'row', gap: 32, flexWrap: 'wrap' }}>
      
      <div style={{ flex: '1 1 400px' }}>
        <div className="admin-header">
          <div className="admin-title-group">
            <div className="admin-title-icon" style={{ background: 'var(--accent-soft)' }}>
              <Calendar size={28} color="var(--accent)" />
            </div>
            <div>
              <h2 className="admin-title" style={{ fontSize: '1.5rem' }}>Create Opportunity</h2>
            </div>
          </div>
        </div>

        <div className="admin-panel">
          <div className="admin-form-group">
          <div className="input-group">
            <label className="input-label">Title</label>
            <input className="input" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Summer Beat Battle" />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div className="input-group">
              <label className="input-label">Type</label>
              <select className="input" value={type} onChange={e => setType(e.target.value)}>
                <option value="Contest">Contest</option>
                <option value="Collaboration">Collaboration</option>
                <option value="Showcase">Showcase</option>
                <option value="Grant">Grant</option>
              </select>
            </div>
            <div className="input-group">
              <label className="input-label">Deadline</label>
              <input type="date" className="input" value={deadline} onChange={e => setDeadline(e.target.value)} />
            </div>
          </div>

          <div className="input-group">
            <label className="input-label">Description</label>
            <textarea className="input" value={description} onChange={e => setDescription(e.target.value)} rows={3} placeholder="What is this opportunity about?" />
          </div>

          <div className="input-group">
            <label className="input-label">Requirements (Optional)</label>
            <input className="input" value={requirements} onChange={e => setRequirements(e.target.value)} placeholder="e.g. Must have uploaded 2+ tracks" />
          </div>

          <div className="input-group">
            <label className="input-label">Prize (Optional)</label>
            <input className="input" value={prize} onChange={e => setPrize(e.target.value)} placeholder="e.g. $500 + Homepage Feature" />
          </div>

          <div className="input-group">
            <label className="input-label">Submission Link (Optional)</label>
            <input className="input" value={link} onChange={e => setLink(e.target.value)} placeholder="https://..." />
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', padding: '10px 0' }}>
            <input type="checkbox" checked={isUrgent} onChange={e => setIsUrgent(e.target.checked)} />
            <span style={{ fontSize: '0.9rem', color: isUrgent ? '#ef4444' : 'var(--text-primary)' }}><Zap size={14} style={{ display: 'inline', marginBottom: -2 }}/> Mark as Urgent/Ending Soon</span>
          </label>

            <button className="btn btn-primary" onClick={handleCreate} disabled={submitting} style={{ marginTop: 8 }}>
              <Plus size={16} /> Create Opportunity
            </button>
          </div>
        </div>
      </div>

      <div style={{ flex: '1 1 400px' }}>
        <div className="admin-header">
          <div className="admin-title-group">
            <div>
              <h2 className="admin-title" style={{ fontSize: '1.5rem' }}>Active Opportunities</h2>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {loading ? (
            <p>Loading...</p>
          ) : opportunities.length === 0 ? (
            <div className="empty-state">No active opportunities.</div>
          ) : (
            opportunities.map(opp => (
              <div key={opp.id} className="admin-card-item" style={{ border: opp.isUrgent ? '1px solid rgba(239,68,68,0.3)' : undefined }}>
                <div className="admin-card-header">
                  <div>
                    <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700 }}>{opp.type}</div>
                    <div className="admin-card-title">{opp.title}</div>
                  </div>
                  <button className="btn-icon admin-danger-text" onClick={() => handleDelete(opp.id)}>
                    <Trash2 size={16} />
                  </button>
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{opp.description}</div>
                <div className="admin-card-meta">
                  <div><strong>Deadline:</strong> {opp.deadline}</div>
                  {opp.prize && <div><strong>Prize:</strong> {opp.prize}</div>}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

    </div>
  );
}
