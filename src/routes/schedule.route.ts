import express from 'express';
const scheduleController = require('../controllers/schedule.controller');
const router = express.Router();

router.post('/createShift', scheduleController.createShift);
router.post('/createSchedule',scheduleController.createOrUpdateSchedule);
router.get('/getScheduleByDoctorId/:doctorId',scheduleController.getWeeklyScheduleByDoctor);
router.get('/getShiftByLocation/:id', scheduleController.getShiftByLocation);
router.post('/getWeeklySchedules',scheduleController.getAllWeeklyScheduleByDoctors);

export default router;