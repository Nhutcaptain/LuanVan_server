const patientController = require('../controllers/patient.controller');

import express from 'express';

const router = express.Router();

router.post('/create',patientController.createHealthStatus);
router.get('/get/:id',patientController.getHealthStatus);
router.post('/getPatientWithName',patientController.getPatientWithName);
router.post('/postExamination',patientController.createExamination);
router.get('/getPatientWithId/:id',patientController.getPatientWithId);
router.put('/updateHealthStatus/:userId',patientController.updateHealthStatus);

export default router;