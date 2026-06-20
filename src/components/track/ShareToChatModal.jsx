// src/components/track/ShareToChatModal.jsx
import { useState, useEffect } from 'react';
import { X, Send, Search, MessageSquare } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../firebase/config';
import { collection, query, where, getDocs, addDoc, serverTimestamp, doc, setDoc, getDoc } from 'firebase/firestore';
import toast from 'react-hot-toast';
import '../../styles/components.css';

export default function ShareToChatModal({ isOpen, onClose, track }) {
  const { user } = useAuth();
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedChatId, setSelectedChatId] = useState(null);
  const [messageText, setMessageText] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!isOpen || !user) return;

    const fetchChats = async () => {
      setLoading(true);
      try {
        const q = query(collection(db, 'chats'), where('participants', 'array-contains', user.uid));
        const snap = await getDocs(q);
        
        const chatsData = await Promise.all(snap.docs.map(async (d) => {
          const data = d.data();
          const otherUid = data.participants.find(p => p !== user.uid);
          let otherUser = { username: 'Unknown', avatarUrl: null };
          if (otherUid) {
            const userSnap = await getDoc(doc(db, 'users', otherUid));
            if (userSnap.exists()) {
              otherUser = userSnap.data();
            }
          }
          return { id: d.id, ...data, otherUser, otherUid };
        }));
        
        // Sort by updatedAt
        chatsData.sort((a, b) => (b.updatedAt?.toMillis() || 0) - (a.updatedAt?.toMillis() || 0));
        setChats(chatsData);
      } catch (err) {
        console.error('Failed to fetch chats', err);
      }
      setLoading(false);
    };

    fetchChats();
  }, [isOpen, user]);

  const handleShare = async () => {
    if (!selectedChatId || !track || !user) return;

    setSending(true);
    try {
      const sharedTrack = {
        id: track.id,
        title: track.title || 'Untitled',
        artist: track.username || 'Unknown',
        coverUrl: track.coverUrl || null
      };

      await addDoc(collection(db, `chats/${selectedChatId}/messages`), {
        text: messageText.trim(),
        senderId: user.uid,
        createdAt: serverTimestamp(),
        status: 'sent',
        sharedTrack
      });

      await setDoc(doc(db, 'chats', selectedChatId), {
        lastMessage: messageText.trim() ? `Shared a track: ${messageText}` : `Shared a track: ${track.title}`,
        updatedAt: serverTimestamp()
      }, { merge: true });

      toast.success('Track shared!');
      onClose();
      setMessageText('');
      setSelectedChatId(null);
    } catch (err) {
      console.error(err);
      toast.error('Failed to share track');
    }
    setSending(false);
  };

  if (!isOpen) return null;

  const filteredChats = chats.filter(c => 
    c.otherUser?.username?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 1050 }}>
      <div 
        className="modal-content animate-scale-in" 
        onClick={e => e.stopPropagation()}
        style={{ width: '100%', maxWidth: '400px', background: 'var(--bg-card)' }}
      >
        <div className="modal-header">
          <h3 style={{ margin: 0, fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Send size={18} color="var(--accent)" /> Share Track
          </h3>
          <button className="btn-icon" onClick={onClose}><X size={18} /></button>
        </div>
        
        <div className="modal-body" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Track Preview */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: 'var(--bg-elevated)', borderRadius: '12px' }}>
            <img src={track.coverUrl || '/placeholder.png'} alt="" style={{ width: 48, height: 48, borderRadius: '6px', objectFit: 'cover' }} />
            <div>
              <div style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>{track.title}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{track.username}</div>
            </div>
          </div>

          <div style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              className="input" 
              placeholder="Search conversations..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ paddingLeft: '36px' }}
            />
          </div>

          <div style={{ flex: 1, overflowY: 'auto', maxHeight: '250px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>Loading chats...</div>
            ) : filteredChats.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>
                {searchQuery ? 'No matching chats' : 'No active conversations'}
              </div>
            ) : (
              filteredChats.map(chat => (
                <div 
                  key={chat.id}
                  onClick={() => setSelectedChatId(chat.id)}
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '12px', 
                    padding: '10px 12px', 
                    borderRadius: '8px',
                    cursor: 'pointer',
                    background: selectedChatId === chat.id ? 'var(--accent-soft)' : 'transparent',
                    border: `1px solid ${selectedChatId === chat.id ? 'var(--accent)' : 'transparent'}`,
                    transition: 'all 0.2s'
                  }}
                >
                  {chat.otherUser?.avatarUrl ? (
                    <img src={chat.otherUser.avatarUrl} alt="" style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                      {(chat.otherUser?.username || '?').charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div style={{ fontWeight: '600', fontSize: '0.9rem', flex: 1 }}>{chat.otherUser?.username}</div>
                  {selectedChatId === chat.id && <Check size={16} color="var(--accent)" />}
                </div>
              ))
            )}
          </div>

          {selectedChatId && (
            <div>
              <input 
                type="text" 
                className="input" 
                placeholder="Add a message (optional)..." 
                value={messageText}
                onChange={e => setMessageText(e.target.value)}
              />
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose} disabled={sending}>Cancel</button>
          <button 
            className="btn btn-primary" 
            onClick={handleShare} 
            disabled={!selectedChatId || sending}
          >
            {sending ? 'Sending...' : 'Send'}
          </button>
        </div>
      </div>
    </div>
  );
}
