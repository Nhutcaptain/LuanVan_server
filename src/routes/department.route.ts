import express from 'express';
const departmentController = require('../controllers/deparment.controller');
const router = express.Router()

router.post('/create',departmentController.createDepartment);
router.get('/getAll/:departmentId',departmentController.getDoctorsByDepartment);
router.post('/createSpecialty',departmentController.createSpecialty);
router.get('/specialty',departmentController.getAllSpecialty);
router.get('/getAllDepartment', departmentController.getAllDepartment);
router.get('/getAllSpecialtyByDepartmentId/:departmentId', departmentController.getAllSpecialtyByDepartmentId);
router.put('/updateSpecialty/:id',departmentController.updateSpecialty);
router.put('/updateDepartment/:id',departmentController.updateDepartment);
router.get('/getById/:id',departmentController.getDepartmentById);
router.get('/getIntroduction/:id', departmentController.getIntroduction);
router.delete('/delete/:id', departmentController.deleteDepartment);


export default router;