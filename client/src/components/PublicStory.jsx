import { useEffect, useState } from 'react';
// We need to grab the ID from the URL
const getShareIdFromUrl = () => window.location.pathname.split('/').pop();

function PublicStory() {
  const [story, setStory] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const shareId = getShareIdFromUrl();
    fetch(`http://localhost:5000/api/story/public/${shareId}`)
      .then(res => {
        if (!res.ok) throw new Error("Link expired or invalid");
        return res.json();
      })
      .then(data => setStory(data))
      .catch(err => setError(err.message));
  }, []);

  if (error) return <div style={{textAlign:'center', marginTop:'50px', color:'red'}}><h2>🚫 {error}</h2></div>;
  if (!story) return <div style={{textAlign:'center', marginTop:'50px'}}><h2>Loading Story...</h2></div>;

  return (
    <div style={{ maxWidth: '800px', margin: '50px auto', padding: '40px', fontFamily: 'Arial', background: '#fff', boxShadow: '0 0 20px rgba(0,0,0,0.1)', borderRadius: '10px' }}>
      <h5 style={{color: '#888', textTransform: 'uppercase', letterSpacing: '2px'}}>Shared via StorySpark AI</h5>
      <hr />
      <h2 style={{marginTop: '20px'}}>Prompt: {story.prompt}</h2>
      <p style={{ whiteSpace: 'pre-wrap', lineHeight: '1.8', fontSize: '18px', color: '#333' }}>
        {story.content}
      </p>
      <div style={{marginTop: '40px', textAlign: 'center'}}>
        <a href="/" style={{textDecoration: 'none', color: 'blue'}}>Create your own AI story at StorySpark</a>
      </div>
    </div>
  );
}

export default PublicStory;