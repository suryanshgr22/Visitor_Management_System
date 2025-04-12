import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { gateAPI } from '../services/api';

export default function GateLogin({ onLogin }) {
  const [gateId, setGateId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await gateAPI.login(gateId, password);
      const { token, gate } = response.data;
      
      // Call onLogin with the token and user data
      onLogin(token, 'gate', gate);
      navigate('/gate/dashboard');
    } catch (err) {
      console.error('Login error:', err);
      // Show error message
      setError(err.response?.data?.message || 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="max-w-md w-full p-6 bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-center mb-6">Gate Login</h2>
        
        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 mb-2" htmlFor="gateId">
              Gate ID
            </label>
            <input
              id="gateId"
              type="text"
              className="w-full p-2 border rounded"
              value={gateId}
              onChange={(e) => setGateId(e.target.value)}
              required
            />
          </div>
          
          <div className="mb-6">
            <label className="block text-gray-700 mb-2" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              className="w-full p-2 border rounded"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          
          <button
            type="submit"
            className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        
        <div className="mt-4 text-center">
          <Link to="/admin/login" className="text-blue-500 hover:underline mr-4">
            Admin Login
          </Link>
          <Link to="/host/login" className="text-blue-500 hover:underline">
            Host Login
          </Link>
        </div>
      </div>
    </div>
  );
} 