import { Router } from 'express';
const userController = require('../controllers/user.controller');
import jwt from 'jsonwebtoken';
import { authenticate } from "../middlewares/auth.middleware";
const adminController = require('../controllers/admin.controller')

const router = Router();

router.get('/', userController.getAllUsers);
router.post('/', userController.createUser);
router.put('/update',authenticate,userController.updateUser);
router.post('/createTempUser',userController.createTemporaryUser);
router.get('/getUserId/:doctorId',userController.getUserIdByDoctorId);


export default router;