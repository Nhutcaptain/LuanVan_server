import { User } from '../models/user.model';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';

export const createAdmin = async (req: any, res: any) => {
    try {
        const adminData = new User({
            email: 'Admin',
            fullName: 'Admin',
            password: await bcrypt.hash('admin123', 10),
            role: 'admin',
        })

        await adminData.save();
        res.status(200).json({message: 'Khởi tạo admin thành công'});
    }catch(error) {
        console.error("Không thể tạo admin");
    }
}