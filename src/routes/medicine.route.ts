import express from 'express';
const medicineController = require('../controllers/medicine.controller');
const router = express.Router();

router.get('/getAll', medicineController.getAll);
router.post('/create',medicineController.createMedicine);

export default router;