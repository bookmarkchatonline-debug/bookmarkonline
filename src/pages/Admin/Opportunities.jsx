// src/pages/Admin/Opportunities.jsx
import { useState, useEffect } from 'react';
import { Calendar, Plus, Trash2, CheckCircle, Zap } from 'lucide-react';
import { db } from '../../firebase/config';
import { collection, addDoc, getDocs, deleteDoc, doc, serverTimestamp, query, orderBy } from 'firebase/firestore';
import toast from 'react-hot-toast';

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
        active: true
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
    <div className="page animate-fade-in" style={{ maxWidth: 900, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>
      
      <div>
        <div className="section-header" style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Calendar size={24} color="var(--accent)" />
            <h2 style={{ margin: 0 }}>Create Opportunity</h2>
          </div>
        </div>

        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
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

      <div>
        <div className="section-header" style={{ marginBottom: 24 }}>
          <h2 style={{ margin: 0, fontSize: '1.2rem' }}>Active Opportunities</h2>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {loading ? (
            <p>Loading...</p>
          ) : opportunities.length === 0 ? (
            <div className="empty-state">No active opportunities.</div>
          ) : (
            opportunities.map(opp => (
              <div key={opp.id} style={{ background: 'var(--bg-glass)', border: `1px solid ${opp.isUrgent ? 'rgba(239,68,68,0.3)' : 'var(--border)'}`, borderRadius: 'var(--radius-md)', padding: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <div>
                    <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700 }}>{opp.type}</div>
                    <div style={{ fontWeight: 700, fontSize: '1rem' }}>{opp.title}</div>
                  </div>
                  <button className="btn-icon" style={{ color: '#ef4444' }} onClick={() => handleDelete(opp.id)}>
                    <Trash2 size={16} />
                  </button>
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 8 }}>{opp.description}</div>
                <div style={{ display: 'flex', gap: 16, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
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
