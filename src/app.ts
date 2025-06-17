import express from 'express';
import cors from 'cors';
import userRoutes from './routes/user.route';
import openaiRoute from './routes/openai.route';
import postsRoute from './routes/posts.route';
import authRoutes from './routes/auth.route';
import expressSession from 'express-session';
import passport from 'passport';
import doctorRoute from './routes/doctor.route';
import './config/passport';

const app = express();

app.use(cors({
  origin: "http://localhost:3000", // hoặc true cho tạm thời
  credentials: true,
}));
app.use(express.json());

app.use(expressSession({
  secret: process.env.SESSION_SECRET || 'defaultsecret',
  resave: false,
  saveUninitialized: false,
}));

app.use('/api/users', userRoutes);
app.use('/api/openai', openaiRoute);
app.use('/api/posts',postsRoute)
app.use('/api/auth', authRoutes);
app.use('/api/doctors',doctorRoute)

export default app;
