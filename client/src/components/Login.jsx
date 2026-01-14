import { useState } from 'react';

function Login() {
  const [isRegistering, setIsRegistering] = useState(false);
  const [username, setUsername] = useState(''); 
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    const endpoint = isRegistering ? '/register' : '/login';
    
    try {
      const res = await fetch(`http://localhost:5000/api/auth${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }) 
      });

      const data = await res.json();

      if (res.ok) {
        localStorage.setItem('token', data.token);
        if (isRegistering) {
          setMessage('✨ Account created! Logging in...');
          setTimeout(() => window.location.href = '/', 1500);
        } else {
          window.location.href = '/'; 
        }
      } else {
        setMessage(data.msg || 'Error: Check credentials');
      }
    } catch (err) {
      setMessage('Server connection failed.');
    }
  };

  // --- STYLES ---
  const styles = {
    container: {
      position: 'fixed', 
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      // Deep Space Blue Gradient
      background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #312e81 100%)',
      fontFamily: "'Inter', sans-serif",
      zIndex: 1000
    },
    overlay: {
      position: 'absolute',
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundImage: 'radial-gradient(rgba(255,255,255,0.1) 1px, transparent 1px)',
      backgroundSize: '24px 24px',
      opacity: 0.3,
      pointerEvents: 'none'
    },
    card: {
      background: 'rgba(255, 255, 255, 0.95)', // White card
      backdropFilter: 'blur(12px)',
      padding: '40px 50px',
      borderRadius: '24px',
      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
      width: '100%',
      maxWidth: '400px',
      textAlign: 'center',
      position: 'relative',
      zIndex: 1,
      color: '#1f2937' // FORCE CARD TEXT TO BE DARK
    },
    logo: {
      fontSize: '32px',
      fontWeight: '800',
      background: 'linear-gradient(to right, #2563eb, #7c3aed)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      marginBottom: '10px',
      marginTop: 0
    },
    subtitle: {
      color: '#64748b', // Gray text for subtitle
      marginBottom: '30px',
      fontSize: '15px',
      fontWeight: '500'
    },
    inputGroup: {
      display: 'flex',
      flexDirection: 'column',
      gap: '16px',
      marginBottom: '20px'
    },
    input: {
      width: '100%',
      padding: '14px 16px',
      borderRadius: '12px',
      border: '2px solid #e2e8f0', // Light gray border
      backgroundColor: '#f8fafc',  // Very light gray background
      
      // *** THE FIX: FORCE TEXT COLOR TO BLACK ***
      color: '#1f2937', 
      
      fontSize: '16px',
      outline: 'none',
      transition: 'all 0.2s',
      boxSizing: 'border-box'
    },
    button: {
      width: '100%',
      padding: '14px',
      background: 'linear-gradient(to right, #2563eb, #4f46e5)',
      color: 'white',
      border: 'none',
      borderRadius: '12px',
      fontSize: '16px',
      fontWeight: '700',
      cursor: 'pointer',
      boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)',
      transition: 'transform 0.1s'
    },
    toggleBtn: {
      background: 'none',
      border: 'none',
      color: '#4f46e5',
      marginTop: '20px',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: '600',
      textDecoration: 'underline'
    },
    error: {
      marginTop: '15px',
      padding: '12px',
      background: '#fee2e2',
      color: '#b91c1c',
      borderRadius: '8px',
      fontSize: '14px',
      fontWeight: '500',
      display: message ? 'block' : 'none'
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.overlay}></div>

      <div style={styles.card}>
        <h1 style={styles.logo}>StorySpark ⚡</h1>
        <p style={styles.subtitle}>
          {isRegistering ? 'Start your creative journey' : 'Welcome back, Writer!'}
        </p>
        
        <form onSubmit={handleSubmit}>
          <div style={styles.inputGroup}>
            <input 
              type="text" 
              placeholder="Username" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              style={styles.input}
              onFocus={(e) => {
                e.target.style.borderColor = '#4f46e5';
                e.target.style.backgroundColor = '#ffffff';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#e2e8f0';
                e.target.style.backgroundColor = '#f8fafc';
              }}
            />
            <input 
              type="password" 
              placeholder="Password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={styles.input}
              onFocus={(e) => {
                e.target.style.borderColor = '#4f46e5';
                e.target.style.backgroundColor = '#ffffff';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#e2e8f0';
                e.target.style.backgroundColor = '#f8fafc';
              }}
            />
          </div>

          <button 
            type="submit" 
            style={styles.button}
            onMouseDown={(e) => e.target.style.transform = 'scale(0.98)'}
            onMouseUp={(e) => e.target.style.transform = 'scale(1)'}
          >
            {isRegistering ? 'Create Account' : 'Sign In'}
          </button>
        </form>

        <p style={styles.error}>{message}</p>
        
        <button onClick={() => {setMessage(''); setIsRegistering(!isRegistering);}} style={styles.toggleBtn}>
          {isRegistering ? 'Already have an account? Login' : 'Need an account? Register'}
        </button>
      </div>
    </div>
  );
}

export default Login;