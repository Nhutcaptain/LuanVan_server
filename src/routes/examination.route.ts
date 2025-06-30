import express from 'express';
const examinationController = require('../controllers/examination.controller');

const router = express.Router();

router.get('/getSummary/:patientId',examinationController.getSummaryExamination);
router.get('/getDetail/:id',examinationController.getExaminationDetailById);

export default router;