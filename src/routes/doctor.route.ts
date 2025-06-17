import express from "express";
const doctorController = require('../controllers/doctorController');
import { authenticate } from "../middlewares/auth.middleware";

const router = express.Router();

router.post('/create',doctorController.createDoctor);
router.get('/get',authenticate, doctorController.getDoctor)

export default router;