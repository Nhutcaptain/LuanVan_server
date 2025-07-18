import { Server } from 'socket.io';

let io: Server;

export const initSocket = (server: any) => {
  io = new Server(server, {
    cors: {
      origin: '*', // hoặc cụ thể frontend URL
      methods: ['GET', 'POST']
    }
  });

  io.on('connection', (socket) => {
    console.log('🟢 New client connected:', socket.id);

    socket.on('disconnect', () => {
      console.log('🔴 Client disconnected:', socket.id);
    });
  });

  return io;
};

export const getIO = (): Server => {
  if (!io) {
    throw new Error('Socket.io not initialized');
  }
  return io;
};