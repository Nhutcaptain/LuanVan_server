import express from 'express';
const serviceController = require('../controllers/service.controller');
const router = express.Router()

router.post('/create',serviceController.createService);
router.get('/getById/:id',serviceController.getServiceById);
router.get('/getAll',serviceController.getAllServices);
router.get('/getBySpecialtyId/:id',serviceController.getBySpecialtyId);
export default router;