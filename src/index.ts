import dotenv from 'dotenv';
dotenv.config();

import app from './app';
import { connectDB } from './config/db';
import http from 'http';
import { initSocket } from './socket';

const PORT = process.env.PORT || 5000;

const start = async () => {
  await connectDB();

  const server = http.createServer(app);

  // 🚀 Init socket.io here
  initSocket(server);

  server.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
  });
};

start();
