import { io } from 'socket.io-client';

let socket = null;

export const initializeSocket = () => {
  if (!socket) {
    console.log('Initializing socket connection');
    socket = io('http://localhost:5000', {
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
      autoConnect: true
    });

    socket.on('connect', () => {
      console.log('Socket connected successfully');
    });

    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });

    socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
    });

    socket.on('reconnect', (attemptNumber) => {
      console.log('Socket reconnected after', attemptNumber, 'attempts');
    });

    socket.on('reconnect_error', (error) => {
      console.error('Socket reconnection error:', error);
    });

    socket.on('reconnect_failed', () => {
      console.error('Socket reconnection failed');
    });
  }
  return socket;
};

export const registerHost = (hostId) => {
  if (socket) {
    console.log('Registering host:', hostId);
    socket.emit('registerHost', hostId);
  } else {
    console.error('Cannot register host: Socket not initialized');
  }
};

export const registerGate = (gateId) => {
  if (socket) {
    console.log('Registering gate:', gateId);
    socket.emit('registerGate', gateId);
  } else {
    console.error('Cannot register gate: Socket not initialized');
  }
};

export const disconnectSocket = () => {
  if (socket) {
    console.log('Disconnecting socket');
    socket.disconnect();
    socket = null;
  }
};

export const getSocket = () => {
  return socket;
}; 