import express from 'express';
const examinationController = require('../controllers/examination.controller');

const router = express.Router();

router.get('/getSummary/:patientId',examinationController.getSummaryExamination);
router.get('/getDetail/:id',examinationController.getExaminationDetailById);
router.post('/temp_save',examinationController.temp_save);
router.post('/temp_get',examinationController.temp_get);
router.put('/update/:id',examinationController.updateExamination);
router.post('/submitTestResult',examinationController.submitTestResult);
router.get('/getExaminationByDate/:doctorId', examinationController.getExaminationsByDate);
router.get('/getExaminationByMonth/:doctorId', examinationController.getExaminationsByMonth);
router.get('/list/:doctorId', examinationController.getExaminationList);
router.get('/stats/:doctorId', examinationController.getExaminationStats);

export default router;