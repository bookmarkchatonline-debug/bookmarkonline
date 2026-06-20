// src/pages/Messages.jsx
import { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase/config';
import { collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp, doc, getDoc, setDoc, writeBatch } from 'firebase/firestore';
import { Send, ArrowLeft, MessageSquare, Check, CheckCheck, Play } from 'lucide-react';
import toast from 'react-hot-toast';
import '../styles/pages.css';

export default function Messages() {
  const { user } = useAuth();
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
      where('participants', 'array-contains', user.uid)
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
      
      chatsData.sort((a, b) => (b.updatedAt?.toMillis() || 0) - (a.updatedAt?.toMillis() || 0));
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

      // Mark unread messages as read
      const unreadMsgs = snap.docs.filter(d => {
        const data = d.data();
        return data.senderId !== user.uid && data.status !== 'read';
      });

      if (unreadMsgs.length > 0) {
        const batch = writeBatch(db);
        unreadMsgs.forEach(d => {
          batch.update(doc(db, `chats/${chatId}/messages/${d.id}`), { status: 'read' });
        });
        batch.commit().catch(err => console.error("Failed to mark messages as read", err));
      }
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
        createdAt: serverTimestamp(),
        status: 'sent' // Initialize status
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

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (!user) return null;

  return (
    <div className="page messages-page animate-fade-in" style={{ display: 'flex', height: '100%', padding: 0, overflow: 'hidden', margin: 0, maxWidth: 'none' }}>
      
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
                  gap: '12px',
                  transition: 'background 0.2s ease'
                }}
                onMouseOver={(e) => { if (chatId !== chat.id) e.currentTarget.style.background = 'rgba(255,255,255,0.02)' }}
                onMouseOut={(e) => { if (chatId !== chat.id) e.currentTarget.style.background = 'transparent' }}
              >
                {chat.otherUser?.avatarUrl ? (
                  <img src={chat.otherUser.avatarUrl} alt={chat.otherUser.username} style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'linear-gradient(135deg, var(--bg-card), var(--border))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
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
                <img src={activeChatInfo.otherUser.avatarUrl} alt="" style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover' }} />
              ) : (
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--bg-card)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                  {(activeChatInfo?.otherUser?.username || '?').charAt(0).toUpperCase()}
                </div>
              )}
              <div style={{ fontWeight: 600, fontSize: '1.1rem' }}>{activeChatInfo?.otherUser?.username || 'Loading...'}</div>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {loadingMessages ? (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Loading messages...</div>
              ) : messages.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', margin: 'auto' }}>
                  Start the conversation!
                </div>
              ) : (
                messages.map((msg, index) => {
                  const isMine = msg.senderId === user.uid;
                  const prevMsg = messages[index - 1];
                  const showAvatar = !isMine && (!prevMsg || prevMsg.senderId !== msg.senderId);
                  const isLastInGroup = !messages[index + 1] || messages[index + 1].senderId !== msg.senderId;
                  
                  return (
                    <div key={msg.id} style={{ display: 'flex', justifyContent: isMine ? 'flex-end' : 'flex-start', marginBottom: isLastInGroup ? '12px' : '2px' }}>
                      {!isMine && (
                        <div style={{ width: 32, marginRight: '8px', display: 'flex', alignItems: 'flex-end' }}>
                          {showAvatar && activeChatInfo?.otherUser?.avatarUrl ? (
                            <img src={activeChatInfo.otherUser.avatarUrl} alt="" style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover', marginBottom: '14px' }} />
                          ) : showAvatar ? (
                            <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--bg-card)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.7rem', marginBottom: '14px' }}>
                              {(activeChatInfo?.otherUser?.username || '?').charAt(0).toUpperCase()}
                            </div>
                          ) : null}
                        </div>
                      )}
                      <div style={{ 
                        maxWidth: '70%', 
                        padding: '8px 12px', 
                        borderRadius: '16px',
                        background: isMine ? 'linear-gradient(135deg, #a855f7, #c026d3)' : 'var(--bg-card)',
                        color: isMine ? '#fff' : 'var(--text-primary)',
                        borderBottomRightRadius: isMine && isLastInGroup ? '4px' : '16px',
                        borderBottomLeftRadius: !isMine && isLastInGroup ? '4px' : '16px',
                        fontSize: '0.95rem',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                        position: 'relative',
                        minWidth: '85px'
                      }}>
                        {msg.text && <div style={{ wordBreak: 'break-word', paddingBottom: '16px' }}>{msg.text}</div>}
                        
                        {msg.sharedTrack && (
                          <div 
                            style={{ 
                              marginTop: msg.text ? '8px' : '0', 
                              marginBottom: '18px',
                              padding: '8px', 
                              background: isMine ? 'rgba(0,0,0,0.15)' : 'var(--bg-elevated)', 
                              border: isMine ? 'none' : '1px solid var(--border)',
                              borderRadius: '8px', 
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: '10px',
                              cursor: 'pointer',
                              width: '220px'
                            }}
                            onClick={() => navigate(`/track/${msg.sharedTrack.id}`)}
                          >
                            {msg.sharedTrack.coverUrl ? (
                              <img src={msg.sharedTrack.coverUrl} style={{ width: 40, height: 40, borderRadius: '4px', objectFit: 'cover', flexShrink: 0 }} />
                            ) : (
                              <div style={{ width: 40, height: 40, borderRadius: '4px', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <Play size={16} />
                              </div>
                            )}
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontWeight: 'bold', fontSize: '0.85rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{msg.sharedTrack.title}</div>
                              <div style={{ fontSize: '0.7rem', opacity: 0.8, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{msg.sharedTrack.artist}</div>
                            </div>
                            <div style={{ width: 28, height: 28, borderRadius: '50%', background: isMine ? 'rgba(255,255,255,0.2)' : 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              <Play size={14} fill="#fff" color="#fff" />
                            </div>
                          </div>
                        )}

                        <div style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'flex-end', 
                          gap: '4px',
                          fontSize: '0.65rem',
                          color: isMine ? 'rgba(255,255,255,0.7)' : 'var(--text-muted)',
                          position: 'absolute',
                          bottom: '6px',
                          right: '10px',
                          whiteSpace: 'nowrap'
                        }}>
                          <span>{formatTime(msg.createdAt)}</span>
                          {isMine && (
                            <span style={{ display: 'flex', alignItems: 'center' }}>
                              {msg.status === 'read' ? (
                                <CheckCheck size={14} color="#38bdf8" />
                              ) : msg.status === 'delivered' ? (
                                <CheckCheck size={14} />
                              ) : (
                                <Check size={14} />
                              )}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border)', background: 'var(--bg-elevated)' }}>
              <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <input 
                  type="text" 
                  className="input" 
                  placeholder="Message..." 
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  style={{ flex: 1, borderRadius: '24px', padding: '12px 20px', background: 'var(--bg-card)', border: '1px solid var(--border)', fontSize: '0.95rem' }}
                />
                <button type="submit" className="btn btn-primary" style={{ borderRadius: '50%', width: '48px', height: '48px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, opacity: newMessage.trim() ? 1 : 0.6 }} disabled={!newMessage.trim()}>
                  <Send size={20} style={{ marginLeft: '2px' }} />
                </button>
              </form>
            </div>
          </>
        ) : (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', padding: '20px', textAlign: 'center' }}>
            <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}>
              <MessageSquare size={40} color="var(--accent)" style={{ opacity: 0.8 }} />
            </div>
            <h2 style={{ marginBottom: '8px' }}>Your Messages</h2>
            <p style={{ maxWidth: '300px', opacity: 0.8 }}>Select a conversation from the sidebar or start a new one from an artist's profile.</p>
          </div>
        )}
      </div>
    </div>
  );
}
