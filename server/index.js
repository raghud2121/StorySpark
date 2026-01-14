const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http'); // New
const { Server } = require('socket.io'); // New
require('dotenv').config();

const app = express();
const server = http.createServer(app); // Wrap express in HTTP server

// 1. Setup Socket.io with CORS
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173", // Your Frontend URL
    methods: ["GET", "POST", "PUT", "DELETE"]
  }
});

// Middleware
app.use(express.json());
app.use(cors());

// DB Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB Connected'))
  .catch(err => console.log(err));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/story', require('./routes/story'));

// 2. Real-Time Logic (The Magic)
io.on('connection', (socket) => {
  console.log(`⚡: User Connected ${socket.id}`);

  // Join a specific story room (based on Story ID)
  socket.on('join_room', (roomId) => {
    socket.join(roomId);
    console.log(`User ${socket.id} joined room: ${roomId}`);
  });

  // When a new story version is created, send it to everyone in the room
  socket.on('send_new_version', (data) => {
    // Broadcast to everyone in the room EXCEPT the sender
    socket.to(data.roomId).emit('receive_new_version', data.story);
  });

  socket.on('disconnect', () => {
    console.log('User Disconnected', socket.id);
  });
});

const PORT = process.env.PORT || 5000;
// Simple route to check if server is alive
app.get('/', (req, res) => {
  res.send('StorySpark Server is Running! 🚀');
});
// Note: We listen on 'server', not 'app'
server.listen(PORT, () => console.log(`🚀 Server + Sockets running on port ${PORT}`));