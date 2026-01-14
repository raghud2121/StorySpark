import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import io from 'socket.io-client';

// Connect to Backend
const socket = io.connect("http://localhost:5000");

// --- STYLES ---
// We inject these directly so they GUARANTEED to load
const styleTag = document.createElement("style");
styleTag.innerHTML = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap');
  body { background-color: #f1f5f9; font-family: 'Inter', sans-serif; }
  .guest-container { max-width: 700px; margin: 40px auto; padding: 20px; }
  .guest-banner { background: #2563eb; color: white; padding: 20px; border-radius: 12px; margin-bottom: 30px; box-shadow: 0 10px 25px -5px rgba(37, 99, 235, 0.4); }
  .guest-card { background: white; padding: 25px; border-radius: 16px; margin-bottom: 20px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
  .guest-input { width: 100%; padding: 15px; border: 2px solid #e2e8f0; border-radius: 10px; margin-bottom: 15px; font-size: 16px; min-height: 80px; font-family: inherit; }
  .guest-input:focus { outline: none; border-color: #2563eb; }
  .guest-btn { background: #0f172a; color: white; border: none; padding: 12px 24px; border-radius: 8px; font-weight: bold; cursor: pointer; transition: transform 0.1s; }
  .guest-btn:hover { transform: scale(1.02); }
  .tag-guest { color: #2563eb; font-weight: 800; font-size: 0.8rem; letter-spacing: 1px; text-transform: uppercase; }
  .tag-owner { color: #0f172a; font-weight: 800; font-size: 0.8rem; letter-spacing: 1px; text-transform: uppercase; }
`;
document.head.appendChild(styleTag);

function SharedStoryView() {
  const { id } = useParams();
  const [stories, setStories] = useState([]);
  const [instruction, setInstruction] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // 1. Join Socket Room
    socket.emit('join_room', id);

    // 2. Fetch Story Chain
    fetch(`http://localhost:5000/api/story/public/${id}`)
      .then(res => res.json())
      .then(data => {
        // Handle if backend returns array or single object
        setStories(Array.isArray(data) ? data : [data]);
      })
      .catch(err => console.error("API Error:", err));

    // 3. Listen for Updates
    socket.on('receive_new_version', (newStory) => {
      setStories(prev => [newStory, ...prev]);
    });

    return () => socket.off('receive_new_version');
  }, [id]);

  const handleSend = async () => {
    if (!instruction.trim()) return;
    setLoading(true);

    try {
      // We refine the TOP story in the list
      const targetId = stories[0]._id;
      
      const res = await fetch(`http://localhost:5000/api/story/public/refine/${targetId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instruction })
      });
      const data = await res.json();

      if (res.ok) {
        setStories([data, ...stories]); // Update local view
        socket.emit('send_new_version', { roomId: id, story: data }); // Update owner view
        setInstruction('');
      } else {
        alert("Server Error: " + (data.msg || "Unknown"));
      }
    } catch (err) { alert("Connection Failed"); }
    setLoading(false);
  };

  return (
    <div className="guest-container">
      
      {/* 1. BLUE HEADER BANNER */}
      <div className="guest-banner">
        <h2 style={{margin:0}}>🤝 Guest Mode</h2>
        <p style={{margin:'5px 0 0 0', opacity: 0.9}}>You are collaborating live.</p>
      </div>

      {/* 2. INPUT BOX */}
      <div className="guest-card" style={{ borderLeft: '5px solid #2563eb' }}>
        <h3 style={{marginTop:0}}>Add a Plot Twist</h3>
        <textarea 
          className="guest-input"
          value={instruction}
          onChange={(e) => setInstruction(e.target.value)}
          placeholder="Type here to change the story (e.g. 'Suddenly, it started raining frogs')..."
        />
        <button onClick={handleSend} disabled={loading} className="guest-btn">
          {loading ? "Writing..." : "Submit to Owner 🚀"}
        </button>
      </div>

      {/* 3. STORY FEED */}
      {stories.map((story, i) => (
        <div key={story._id || i} className="guest-card">
          <div style={{marginBottom: '10px'}}>
            <span className={story.prompt.includes('(Guest)') ? 'tag-guest' : 'tag-owner'}>
              {story.prompt.includes('(Guest)') ? '👤 Guest' : '👑 Owner'}
            </span>
          </div>
          <div style={{fontWeight: 'bold', marginBottom:'15px', color:'#334155'}}>
            "{story.prompt.replace('(Guest) ', '').replace('(Refined) ', '')}"
          </div>
          <p style={{lineHeight: 1.6, color: '#1e293b', whiteSpace: 'pre-wrap'}}>
            {story.content}
          </p>
        </div>
      ))}
    </div>
  );
}

export default SharedStoryView;