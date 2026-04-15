import { io } from 'socket.io-client';

let socket = null;

const apiBaseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';
const socketServerURL = import.meta.env.VITE_SOCKET_URL || apiBaseURL.replace(/\/api\/v1\/?$/, '');

export const connectSocket = (token) => {
  if (socket) return socket;

  socket = io(socketServerURL, {
    auth: { token },
  });

  socket.on('connect', () => {
    console.log('🔌 Socket connected');
  });

  socket.on('disconnect', () => {
    console.log('🔌 Socket disconnected');
  });

  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const getSocket = () => socket;
