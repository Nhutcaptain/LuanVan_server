import express from 'express';
const imageController = require('../controllers/images.controller')

const router = express.Router();

router.delete('/delete',imageController.deleteImageFromCloudinary);

export default router;