import 'dotenv/config';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import jwt from 'jsonwebtoken';

import app from './app';
import { connectDB } from './config/database';

const server = http.createServer(app);

// ── Socket.IO (authenticated) — local/persistent server only ──────────────────
const io = new SocketIOServer(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true,
  },
});

// Verify JWT on every socket connection
io.use((socket, next) => {
  const token = socket.handshake.auth?.token as string | undefined;
  if (!token) return next(new Error('Authentication required'));
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: string };
    (socket as any).userId = decoded.id;
    next();
  } catch {
    next(new Error('Invalid token'));
  }
});

io.on('connection', (socket) => {
  const authenticatedUserId = (socket as any).userId as string;

  // Only allow joining own room
  socket.join(`user_${authenticatedUserId}`);

  socket.on('send_message', (data) => {
    const { recipientId, message } = data;
    if (!recipientId || !message) return;
    io.to(`user_${recipientId}`).emit('receive_message', message);
  });

  socket.on('typing', (data) => {
    const { recipientId } = data;
    if (!recipientId) return;
    io.to(`user_${recipientId}`).emit('user_typing', { senderId: authenticatedUserId });
  });

  socket.on('disconnect', () => {
    // Intentionally silent
  });
});

// ── Start ─────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

const start = async () => {
  await connectDB();
  server.listen(PORT, () => {
    console.log(`LinkSports backend running on port ${PORT} [${process.env.NODE_ENV}]`);
  });
};

start().catch(console.error);

export { io };
