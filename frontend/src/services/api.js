import axios from 'axios';
import config from '../utils/config';

// Create axios instance with base URL
const api = axios.create({
  baseURL: `${config.api.baseUrl}/api`,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add a request interceptor to add the auth token to all requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle token expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Token expired or invalid, clear localStorage and redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Host API
export const hostAPI = {
  login: (username, password) => api.post('/host/login', { username, password }),
  addVisitor: (visitorData) => api.post('/host/visitor/add', visitorData),
  getVisitors: () => api.get('/host/visitors'),
  getPendingRequests: () => api.get('/host/pendingReq'),
  getPreApprovedVisitors: () => api.get('/host/preApproved'),
  approveVisitor: (visitorId) => api.put('/host/approve', { visitorId }),
  declineVisitor: (visitorId) => api.put('/host/decline', { visitorId }),
  generateQR: (visitorId) => api.post('/host/generate-qr', { visitorId }),
};

// Gate API
export const gateAPI = {
  login: async (loginId, password) => {
    const response = await api.post('/gate/login', { loginId, password });
    return response;
  },
  getVisitors: async () => {
    const response = await api.get('/gate/todaysVisitors');
    return response;
  },
  getPendingVisitors: () => api.get('/gate/pendingVisitors'),
  getHosts: () => api.get('/gate/hosts'),
  addVisitor: async (visitorData) => {
    const response = await api.post('/gate/addVisitor', visitorData);
    return response;
  },
  requestApproval: (visitorId, gateId) => api.post('/gate/requestApproval', { visitorId, gateId }),
  generateQR: (visitorId) => api.post('/gate/generateQR', { visitorId }),
  getTodaysVisitors: () => api.get('/gate/todaysVisitors'),
  checkIn: async (visitorId) => {
    const response = await api.put('/gate/checkin', { visitorId });
    return response;
  },
  checkOut: async (visitorId) => {
    const response = await api.put('/gate/checkout', { visitorId });
    return response;
  }
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