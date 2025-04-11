import { io } from 'socket.io-client';

let socket = null;

export const initializeSocket = () => {
  if (!socket) {
    socket = io('http://localhost:5000');
  }
  return socket;
};

export const registerHost = (hostId) => {
  if (socket) {
    socket.emit('registerHost', hostId);
  }
};

export const registerGate = (gateId) => {
  if (socket) {
    socket.emit('registerGate', gateId);
  }
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const getSocket = () => {
  return socket;
}; 