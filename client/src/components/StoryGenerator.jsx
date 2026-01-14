import { useState, useEffect } from 'react';
import io from 'socket.io-client';

// Connect to the backend socket
const socket = io("http://localhost:5000");

function StoryGenerator() {
  const [prompt, setPrompt] = useState('');
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState('');
  
  // Refine state
  const [refiningId, setRefiningId] = useState(null);
  const [instruction, setInstruction] = useState('');
  const [refineLoading, setRefineLoading] = useState(false);

  // 1. Listen for Real-Time Updates
  useEffect(() => {
    fetchStories();

    // When backend says "story_updated", refresh the list!
    socket.on("story_updated", () => {
      fetchStories();
      showNotify("✨ New activity detected on your timeline!");
    });

    return () => socket.off("story_updated");
  }, []);

  const fetchStories = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('http://localhost:5000/api/story/my-stories', {
        headers: { 'x-auth-token': token }
      });
      const data = await res.json();
      if (res.ok) setStories(data);
    } catch (err) { console.error(err); }
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('http://localhost:5000/api/story/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
        body: JSON.stringify({ prompt }),
      });
      if (res.ok) {
        setPrompt('');
        fetchStories(); // Refresh immediately
      }
    } catch (err) { showNotify('Error generating story'); }
    setLoading(false);
  };

  const handleRefine = async (id) => {
    if (!instruction.trim()) return;
    setRefineLoading(true);
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`http://localhost:5000/api/story/refine/${id}`, {
        method: 'POST', 
        headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
        body: JSON.stringify({ instruction })
      });
      if (res.ok) {
        setRefiningId(null);
        setInstruction('');
        fetchStories();
        showNotify('Refined story created!');
      }
    } catch (err) { showNotify('Error refining'); }
    setRefineLoading(false);
  };

  const handleDelete = async (id) => {
    if(!window.confirm("Delete this story?")) return;
    const token = localStorage.getItem('token');
    try {
      await fetch(`http://localhost:5000/api/story/${id}`, { method: 'DELETE', headers: { 'x-auth-token': token } });
      setStories(stories.filter(s => s._id !== id));
    } catch (err) { console.error(err); }
  };

  const handleShare = async (id) => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`http://localhost:5000/api/story/share/${id}`, { method: 'POST', headers: { 'x-auth-token': token } });
      const data = await res.json();
      if (res.ok) {
        navigator.clipboard.writeText(`${window.location.origin}/share/${data.shareLink}`);
        showNotify('🔗 Share link copied!');
      }
    } catch (err) { console.error(err); }
  };

  const showNotify = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(''), 3000);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/login';
  };

  // --- STYLES ---
  const styles = {
    container: { maxWidth: '900px', margin: '0 auto', padding: '40px 20px', fontFamily: "'Inter', sans-serif", color: '#334155' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' },
    logo: { fontSize: '24px', fontWeight: '800', background: 'linear-gradient(90deg, #2563eb, #7c3aed)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: 0 },
    logoutBtn: { border: '1px solid #ef4444', color: '#ef4444', background: 'transparent', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' },
    
    inputCard: { background: 'white', padding: '24px', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', border: '1px solid #e2e8f0', marginBottom: '40px' },
    textarea: { width: '100%', padding: '16px', borderRadius: '12px', border: '2px solid #e2e8f0', fontSize: '16px', minHeight: '100px', marginBottom: '16px', outline: 'none', resize: 'vertical', boxSizing: 'border-box' },
    btnPrimary: { background: '#2563eb', color: 'white', padding: '12px 24px', borderRadius: '8px', border: 'none', fontSize: '16px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' },
    
    storyCard: { background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', marginBottom: '24px', overflow: 'hidden' },
    cardHead: { background: '#f8fafc', padding: '16px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    cardBody: { padding: '24px', fontSize: '16px', lineHeight: '1.7', whiteSpace: 'pre-wrap' },
    
    actionBar: { padding: '12px 24px', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'flex-end', gap: '8px' },
    actionBtn: (col) => ({ background: 'transparent', color: col, border: 'none', padding: '8px 12px', cursor: 'pointer', fontWeight: '600', fontSize: '14px', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '6px' }),
    
    badge: (isGuest) => ({ background: isGuest ? '#fff7ed' : '#eff6ff', color: isGuest ? '#c2410c' : '#1d4ed8', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '700', border: `1px solid ${isGuest ? '#ffedd5' : '#dbeafe'}` }),
    notification: { position: 'fixed', top: '20px', right: '20px', background: '#10b981', color: 'white', padding: '12px 24px', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }
  };

  return (
    <div style={styles.container}>
      {notification && <div style={styles.notification}>{notification}</div>}
      
      <div style={styles.header}>
        <h1 style={styles.logo}>✨ StorySpark AI</h1>
        <button onClick={handleLogout} style={styles.logoutBtn}>Sign Out</button>
      </div>

      <div style={styles.inputCard}>
        <h3 style={{marginTop: 0, marginBottom: '15px'}}>Create a New Story</h3>
        <textarea 
          value={prompt} onChange={(e) => setPrompt(e.target.value)} 
          placeholder="Start writing..." style={styles.textarea} 
        />
        <button onClick={handleGenerate} disabled={loading} style={styles.btnPrimary}>
          {loading ? '🔮 Dreaming...' : '✨ Generate Story'}
        </button>
      </div>

      <h3 style={{color: '#94a3b8', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '1px'}}>Timeline</h3>

      <div>
        {stories.map(story => {
          const isGuest = story.prompt.includes('(Guest)');
          return (
            <div key={story._id} style={styles.storyCard}>
              <div style={styles.cardHead}>
                <div style={{display:'flex', gap:'10px', alignItems:'center'}}>
                  <span style={styles.badge(isGuest)}>{isGuest ? 'GUEST REPLY' : 'ORIGINAL'}</span>
                  <span style={{fontSize:'12px', color:'#94a3b8'}}>{new Date(story.createdAt).toLocaleTimeString()}</span>
                </div>
              </div>
              
              <div style={styles.cardBody}>{story.content}</div>

              {refiningId === story._id && (
                <div style={{padding: '0 24px 24px'}}>
                  <div style={{background: '#f1f5f9', padding: '16px', borderRadius: '12px'}}>
                    <p style={{margin:'0 0 10px 0', fontSize:'14px', fontWeight:'600'}}>How should AI change this?</p>
                    <div style={{display:'flex', gap:'10px'}}>
                      <input 
                        style={{flex:1, padding:'8px', borderRadius:'6px', border:'1px solid #cbd5e1'}}
                        value={instruction} onChange={(e) => setInstruction(e.target.value)}
                        placeholder="e.g. Make it scarier..."
                      />
                      <button onClick={() => handleRefine(story._id)} disabled={refineLoading} style={{...styles.btnPrimary, padding:'8px 16px', fontSize:'14px'}}>
                        {refineLoading ? '...' : 'Go'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div style={styles.actionBar}>
                <button onClick={() => setRefiningId(refiningId === story._id ? null : story._id)} style={styles.actionBtn('#f59e0b')}>⚡ Iterate</button>
                <button onClick={() => handleShare(story._id)} style={styles.actionBtn('#6366f1')}>🌐 Share</button>
                <button onClick={() => handleDelete(story._id)} style={styles.actionBtn('#ef4444')}>🗑️ Delete</button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  );
}

export default StoryGenerator;