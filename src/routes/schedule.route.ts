import express from 'express';
const scheduleController = require('../controllers/schedule.controller');
const router = express.Router();

router.post('/createShift', scheduleController.createShift);
router.post('/createSchedule',scheduleController.createOrUpdateSchedule);
router.get('/getScheduleByDoctorId/:doctorId',scheduleController.getWeeklyScheduleByDoctor);

export default router;