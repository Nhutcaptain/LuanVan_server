import express from "express";
const doctorController = require('../controllers/doctorController');
import { authenticate } from "../middlewares/auth.middleware";

const router = express.Router();

router.post('/create',doctorController.createDoctor);
router.get('/get',authenticate, doctorController.getDoctor)
router.get('/getAll',doctorController.getAllDoctor);
router.put('/update/:id',doctorController.updateDoctor);
router.get('/getDoctorBySlug',doctorController.getDoctorBySlug);
router.get('/getDoctorBySpecialtyId/:specialtyId',doctorController.getDoctorBySpecialtyId);

export default router;