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
    socket.on('join-room', (room) => {
      socket.join(room);
      console.log(`Client ${socket.id} joined room ${room}`);
    });
    console.log('🟢 New client connected:', socket.id);

    socket.on('disconnect', (reason) => {
      console.log('🔴 Client disconnected:', socket.id);
      console.log('Disconnect reason: ', reason)
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

export const notifyExaminationUpdate = (examinationId: string, data: any) => {
  const io = getIO();
  io.to(`examination_${examinationId}`).emit('examination-update', {
    examinationId,
    data
  });
};

export const handleTestOrderUpdate = (doctorId: string, patientId: string, testOrders: any) => {
  const room = `doctor-${doctorId}`;
    io.to(room).emit(
      'test-order-updated', 
      {
        testOrders,
        patientId
      }
    );
  };