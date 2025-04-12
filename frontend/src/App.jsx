import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import AdminLogin from './pages/AdminLogin';
import HostLogin from './pages/HostLogin';
import GateLogin from './pages/GateLogin';
import AdminDashboard from './pages/AdminDashboard';
import HostDashboard from './pages/HostDashboard';
import GateDashboard from './pages/GateDashboard';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    const userData = localStorage.getItem('user');
    
    if (token && role && userData) {
      try {
        const parsedUserData = JSON.parse(userData);
        setUser({
          token,
          role,
          data: parsedUserData
        });
        
        // Create socket connection
        const newSocket = io('http://localhost:5000', {
          auth: {
            token
          }
        });
        
        newSocket.on('connect', () => {
          console.log('Socket connected');
          if (role === 'host') {
            newSocket.emit('registerHost', parsedUserData.id);
          } else if (role === 'gate') {
            newSocket.emit('registerGate', parsedUserData.id);
          }
        });
        
        setSocket(newSocket);
      } catch (error) {
        console.error('Error parsing user data:', error);
        // Clear invalid data
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        localStorage.removeItem('user');
      }
    }
    
    setLoading(false);
    
    // Cleanup function
    return () => {
      if (socket) {
        socket.close();
      }
    };
  }, []);

  const handleLogin = (token, role, userData) => {
    // Store in localStorage
    localStorage.setItem('token', token);
    localStorage.setItem('role', role);
    localStorage.setItem('user', JSON.stringify(userData));
    
    // Update state
    setUser({ token, role, data: userData });
    
    // Create socket connection
    const newSocket = io('http://localhost:5000', {
      auth: {
        token
      }
    });
    
    newSocket.on('connect', () => {
      console.log('Socket connected');
      if (role === 'host') {
        newSocket.emit('registerHost', userData.id);
      } else if (role === 'gate') {
        newSocket.emit('registerGate', userData.id);
      }
    });
    
    setSocket(newSocket);
  };

  const handleLogout = () => {
    // Close socket connection
    if (socket) {
      socket.close();
      setSocket(null);
    }
    
    // Clear localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('user');
    
    // Update state
    setUser(null);
  };

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/admin/login" />} />
        
        {/* Fallback route for /login */}
        <Route path="/login" element={<Navigate to="/admin/login" />} />
        
        {/* Public routes */}
        <Route path="/admin/login" element={
          user ? <Navigate to={`/${user.role}/dashboard`} /> : <AdminLogin onLogin={handleLogin} />
        } />
        <Route path="/host/login" element={
          user ? <Navigate to={`/${user.role}/dashboard`} /> : <HostLogin onLogin={handleLogin} />
        } />
        <Route path="/gate/login" element={
          user ? <Navigate to={`/${user.role}/dashboard`} /> : <GateLogin onLogin={handleLogin} />
        } />
        
        {/* Protected routes */}
        <Route path="/admin/dashboard" element={
          !user ? <Navigate to="/admin/login" /> : 
          user.role !== 'admin' ? <Navigate to={`/${user.role}/dashboard`} /> : 
          <AdminDashboard user={user} onLogout={handleLogout} socket={socket} />
        } />
        <Route path="/host/dashboard" element={
          !user ? <Navigate to="/host/login" /> : 
          user.role !== 'host' ? <Navigate to={`/${user.role}/dashboard`} /> : 
          <HostDashboard user={user} onLogout={handleLogout} socket={socket} />
        } />
        <Route path="/gate/dashboard" element={
          !user ? <Navigate to="/gate/login" /> : 
          user.role !== 'gate' ? <Navigate to={`/${user.role}/dashboard`} /> : 
          <GateDashboard user={user} onLogout={handleLogout} socket={socket} />
        } />
        
        {/* Catch-all route for any unmatched routes */}
        <Route path="*" element={<Navigate to="/admin/login" />} />
      </Routes>
    </Router>
  );
}

export default App;
