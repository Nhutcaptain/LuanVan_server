import express from 'express';
const scheduleController = require('../controllers/schedule.controller');
const router = express.Router();

router.post('/createShift', scheduleController.createShift);
router.post('/createSchedule',scheduleController.createOrUpdateSchedule);
router.get('/getScheduleByDoctorId/:doctorId',scheduleController.getWeeklyScheduleByDoctor);
router.get('/getShiftByLocation/:id', scheduleController.getShiftByLocation);
router.post('/getWeeklySchedules',scheduleController.getAllWeeklyScheduleByDoctors);
router.delete('/deleteSchedule/:doctorId',scheduleController.deleteWeeklyScheduleById);
router.get('/getAllSpecialSchedule/:doctorId',scheduleController.getAllSpecialSchedule);
router.post('/createSpecialSchedule',scheduleController.createSpecialSchedule);
router.get('/getSpecialSchedule/:doctorId',scheduleController.getSpecialScheduleById);
router.post('/createOvertimeSchedule', scheduleController.addOvertimeDay);
router.get('/getOvertimeSchedule/:doctorId', scheduleController.getOvertime);
router.put('/updateOvertimeSchedule/:scheduleId', scheduleController.updateOvertimeDay); 
router.delete('/deleteOvertimeSchedule', scheduleController.deleteOvertimeDay);
router.delete('/deleteSpecial', scheduleController.deleteSpecialSchedule);
router.get('/special-schedule',scheduleController.getSpecialSchedules);

export default router;