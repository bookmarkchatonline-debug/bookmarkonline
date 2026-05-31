// src/pages/Admin/Awards.jsx
import { useState, useEffect } from 'react';
import { Trophy, Crown, Plus, Trash2, CheckCircle } from 'lucide-react';
import { getAllArtists, publishGoldTapeAward } from '../../firebase/firestore';
import toast from 'react-hot-toast';

const CATEGORIES = [
  'Best Song',
  'Producer of the Month',
  'Breakout Artist',
  'Most Consistent Creator',
  'Best Creative Idea'
];

export default function AdminAwards() {
  const [artists, setArtists] = useState([]);
  const [title, setTitle] = useState('');
  const [selections, setSelections] = useState([
    { name: 'Best Song', winnerUid: '', winnerName: '', trackTitle: '' }
  ]);
  const [publishing, setPublishing] = useState(false);

  useEffect(() => {
    getAllArtists(100).then(setArtists);
    const date = new Date();
    setTitle(`Gold Tape Awards - ${date.toLocaleString('default', { month: 'long' })} ${date.getFullYear()}`);
  }, []);

  const addCategory = () => {
    setSelections([...selections, { name: CATEGORIES[0], winnerUid: '', winnerName: '', trackTitle: '' }]);
  };

  const removeCategory = (index) => {
    setSelections(selections.filter((_, i) => i !== index));
  };

  const updateSelection = (index, field, value) => {
    const newS = [...selections];
    newS[index][field] = value;
    
    // Auto-fill winnerName if winnerUid changes
    if (field === 'winnerUid' && value) {
      const artist = artists.find(a => a.uid === value);
      if (artist) newS[index].winnerName = artist.username;
    }
    
    setSelections(newS);
  };

  const handlePublish = async () => {
    if (!title.trim()) {
      toast.error('Please provide a title');
      return;
    }
    
    const validSelections = selections.filter(s => s.name && s.winnerUid);
    if (validSelections.length === 0) {
      toast.error('Please assign at least one winner');
      return;
    }

    setPublishing(true);
    try {
      await publishGoldTapeAward({
        title,
        categories: validSelections,
        status: 'published'
      });
      toast.success('Awards published successfully!');
      // Reset
      setSelections([{ name: 'Best Song', winnerUid: '', winnerName: '', trackTitle: '' }]);
    } catch (err) {
      console.error(err);
      toast.error('Failed to publish awards');
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="page animate-fade-in" style={{ maxWidth: 800, margin: '0 auto' }}>
      <div className="section-header" style={{ marginBottom: 30 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Crown size={28} color="#facc15" />
          <h1 style={{ margin: 0 }}>Publish Gold Tape Awards</h1>
        </div>
      </div>

      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 30, display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div className="input-group">
          <label className="input-label">Award Title</label>
          <input
            className="input"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="e.g. Gold Tape Awards - October 2023"
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '1.1rem', margin: 0 }}>Categories & Winners</h3>
            <button className="btn btn-ghost btn-sm" onClick={addCategory}>
              <Plus size={14} /> Add Category
            </button>
          </div>
          
          {selections.map((sel, i) => (
            <div key={i} style={{ display: 'flex', gap: 12, padding: 16, background: 'var(--bg-glass)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', alignItems: 'flex-start' }}>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', gap: 12 }}>
                  <div className="input-group" style={{ flex: 1 }}>
                    <label className="input-label">Category</label>
                    <select 
                      className="input" 
                      value={sel.name}
                      onChange={e => updateSelection(i, 'name', e.target.value)}
                    >
                      {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                      <option value="Custom">Custom Category...</option>
                    </select>
                  </div>
                  
                  {sel.name === 'Custom' && (
                    <div className="input-group" style={{ flex: 1 }}>
                      <label className="input-label">Custom Name</label>
                      <input 
                        className="input" 
                        placeholder="Category Name"
                        onChange={e => updateSelection(i, 'name', e.target.value)}
                      />
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', gap: 12 }}>
                  <div className="input-group" style={{ flex: 1 }}>
                    <label className="input-label">Winner (Artist)</label>
                    <select 
                      className="input"
                      value={sel.winnerUid}
                      onChange={e => updateSelection(i, 'winnerUid', e.target.value)}
                    >
                      <option value="">Select Artist...</option>
                      {artists.map(a => (
                        <option key={a.uid} value={a.uid}>{a.username} ({a.stats?.totalLikes || 0} likes)</option>
                      ))}
                    </select>
                  </div>
                  
                  {sel.name === 'Best Song' && (
                    <div className="input-group" style={{ flex: 1 }}>
                      <label className="input-label">Track Title (Optional)</label>
                      <input 
                        className="input"
                        value={sel.trackTitle}
                        onChange={e => updateSelection(i, 'trackTitle', e.target.value)}
                        placeholder="Winning song title"
                      />
                    </div>
                  )}
                </div>
              </div>
              
              <button 
                className="btn-icon" 
                style={{ color: '#ef4444', marginTop: 24 }}
                onClick={() => removeCategory(i)}
                disabled={selections.length === 1}
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 12, padding: 16, background: 'rgba(250,204,21,0.1)', border: '1px solid rgba(250,204,21,0.3)', borderRadius: 'var(--radius-md)', fontSize: '0.875rem', color: '#facc15' }}>
          <strong>Note:</strong> Publishing will automatically grant Gold Tape badges to the selected artists, update their creator level to "Gold Tape Winner", and notify them via the live feed.
        </div>

        <button 
          className="btn btn-primary" 
          onClick={handlePublish}
          disabled={publishing || selections.length === 0}
          style={{ padding: 16, fontSize: '1rem', marginTop: 10 }}
        >
          {publishing ? 'Publishing Awards...' : (
            <><CheckCircle size={18} /> Publish Gold Tape Awards</>
          )}
        </button>
      </div>
    </div>
  );
}
