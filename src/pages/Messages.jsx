// src/pages/Messages.jsx
import { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase/config';
import { collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp, getDocs, limit, doc, getDoc, setDoc } from 'firebase/firestore';
import { Send, ArrowLeft, MessageSquare } from 'lucide-react';
import toast from 'react-hot-toast';
import '../styles/pages.css';

export default function Messages() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { chatId } = useParams();
  
  const [chats, setChats] = useState([]);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loadingChats, setLoadingChats] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [activeChatInfo, setActiveChatInfo] = useState(null);
  
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    const q = query(
      collection(db, 'chats'),
      where('participants', 'array-contains', user.uid),
      orderBy('updatedAt', 'desc')
    );

    const unsub = onSnapshot(q, async (snap) => {
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
      setChats(chatsData);
      setLoadingChats(false);
    });

    return () => unsub();
  }, [user, navigate]);

  useEffect(() => {
    if (!chatId || !user) return;

    setLoadingMessages(true);
    const chatInfo = chats.find(c => c.id === chatId);
    if (chatInfo) setActiveChatInfo(chatInfo);
    else {
      // Fetch chat info if directly navigated
      getDoc(doc(db, 'chats', chatId)).then(async snap => {
        if (snap.exists()) {
          const data = snap.data();
          const otherUid = data.participants.find(p => p !== user.uid);
          let otherUser = { username: 'Unknown', avatarUrl: null };
          if (otherUid) {
            const userSnap = await getDoc(doc(db, 'users', otherUid));
            if (userSnap.exists()) otherUser = userSnap.data();
          }
          setActiveChatInfo({ id: snap.id, ...data, otherUser, otherUid });
        }
      });
    }

    const q = query(
      collection(db, `chats/${chatId}/messages`),
      orderBy('createdAt', 'asc')
    );

    const unsub = onSnapshot(q, (snap) => {
      const msgs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setMessages(msgs);
      setLoadingMessages(false);
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    });

    return () => unsub();
  }, [chatId, user, chats]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !chatId || !user) return;

    const msgText = newMessage.trim();
    setNewMessage('');

    try {
      await addDoc(collection(db, `chats/${chatId}/messages`), {
        text: msgText,
        senderId: user.uid,
        createdAt: serverTimestamp()
      });
      await setDoc(doc(db, 'chats', chatId), {
        lastMessage: msgText,
        updatedAt: serverTimestamp()
      }, { merge: true });
    } catch (err) {
      toast.error('Failed to send message');
      console.error(err);
    }
  };

  if (!user) return null;

  return (
    <div className="page messages-page animate-fade-in" style={{ display: 'flex', height: 'calc(100vh - 60px)', padding: 0, overflow: 'hidden' }}>
      
      {/* Sidebar - Chat List */}
      <div className="messages-sidebar" style={{ width: '320px', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', background: 'var(--bg-elevated)', flexShrink: 0, display: chatId && window.innerWidth < 768 ? 'none' : 'flex' }}>
        <div style={{ padding: '20px', borderBottom: '1px solid var(--border)' }}>
          <h2 style={{ margin: 0, fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <MessageSquare size={20} color="var(--accent)" /> Messages
          </h2>
        </div>
        
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {loadingChats ? (
            <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading chats...</div>
          ) : chats.length === 0 ? (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
              No messages yet. Visit an artist's profile to start a conversation!
            </div>
          ) : (
            chats.map(chat => (
              <div 
                key={chat.id} 
                onClick={() => navigate(`/messages/${chat.id}`)}
                style={{ 
                  padding: '16px 20px', 
                  borderBottom: '1px solid var(--border)', 
                  cursor: 'pointer',
                  background: chatId === chat.id ? 'rgba(255,255,255,0.05)' : 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}
              >
                {chat.otherUser?.avatarUrl ? (
                  <img src={chat.otherUser.avatarUrl} alt={chat.otherUser.username} style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--bg-card)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                    {(chat.otherUser?.username || '?').charAt(0).toUpperCase()}
                  </div>
                )}
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{chat.otherUser?.username}</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {chat.lastMessage || 'No messages yet'}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="messages-main" style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--bg-base)' }}>
        {chatId ? (
          <>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', gap: '12px' }}>
              {window.innerWidth < 768 && (
                <button className="btn-icon" onClick={() => navigate('/messages')} style={{ marginRight: '8px' }}>
                  <ArrowLeft size={20} />
                </button>
              )}
              {activeChatInfo?.otherUser?.avatarUrl ? (
                <img src={activeChatInfo.otherUser.avatarUrl} alt="" style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }} />
              ) : (
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--bg-card)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                  {(activeChatInfo?.otherUser?.username || '?').charAt(0).toUpperCase()}
                </div>
              )}
              <div style={{ fontWeight: 600 }}>{activeChatInfo?.otherUser?.username || 'Loading...'}</div>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {loadingMessages ? (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Loading messages...</div>
              ) : messages.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', margin: 'auto' }}>
                  Start the conversation!
                </div>
              ) : (
                messages.map(msg => {
                  const isMine = msg.senderId === user.uid;
                  return (
                    <div key={msg.id} style={{ display: 'flex', justifyContent: isMine ? 'flex-end' : 'flex-start' }}>
                      <div style={{ 
                        maxWidth: '70%', 
                        padding: '10px 14px', 
                        borderRadius: '16px',
                        background: isMine ? 'var(--accent)' : 'var(--bg-elevated)',
                        color: isMine ? '#fff' : 'var(--text-primary)',
                        borderBottomRightRadius: isMine ? '4px' : '16px',
                        borderBottomLeftRadius: !isMine ? '4px' : '16px',
                        fontSize: '0.95rem'
                      }}>
                        {msg.text}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border)', background: 'var(--bg-elevated)' }}>
              <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '10px' }}>
                <input 
                  type="text" 
                  className="input" 
                  placeholder="Type a message..." 
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  style={{ flex: 1, borderRadius: '24px', padding: '10px 16px' }}
                />
                <button type="submit" className="btn btn-primary" style={{ borderRadius: '50%', width: '42px', height: '42px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }} disabled={!newMessage.trim()}>
                  <Send size={18} />
                </button>
              </form>
            </div>
          </>
        ) : (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', padding: '20px', textAlign: 'center' }}>
            <MessageSquare size={48} style={{ opacity: 0.2, marginBottom: '16px' }} />
            <h2>Your Messages</h2>
            <p>Select a conversation or start a new one from an artist's profile.</p>
          </div>
        )}
      </div>
    </div>
  );
}
