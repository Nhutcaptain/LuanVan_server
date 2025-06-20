const patientController = require('../controllers/patient.controller');

import express from 'express';

const router = express.Router();

router.post('/create',patientController.createHealthStatus);
router.get('/get/:id',patientController.getHealthStatus);
router.post('/getPatientWithName',patientController.getPatientWithName);
router.post('/postExamination',patientController.createExamination);

export default router;