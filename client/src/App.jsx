import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import StoryGenerator from './components/StoryGenerator';
import SharedStoryView from './components/SharedStoryView';

function App() {
  const isAuthenticated = !!localStorage.getItem('token');

  return (
    <Router>
      <Routes>
        {/* Login Page */}
        <Route path="/login" element={<Login />} />

        {/* Dashboard (Redirects to Login if no token) */}
        <Route 
          path="/" 
          element={isAuthenticated ? <StoryGenerator /> : <Navigate to="/login" />} 
        />

        {/* Guest Link (Always accessible) */}
        <Route path="/share/:id" element={<SharedStoryView />} />
      </Routes>
    </Router>
  );
}

export default App;