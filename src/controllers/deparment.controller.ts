import { Department } from "../models/deparment.model"
import { Doctor } from "../models/doctor.model";
import { Specialty } from "../models/specialty.model";

interface DoctorPopulated {
  _id: string;
  userId: {
    fullName: string;
    avatar: string;
  };
  departmentId: {
    name: string;
  };
  specialization: string;
}

export const createDepartment = async(req: any, res: any) => {
    try{
        const data = req.body;
        const result = await Department.create(data);
        if(!result) {
            return res.status(400).json({message:'Lỗi khi tạo khoa'});
        }
        return res.status(201).json(result);
    }catch(error){
        console.error(error);
        return res.status(500).json(error);
    }
}

export const getAllDepartment = async(re: any, res: any) => {
    try {
    const departments = await Department.find().select('name _id');

    res.status(200).json(departments);
  } catch (error) {
    console.error('Lỗi khi lấy danh sách tên khoa:', error);
    res.status(500).json({ message: 'Đã xảy ra lỗi khi lấy tên các khoa.' });
  }
}

export const getAllSpecialtyByDepartmentId = async (req: any, res: any) => {
    const { departmentId } = req.params;

  try {
    if (!departmentId) {
      return res.status(400).json({ message: "Thiếu departmentId trong yêu cầu." });
    }

    const specialties = await Specialty.find({ departmentId }).select('_id name');

    res.status(200).json(specialties);
  } catch (error) {
    console.error('Lỗi khi lấy danh sách chuyên khoa theo khoa:', error);
    res.status(500).json({ message: 'Đã xảy ra lỗi khi lấy chuyên khoa.' });
  }
}

export const getDoctorsByDepartment = async(req: any, res: any) => {
    const {departmentId} = req.params;
    try {
        const doctors = await Doctor.find({departmentId})
        .populate({
            path:'userId',
            select: 'fullName avatar'
        })
        .populate({
            path: 'departmentId',
            select: 'name',
        });

        const simplified = doctors.map((doc: any) => ({
            _id: doc.userId?._id,
            fullName: doc.userId?.fullName,
            avatar: doc.userId?.avatar,
            department: doc.departmentId?.name,
            specialization: doc.specialization,
            nameSlug: doc.nameSlug,
        }));

        res.status(200).json(simplified);

    }catch(error) { 
        console.error(error);
    }
}

export const createSpecialty = async(req: any, res: any) => {
    try{
        const data = req.body;
        const result = await Specialty.create(data);
        if(!result) {
            return res.status(400).json({message: 'Lỗi khi tạo chuyên khoa'});
        }
        return res.status(201).json(result);
    }catch(err) {
        console.error(err);
        return res.status(500).json({message: 'Lỗi server', err});
    }
}

export const getAllSpecialty = async(req: any, res: any) => {
    try{
        const specialtyData = await Specialty.find();
        if(!specialtyData) {
            return res.status(404).json({message: 'Không có chuyên khoa nào'});
        }
        return res.status(200).json(specialtyData);
    }catch(error) { 
        console.error(error);
        return res.status(500).json({message: 'Lỗi server khi lấy chuyên khoa', error});
    }
}

export const getSpecialtyById = async(req: any, res: any) => {
    const { id } = req.params;

    try {
        const specialty = await Specialty.findById(id);

        if (!specialty) {
            return res.status(404).json({ message: 'Không tìm thấy chuyên khoa.' });
        }

        res.status(200).json(specialty);
    } catch (error) {
        console.error('Lỗi khi lấy chuyên khoa:', error);
        res.status(500).json({ message: 'Đã xảy ra lỗi khi lấy chuyên khoa.' });
    }
}