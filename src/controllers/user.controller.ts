import { Request, Response } from 'express';
import { User } from '../models/user.model';
import { Patient } from '../models/patient.model';
import {Examination} from '../models/examination.model';
import { Doctor } from '../models/doctor.model';

export const getAllUsers = async (_req: Request, res: Response) => {
  const users = await User.find();
  res.json(users);
};

export const createUser = async (req: Request, res: Response) => {
  const newUser = new User(req.body);
  await newUser.save();
  res.status(201).json(newUser);
};

export const updateUser = async (req: any, res: any) => {
  const userId = req.user.userId;
  const profileData = req.body;

  try {
    // Kiểm tra trùng số điện thoại
    if (profileData.phone) {
      const existingPhone = await User.findOne({
        phone: profileData.phone,
        _id: { $ne: userId } // Loại trừ chính user đang cập nhật
      });
      if (existingPhone) {
        return res.status(400).json({
          message: 'Số điện thoại đã được sử dụng bởi người dùng khác.'
        });
      }
    }

    // Kiểm tra trùng số CCCD / CMND
    if (profileData.idNumber) {
      const existingId = await User.findOne({
        idNumber: profileData.idNumber,
        _id: { $ne: userId }
      });
      if (existingId) {
        return res.status(400).json({
          message: 'Số căn cước / CMND đã được sử dụng bởi người dùng khác.'
        });
      }
    }

    // Cập nhật người dùng
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: profileData },
      { new: true, runValidators: true, context: 'query' }
    ).select('-password -__v');

    if (!updatedUser) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng.' });
    }

    return res.status(200).json({
      message: 'Cập nhật thông tin người dùng thành công.',
      user: updatedUser
    });

  } catch (error) {
    console.error('Error updating user:', error);
    return res.status(500).json({
      message: 'Lỗi khi cập nhật thông tin người dùng.'
    });
  }
};

export const createTemporaryUser = async (req: any, res: any) => {
  try{
    const {fullName, phone, dateOfBirth, gender, address, medicalHistory,
      allergies,
      medications,
      insurance} = req.body;
    const existingUser = await User.findOne({
      phone,
      dateOfBirth: new Date(dateOfBirth)
    });

    if (existingUser) {
      const existingPatient = await Patient.findOne({ userId: existingUser._id });

      return res.status(200).json({
        message: 'Người dùng đã tồn tại.',
        user: existingUser,
        patient: existingPatient || null
      });
    }

    const newUser = await User.create({
      fullName,
      phone,
      dateOfBirth: new Date(dateOfBirth),
      gender,
      address,
      role: 'patient',
      isActive: true
    });

    const newPatient = await Patient.create({
      userId: newUser._id,
      medicalHistory,
      allergies,
      medications,
      insurance
    });

     return res.status(201).json({
      message: 'Tạo user tạm thời thành công.',
      user: newUser
    });
  }catch(error) {
    console.error('Lỗi khi tạo temp user', error);
    return res.status(500).json({message: 'Lỗi phía server khi tạo user ẩn danh', error});
  }
}

export const getUserIdByDoctorId = async(req: any, res:any) => {
  try{
    const {doctorId} = req.params;
    if(!doctorId) {
      return res.status(400).json({message: 'Thiếu doctorId trong yêu cầu'});
    }
    const doctor = await Doctor.findById(doctorId).select('userId');
    if(!doctor) {
      return res.status(404).json({message: 'Không tìm thấy người dùng này'});
    }
    return res.status(200).json({userId: doctor.userId.toString()});
  }catch(error) {
    console.error(error);
    return res.status(500).json({message: 'Lỗi của server'});
  }
}