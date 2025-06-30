import express from 'express';
const symptomController = require('../controllers/symptom.controller')

const router = express.Router();

// POST /api/symptom/add
router.post('/add', symptomController.addSymptom);
router.post('/diagnose', symptomController.getDiagnosis);

export default router;
