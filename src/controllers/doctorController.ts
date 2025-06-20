import { Request, Response } from 'express';
import { User } from '../models/user.model';
import { Doctor } from '../models/doctor.model';
import { Appointment } from '../models/appointment.model';
import bcrypt from 'bcryptjs';

export const createDoctor = async (req: Request, res: Response) => {
    try {
        const {
        email,
        password,
        fullName,
        phone,
        dateOfBirth,
        gender,
        address,
        specialization,
        certificate,
        experience,
        schedule,
        } = req.body;

        const existingUser = await User.findOne({email});
        if(existingUser) {
            return res.status(400).json({ message: 'Email đã tồn tại' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({
            email,
            password: hashedPassword,
            fullName,
            phone,
            dateOfBirth,
            gender,
            address,
            role:'doctor',
        });

        const savedUser = await newUser.save();
        const newDoctor = new Doctor({
            userId: savedUser._id,
            specialization,
            certificate,
            experience,
            schedule,
        });
        const savedDoctor = await newDoctor.save();

        res.status(201).json({message: 'Đã tạo bác sĩ thành công', doctor: savedDoctor});
    }catch(error) {
        console.error('Error creating doctor:', error);
        res.status(500).json({ message: 'Internal server error' });
    }

}

export const getDoctor = async (req: any, res: any) => {
    try{
        const userId = req.user.userId;
        const user = await User.findById(userId);
        if(!user) {
            return res.status(404).json({message: 'Không tìm thấy người dùng'});
        }
        const doctor = await Doctor.findOne({userId}).populate('userId');
        if(!doctor) {
            return res.status(404).json({message: 'Không tìm thấy bác sĩ'});
        }

        res.status(200).json(doctor);
    }catch(error) {
        console.error('Lỗi khi lấy thông tin bác sĩ:', error);
        res.status(500).json({ message: 'Lỗi server' });
    }
}

export const getAllDoctor = async (req: any, res: any) => {
    try {
        const doctors = await Doctor.find().populate({
            path: 'userId',
            match: {role: 'doctor'},
            select: '-password',
        }).lean();
        return res.status(200).json(doctors);
    }catch(error) {
        console.error('Lỗi không lây được danh sách bác sĩ');
        res.status(500).json({message: 'Lỗi khi lấy danh sách bác sĩ'});
    }
}
export const updateDoctor = async(req: any, res: any) => {
    try{
        const {id} = req.params;
        const updateData = req.body;
        console.log(updateData)
        const doctor = await Doctor.findById(id);
        
        if(!doctor) {
            return res.status(404).json({message: 'Không tìm thấy bác sĩ'});
        }

        if(updateData.userId) {
            const userData = updateData.userId;
            if (!userData.password) {
                delete userData.password;
            }
            await User.findByIdAndUpdate(doctor.userId, userData,{
                runValidators: true,
            });
        }

        delete updateData.userId;

        const updatedDoctor = await Doctor.findByIdAndUpdate(id, updateData, {
            new: true,
            runValidators: true,
        }).populate('userId');


        if(!updatedDoctor) {
            return res.status(404).json({message: 'Không tìm thấy bác sĩ'});
        }

        res.status(200).json(updatedDoctor);
    }catch(error) {
        console.error('error');
        res.status(500).json({message: 'Lỗi khi cập nhật bác sĩ phía server'});
    }
}