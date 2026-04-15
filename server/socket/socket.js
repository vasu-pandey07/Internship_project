const jwt = require('jsonwebtoken');

/**
 * Socket.io Setup
 * Handles real-time notifications by mapping authenticated users to socket connections.
 */
let io;

const initSocket = (server) => {
  const { Server } = require('socket.io');

  io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL,
      methods: ['GET', 'POST'],
    },
  });

  // Authentication middleware for Socket.io
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication error'));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      next();
    } catch (err) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`🔌 User connected: ${socket.userId}`);

    // Join a personal room for targeted notifications
    socket.join(`user:${socket.userId}`);

    socket.on('disconnect', () => {
      console.log(`🔌 User disconnected: ${socket.userId}`);
    });
  });

  return io;
};

/**
 * Send real-time notification to a specific user.
 * @param {string} userId - Target user's ID
 * @param {object} notification - Notification data
 */
const sendNotification = (userId, notification) => {
  if (io) {
    io.to(`user:${userId}`).emit('notification', notification);
  }
};

const getIO = () => io;

module.exports = { initSocket, sendNotification, getIO };
