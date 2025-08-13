import express from 'express';
const router = express.Router();

const appointmentController = require('../controllers/appointment.controller');

router.post('/createAppointment',appointmentController.createAppointment);
router.get('/getMyAppointments/:patientId', appointmentController.getAppointmentByPatientId);
router.put('/cancelAppointment/:appointmentId', appointmentController.cancelAppointment);
router.put('/completeAppointment/:appointmentId', appointmentController.completeAppointment);
router.get('/getAppointmentsByDoctor/:doctorId',appointmentController.getAppointmentByDoctor);
router.get('/appointments/today/:doctorId', appointmentController.getTodayAppointments);
router.put('/:id/status',appointmentController.updateStatusAppointment);
router.get('/testOrder/:id', appointmentController.getTestOrder);
router.post('/stopAppointments/:doctorId', appointmentController.stopAppointments);
router.post("/createVacAppointment", appointmentController.createVaccinationAppointment);
router.patch('/confirm/:id',appointmentController.confirmAppointment);
router.post('/bulkConfirm',appointmentController.bulkConfirmAppointments);
router.delete('/deleteAppointment/:id',appointmentController.deleteAppointment);


export default router;