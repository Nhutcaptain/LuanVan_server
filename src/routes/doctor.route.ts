import express from "express";
const doctorController = require('../controllers/doctorController');
import { authenticate } from "../middlewares/auth.middleware";

const router = express.Router();

router.post('/create',doctorController.createDoctor);
router.get('/get',authenticate, doctorController.getDoctor)
router.get('/getByDoctorId/:id',doctorController.getByDoctorId);
router.get('/getAll',doctorController.getAllDoctor);
router.put('/update/:id',doctorController.updateDoctor);
router.get('/getDoctorBySlug',doctorController.getDoctorBySlug);
router.get('/getDoctorBySpecialtyId/:specialtyId',doctorController.getDoctorBySpecialtyId);
router.get('/getDoctorIdByUserId/:userId',doctorController.getDoctorIdByUserId);
router.get('/getByDepartment/:id',doctorController.getDoctorByDepartment)
router.get('/getForAppointment/:departmentId',doctorController.getDoctorByDepartmentId);
router.get('/search',doctorController.searchDoctorsByName);

export default router;