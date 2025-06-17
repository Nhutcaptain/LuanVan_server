import express from "express";
const emailController = require("../controllers/emailController");
const authController = require("../controllers/authController");
import passport from 'passport';
const router = express.Router();
import jwt from 'jsonwebtoken';
import { authenticate } from "../middlewares/auth.middleware";

router.post('/test-send-email',emailController.testSendVerificationEmail);
router.post('/register', authController.register);
router.get('/verify', authController.verifyEmail);
router.post('/login', authController.login);
router.get('/logout', authController.logout);
router.get('/google',passport.authenticate('google', {scope: ['profile','email']}));
router.get('/callback/google',passport.authenticate('google',{session: false, failureRedirect: '/login'}),
    (req:any, res:any) => {
        const user = req.user;

        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET || 'defaultsecret',
            { expiresIn: '30d' }
        );

        res.redirect(`${process.env.CLIENT_REDIRECT_URL || 'http://localhost:3000'}/tai-khoan/dang-nhap-google?token=${token}`);
    }
);
router.get('/me',authenticate, authController.getMe);


export default router;