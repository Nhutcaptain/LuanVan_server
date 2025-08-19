import { Request, Response } from 'express';
import { User } from '../models/user.model';
import { Doctor } from '../models/doctor.model';
import { Appointment } from '../models/appointment.model';
import bcrypt from 'bcryptjs';
import { getSubSpecialtyFromDiagnosis } from '../config/services/gpt.service';
import { Specialty } from '../models/specialty.model';
import { OvertimeSchedule } from '../models/overtimeSchedule.model';
import { WeeklySchedule } from '../models/weeklySchedule.model';
import { Department } from '../models/deparment.model';
import { toSlug } from '../utils/toslug';


export const createDoctor = async (req: any, res: any) => {
  try {
    const {
      userId,       
      departmentId,
      specialtyId,
      specialization,
      certificate,
      experience,
      schedule,
      description,
      degree,
      academicTitles,
      overtimeExaminationPrice,
      officeExaminationPrice,
    } = req.body;

    const {
      email,
      password,
      fullName,
      phone,
      dateOfBirth,
      gender,
      address,
      avatar
    } = userId;

    // Kiểm tra email đã tồn tại
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log('Email đã tồn tại');
      return res.status(400).json({ message: 'Email đã tồn tại' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Tạo User
    const newUser = new User({
      email,
      password: hashedPassword,
      fullName,
      phone,
      dateOfBirth,
      gender,
      address,
      avatar,
      role: 'doctor',
    });

    const savedUser = await newUser.save();

    // Tạo bác sĩ tương ứng
    const nameSlug = `bs-${toSlug(fullName)}`;
    const newDoctor = new Doctor({
      userId: savedUser._id,
      specialization,
      departmentId,
      specialtyId: specialtyId && specialtyId !== "" ? specialtyId : null,
      nameSlug,
      certificate,
      experience,
      schedule,
      description,
      degree,
      academicTitles,
      overtimeExaminationPrice,
      officeExaminationPrice,
    });

    const savedDoctor = await newDoctor.save();

    res.status(201).json({
      message: 'Đã tạo bác sĩ thành công',
      doctor: savedDoctor,
    });
  } catch (error) {
    console.error('Error creating doctor:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};


export const getDoctor = async (req: any, res: any) => {
    try{
        const userId = req.user.userId;
        const user = await User.findById(userId);
        if(!user) {
            return res.status(404).json({message: 'Không tìm thấy người dùng'});
        }
        const doctor = await Doctor.findOne({userId})
          .populate('userId')
          .populate('specialtyId','name')
          .populate('departmentId', 'name')
          ;
        if(!doctor) {
            return res.status(404).json({message: 'Không tìm thấy bác sĩ'});
        }

        res.status(200).json(doctor);
    }catch(error) {
        console.error('Lỗi khi lấy thông tin bác sĩ:', error);
        res.status(500).json({ message: 'Lỗi server' });
    }
}

export const getByDoctorId = async(req: any, res: any) => {
   try{
    const {id} = req.params;
    if(!id) {
      return res.status(400).json({message: 'Thiếu thông tin'});
    }
    const doctors = await Doctor.findById(id)
      .populate('userId', 'fullName email phone')
      .populate('specialtyId','name _id')
      .populate('departmentId', '_id name')
      ;
    ;
    if(!doctors) {
      return res.status(404).json({message: 'Không có bác sĩ nào thuộc khoa này'});
    }
    return res.status(200).json(doctors);
  }catch(error) {
    console.error(error);
    return res.status(500).json({message: 'Lỗi ở server'});
  }
}

export const getAllDoctor = async (req: any, res: any) => {
    try {
        const doctors = await Doctor.find().populate({
            path: 'userId',
            match: {role: 'doctor'},
            select: '-password',
        }).populate('departmentId','name').lean();
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
    _id: string;
    fullName: string;
    avatar: any;
    dateOfBirth: string;
    gender: string;
  };
  _id: string;
  departmentId: {
    _id: string;
    name: string;
  };
  certificate: string[];
  experience: string[];
  specialtyId:{
    _id: string;
    name: string;
  },
  degree: string;
  academicTitle: string;
  description: string;
}

// export const getDoctorForAppointment = async(req: any, res: any) => {
//   const{doctorSlug} = req.query;
//   try{
//     if(!doctorSlug) {
//       return res.status(400).json({message: 'Thiếu doctorSlug trong yêu cầu'});
//     }

//     const doctor = await Doctor.findOne({nameSlug: doctorSlug})
     
//   }catch(error) {
//     console.error(error);
//     res.status(500).json({message: 'Lỗi ở server'});
//   }
// }
export const getDoctorByDepartment = async(req: any, res: any) => {
  try{
    const {id} = req.params;
    if(!id) {
      return res.status(400).json({message: 'Thiếu thông tin'});
    }
    const doctors = await Doctor.find({departmentId: id})
      .populate('userId', 'fullName email phone')
      .populate('specialtyId','name _id');
    ;
    if(!doctors) {
      return res.status(404).json({message: 'Không có bác sĩ nào thuộc khoa này'});
    }
    return res.status(200).json(doctors);
  }catch(error) {
    console.error(error);
    return res.status(500).json({message: 'Lỗi ở server'});
  }
}

export const getDoctorBySlug = async(req: any, res: any) => {
    const {nameSlug} = req.query;
    try {
        const doctor = await Doctor.findOne({ nameSlug })
            .populate({
                path: 'userId',
                select: 'fullName avatar dateOfBirth gender'
            })
            .populate('specialtyId', 'name')
            .populate({
                path: 'departmentId',
                select: 'name',
            }) as unknown as IPopulatedDoctor;

        if(!doctor) {
            return res.status(404).json({message:'Không tìm thấy bác sĩ'});
        }

        const schedule = await WeeklySchedule.findOne({doctorId: doctor._id})
            .populate('schedule.shiftIds','name startTime endTime locationId');
        ;

        const simplified = {
            _id: doctor._id,
            fullName: doctor.userId?.fullName,
            certificate: doctor.certificate,
            experience: doctor.experience,
            avatar: doctor.userId?.avatar,
            dateOfBirth: doctor.userId?.dateOfBirth,
            departmentId: doctor.departmentId,
            specialtyId: doctor.specialtyId,
            gender: doctor.userId.gender,
            schedule: schedule,
            degree: doctor.degree,
            academicTitle: doctor.academicTitle,
            description: doctor.description,
        };

        res.status(200).json(simplified);

    }catch(error) { 
        console.error(error);
    }
}

export const getDoctorIdByUserId = async (req: any, res: any) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ message: 'Thiếu userId.' });
    }

    const doctor = await Doctor.findOne({ userId }).select('_id');

    if (!doctor) {
      return res.status(404).json({ message: 'Không tìm thấy bác sĩ với userId đã cho.' });
    }

    return res.status(200).json({ doctorId: doctor._id });
  } catch (error) {
    console.error('Lỗi khi tìm bác sĩ:', error);
    return res.status(500).json({ message: 'Lỗi server.' });
  }
};


export const generateDoctorPrompt = async (doctorSlug: string) => {
  try {
    const doctor = await Doctor.findOne({ nameSlug: doctorSlug })
      .populate({
        path: 'userId',
        select: 'fullName _id dateOfBirth'
      })
      .populate('specialtyId', 'name')
      .populate('departmentId', 'name') as unknown as IPopulatedDoctor;

    if (!doctor) return null;

    const overtimeSchedule = await OvertimeSchedule.findOne({ doctorId: doctor.userId?._id })
    ;

    // Biến dữ liệu thành văn bản
    const fullName = doctor.userId?.fullName;
    const department = (doctor.departmentId as any)?.name;
    const specialty = (doctor.specialtyId as any)?.name;
    const experience = doctor.experience;
    const certificate = doctor.certificate;
    const dob = doctor.userId?.dateOfBirth;
    let age = 'Không rõ';
    if (dob) {
      const birthDate = new Date(dob);
      const today = new Date();
      age = (today.getFullYear() - birthDate.getFullYear()).toString();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age = (parseInt(age) - 1).toString(); // chưa tới sinh nhật trong năm
      }
    }

    const scheduleText = overtimeSchedule?.weeklySchedule
      .filter(day => day.isActive)
      .map(day => {
        const dayNames = ['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy'];
        const slots = day.slots.map(slot => `từ ${slot.startTime} đến ${slot.endTime}`).join(', ');
        return `- ${dayNames[day.dayOfWeek]} tại cơ sở ID: ${day.locationId}: ${slots}`;
      }).join('\n') || 'Không có lịch làm ngoài giờ.';

    const prompt = `
Dưới đây là thông tin về một bác sĩ. Hãy giúp tôi viết lại đoạn giới thiệu ngắn gọn, chuyên nghiệp và dễ đọc cho người bệnh. 

**Thông tin bác sĩ:**
- Họ tên: ${fullName}
- Tuổi: ${age}
- Khoa: ${department}
- Chuyên khoa: ${specialty}
- Kinh nghiệm: ${experience || 'Không rõ'}
- Bằng cấp: ${certificate || 'Không rõ'}

**Lịch khám ngoài giờ:**
${scheduleText}

Viết lại đoạn giới thiệu để có thể hiển thị lên website.
`.trim();

    return prompt;

  } catch (error) {
    console.error(error);
    return null;
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
      .select('_id userId overtimeExaminationPrice officeExaminationPrice'); // chỉ lấy _id và userId (đã populate)

    // Trả về dữ liệu gồm _id của bác sĩ và tên
    const result = doctors.map(doc  => {
      const user = doc.userId as { fullName?: string };
      return {
        _id: doc._id,
        name: user?.fullName || 'Không rõ tên',
        overtimeExaminationPrice: doc.overtimeExaminationPrice,
        officeExaminationPrice: doc.officeExaminationPrice,
      };
    });

    res.status(200).json(result);
  } catch (error) {
    console.error('Lỗi khi lấy danh sách bác sĩ theo chuyên khoa:', error);
    res.status(500).json({ message: 'Đã xảy ra lỗi khi lấy bác sĩ.' });
  }
}

export const getDoctorByDepartmentId = async( req: any, res: any) => {
    const { departmentId } = req.params;

  try {
    if (!departmentId) {
      return res.status(400).json({ message: "Thiếu specialtyId trong yêu cầu." });
    }

    const doctors = await Doctor.find({ departmentId })
      .populate({
        path: 'userId',
        select: 'fullName' // chỉ lấy tên từ userId
      })
      .select('_id userId overtimeExaminationPrice officeExaminationPrice'); // chỉ lấy _id và userId (đã populate)

    // Trả về dữ liệu gồm _id của bác sĩ và tên
    const result = doctors.map(doc  => {
      const user = doc.userId as { fullName?: string };
      return {
        _id: doc._id,
        name: user?.fullName || 'Không rõ tên',
        overtimeExaminationPrice: doc.overtimeExaminationPrice,
        officeExaminationPrice: doc.officeExaminationPrice,
      };
    });
    res.status(200).json(result);
  } catch (error) {
    console.error('Lỗi khi lấy danh sách bác sĩ theo chuyên khoa:', error);
    res.status(500).json({ message: 'Đã xảy ra lỗi khi lấy bác sĩ.' });
  }
}

export const getDoctorsByDepartmentName = async( departmentName: string) => {
  try{
    const department = await Department.findOne({name: departmentName})
      .collation({ locale: 'vi', strength: 1 })
      .select('_id');
  if(!department){
    console.log("Không tìm thấy khoa", departmentName, department)
    return [];
  };
  const doctors = await Doctor.find({departmentId: department._id})
    .limit(5)
    .populate('userId', 'fullName avatar').populate('specialtyId', 'name').populate('departmentId', 'name')
    .select('_id nameSlug')
    if(!doctors || doctors.length === 0) return [];
    return doctors;
  }catch(error) {
    console.error(error);
  }
}

export const getSuggestDoctors = async(diagnosis: string) => {
    try{
        const specialization = await getSubSpecialtyFromDiagnosis(diagnosis);
        const specialty = await Specialty.findOne({name: specialization}).select('_id')
        if (!specialization || !specialty) return [];
        const doctors = await Doctor.find({
            specialtyId: specialty._id
        })
            .limit(3)
            .populate("userId", "fullName avatar").populate('specialtyId', 'name')
            .select('_id nameSlug');
            
        if (!doctors || doctors.length === 0) {
            return [];
        }
         return doctors;
    }catch(error) {
        console.error(error);
    }
}

export const searchDoctorsByName = async (req: any, res: any) => {
  const title = req.query.title as string;

  if (!title || !title.trim()) {
    return res.status(400).json({ message: "Từ khóa tìm kiếm không hợp lệ." });
  }

  try {
    // Tìm tất cả bác sĩ, populate userId để truy cập fullName
    const doctors = await Doctor.find()
      .populate({
        path: "userId",
        match: {
          fullName: { $regex: title, $options: "i" }, // tìm không phân biệt hoa thường
        },
        select: "fullName avatar", // chỉ lấy các trường cần thiết
      })
      .populate("departmentId", 'name')
      .populate("specialtyId", 'name');

    // Lọc bỏ những bác sĩ không có user match
    const filtered = doctors.filter(doc => doc.userId); // do match có thể null
    console.log(filtered);

    res.status(200).json(filtered);
  } catch (error) {
    console.error("Lỗi khi tìm kiếm bác sĩ:", error);
    res.status(500).json({ message: "Lỗi server." });
  }
};