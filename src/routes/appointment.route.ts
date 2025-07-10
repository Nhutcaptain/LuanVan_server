import express from 'express';
const router = express.Router();

const appointmentController = require('../controllers/appointment.controller');

router.post('/createAppointment',appointmentController.createAppointment);
router.get('/getMyAppointments/:patientId', appointmentController.getAppointmentByPatientId);
router.put('/cancelAppointment/:appointmentId', appointmentController.cancelAppointment);
router.put('/completeAppointment/:appointmentId', appointmentController.completeAppointment);


export default router;