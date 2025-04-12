require('dotenv').config({ path: './.env' });
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const connectDB = require('./db/index.js');
const cors = require('cors');
const { client: redisClient } = require('./config/redis');
const app = express();

// MongoDB connection
console.log('MONGO_URI:', process.env.MONGO_URI);
connectDB();

app.use(cors());
app.use(express.json());

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.IO server
const io = new Server(server, {
  cors: {
    origin: '*', // change to your frontend origin in production
    methods: ['GET', 'POST']
  }
});

// Store connected sockets
const gateSockets = new Map(); // gateId -> socket
const hostSockets = new Map(); // hostId -> socket

// Socket.io logic
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  socket.on('registerGate', (gateId) => {
    gateSockets.set(gateId, socket);
    console.log(`Gate registered: ${gateId}`);
  });

  socket.on('registerHost', (hostId) => {
    hostSockets.set(hostId, socket);
    console.log(`Host registered: ${hostId}`);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    // Clean up from maps
    for (const [gateId, sock] of gateSockets.entries()) {
      if (sock.id === socket.id) gateSockets.delete(gateId);
    }
    for (const [hostId, sock] of hostSockets.entries()) {
      if (sock.id === socket.id) hostSockets.delete(hostId);
    }
  });
});

// Middleware to attach io and socket maps to req
app.use((req, res, next) => {
  req.io = io;
  req.gateSockets = gateSockets;
  req.hostSockets = hostSockets;
  next();
});

// Routes
app.use('/api/admin', require('./routes/admin.js'));
app.use('/api/gate', require('./routes/gate.js'));
app.use('/api/visitor', require('./routes/visitor.js'));
app.use('/api/host', require('./routes/host.js'));

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down server gracefully...');
  redisClient.quit();
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
