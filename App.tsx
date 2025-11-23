import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import SessionSetup from './pages/SessionSetup';
import StudyRoom from './pages/StudyRoom';
import Dictionary from './pages/Dictionary';
import { User } from './types';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);

  // Load user from local storage on mount
  useEffect(() => {
    try {
        const storedUser = localStorage.getItem('lingoflash_user');
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }
    } catch (e) {
        console.error("Failed to parse user session");
    }
  }, []);

  const handleLogin = (newUser: User) => {
    setUser(newUser);
    localStorage.setItem('lingoflash_user', JSON.stringify(newUser));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('lingoflash_user');
  };

  return (
    <Router>
      <div className="min-h-screen bg-gray-50 text-gray-800 font-sans">
        <Routes>
          <Route 
            path="/" 
            element={user ? <Navigate to="/dashboard" /> : <Navigate to="/login" />} 
          />
          <Route 
            path="/login" 
            element={user ? <Navigate to="/dashboard" /> : <Login onLogin={handleLogin} />} 
          />
          <Route 
            path="/dashboard" 
            element={user ? <Dashboard user={user} onLogout={handleLogout} /> : <Navigate to="/login" />} 
          />
          <Route 
            path="/setup" 
            element={user ? <SessionSetup user={user} /> : <Navigate to="/login" />} 
          />
          <Route 
            path="/study/:sessionId" 
            element={user ? <StudyRoom user={user} /> : <Navigate to="/login" />} 
          />
          <Route 
            path="/dictionary" 
            element={user ? <Dictionary /> : <Navigate to="/login" />} 
          />
        </Routes>
      </div>
    </Router>
  );
};

export default App;