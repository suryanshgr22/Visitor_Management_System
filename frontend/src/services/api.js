import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
});

// Add token to requests if it exists
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  console.log('Interceptor - Token:', token);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
    console.log('Interceptor - Added token to headers:', config.headers.Authorization);
  } else {
    console.log('Interceptor - No token found in localStorage');
  }
  return config;
});

// Host API
export const hostAPI = {
  login: (username, password) => api.post('/host/login', { username, password }),
  addVisitor: (visitorData) => api.post('/host/visitor/add', visitorData),
  getVisitors: () => api.get('/host/visitors'),
  getPendingRequests: () => api.get('/host/pendingReq'),
  approveVisitor: (visitorId) => api.put('/host/approve', { visitorId }),
  declineVisitor: (visitorId) => api.put('/host/decline', { visitorId }),
  generateQR: (visitorId) => api.post('/host/generate-qr', { visitorId }),
};

// Gate API
export const gateAPI = {
  login: (gateId, password) => api.post('/gate/login', { loginId: gateId, password }),
  checkIn: (visitorId) => api.put('/gate/checkin', { visitorId }),
  checkOut: (visitorId) => api.put('/gate/checkout', { visitorId }),
};

// Admin API
export const adminAPI = {
  login: (username, password) => api.post('/admin/login', { username, password }),
  getHosts: () => api.get('/admin/hosts'),
  getGates: () => api.get('/admin/gates'),
  getVisitors: () => api.get('/admin/visitors'),
  getAdmins: () => api.get('/admin/admins'),
  addHost: (hostData) => api.post('/admin/host/add', hostData),
  addGate: (gateData) => api.post('/admin/gate/add', gateData),
  addAdmin: (adminData) => api.post('/admin/add', adminData),
  deleteHost: (hostId) => api.delete('/admin/host/delete', { data: { hostId } }),
  deleteGate: (gateId) => api.delete('/admin/gate/delete', { data: { gateId } }),
  deleteAdmin: (username) => api.delete('/admin/admin/delete', { data: { username } }),
  setLimit: (hostId, limit) => api.put('/admin/setLimit', { hostId, limit }),
  setLimitAll: (limit) => api.put('/admin/setLimitAll', { limit }),
};

export default api; 