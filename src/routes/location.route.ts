import express from 'express';
const locationController = require('../controllers/location.controller');
const router = express.Router();

router.post('/create',locationController.createLocation);
router.get('/getAll',locationController.getAllLocation);

export default router;