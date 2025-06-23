import express from 'express';
const router = express.Router();

const appointmentController = require('../controllers/appointment.controller');

router.post('/createAppointment',appointmentController.createAppointment);

export default router;