import { Request, Response } from 'express';
import { User } from '../models/user.model';
import { Doctor } from '../models/doctor.model';
import { Appointment } from '../models/appointment.model';
import bcrypt from 'bcryptjs';

const toSlug = (str: string) => {
  return str
    .trim()
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // Bỏ dấu tiếng Việt
    .replace(/\s+/g, '-')                             // Thay khoảng trắng bằng dấu gạch ngang
    .replace(/[^a-zA-Z0-9\-]/g, '');                  // Bỏ ký tự đặc biệt
};

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
        const nameSlug = `bs-${toSlug(fullName)}`;
        const newDoctor = new Doctor({
            userId: savedUser._id,
            specialization,
            nameSlug,
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

interface IPopulatedDoctor extends Document {
  userId: {
    fullName: string;
    avatar: any;
    dateOfBirth: string;
  };
  departmentId: {
    name: string;
  };
  certificate: string[];
  experience: string[];
  specialization: string;
}

export const getDoctorBySlug = async(req: any, res: any) => {
    const {nameSlug} = req.query;
    try {
        const doctor = await Doctor.findOne({ nameSlug })
            .populate({
                path: 'userId',
                select: 'fullName avatar dateOfBirth'
            })
            .populate({
                path: 'departmentId',
                select: 'name',
            }) as unknown as IPopulatedDoctor;

        if(!doctor) {
            return res.status(404).json({message:'Không tìm thấy bác sĩ'});
        }

        const simplified = {
            fullName: doctor.userId?.fullName,
            certificate: doctor.certificate,
            experience: doctor.experience,
            avatar: doctor.userId?.avatar,
            dateOfBirth: doctor.userId?.dateOfBirth,
            department: doctor.departmentId?.name,
            specialization: doctor.specialization,
        };

        res.status(200).json(simplified);

    }catch(error) { 
        console.error(error);
    }
}

export const getDoctorBySpecialtyId = async( req: any, res: any) => {
    const { specialtyId } = req.params;

  try {
    if (!specialtyId) {
      return res.status(400).json({ message: "Thiếu specialtyId trong yêu cầu." });
    }

    const doctors = await Doctor.find({ specialtyId })
      .populate({
        path: 'userId',
        select: 'fullName' // chỉ lấy tên từ userId
      })
      .select('_id userId'); // chỉ lấy _id và userId (đã populate)

    // Trả về dữ liệu gồm _id của bác sĩ và tên
    const result = doctors.map(doc  => {
      const user = doc.userId as { fullName?: string };
      return {
        _id: doc._id,
        name: user?.fullName || 'Không rõ tên'
      };
    });

    res.status(200).json(result);
  } catch (error) {
    console.error('Lỗi khi lấy danh sách bác sĩ theo chuyên khoa:', error);
    res.status(500).json({ message: 'Đã xảy ra lỗi khi lấy bác sĩ.' });
  }
}