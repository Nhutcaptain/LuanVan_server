import express from 'express';
import cors from 'cors';
import userRoutes from './routes/user.route';
import openaiRoute from './routes/openai.route';
import postsRoute from './routes/posts.route';
import authRoutes from './routes/auth.route';
import patientRoutes from './routes/patient.route';
import expressSession from 'express-session';
import imagesRoute from './routes/images.route';
import departmentRoute from './routes/department.route';
import scheduleRoute from './routes/schedule.route';
import appointmentRoute from './routes/appointment.route';
import symptomRoute from './routes/symptom.route';
import examinationRoute from './routes/examination.route';
import locationRoute from './routes/location.route';
import serviceRoute from './routes/service.route';
import passport from 'passport';
import doctorRoute from './routes/doctor.route';
import medicineRoute from './routes/medicine.route';
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
app.use('/api/doctors',doctorRoute);
app.use('/api/patient',patientRoutes);
app.use('/api/images',imagesRoute);
app.use('/api/department',departmentRoute);
app.use('/api/schedule',scheduleRoute);
app.use('/api/appointment',appointmentRoute);
app.use('/api/symptom', symptomRoute);
app.use('/api/examination',examinationRoute);
app.use('/api/location',locationRoute);
app.use('/api/service',serviceRoute);
app.use('/api/medicine',medicineRoute);

export default app;
