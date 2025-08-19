import { Department } from "../models/deparment.model";
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

export const createDepartment = async (req: any, res: any) => {
  try {
    const dept = new Department(req.body);
    await dept.save();
    return res.status(201).json(dept);
  } catch (error: any) {
    console.error("Error creating department:", error.message);
    return res.status(400).json({
      success: false,
      message: error.message || "Lỗi khi tạo khoa",
    });
  }
};

export const deleteDepartment = async (req: any, res: any) => {
  try {
    const { id } = req.params;

    // Tìm và xoá chuyên khoa
    const deletedDepartment = await Department.findByIdAndDelete(id);

    if (!deletedDepartment) {
      return res.status(404).json({ message: 'Không tìm thấy chuyên khoa để xoá' });
    }

    // Cập nhật các bác sĩ có departmentId = id, xoá liên kết
    await Doctor.updateMany(
      { departmentId: id },
      { $unset: { departmentId: "" } } // hoặc { $set: { departmentId: null } } nếu bạn muốn null
    );

    return res.status(200).json({
      message: 'Xoá chuyên khoa thành công và đã cập nhật danh sách bác sĩ',
      deleted: deletedDepartment
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Lỗi máy chủ', error });
  }
};

export const getAllDepartment = async (re: any, res: any) => {
  try {
    const departments = await Department.find()
      .select("name _id serviceIds description content")
      .populate("serviceIds")
      .sort({ name: 1 });

    res.status(200).json(departments);
  } catch (error) {
    console.error("Lỗi khi lấy danh sách tên khoa:", error);
    res.status(500).json({ message: "Đã xảy ra lỗi khi lấy tên các khoa." });
  }
};

export const getDepartmentById = async (req: any, res: any) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ message: "Thiếu thông tin" });
    const department = await Department.findById(id);
    if (!department)
      return res.status(404).json({ message: "Không tìm thấy khoa này" });
    return res.status(200).json(department);
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "lỗi server khi lấy thông tin khoa" });
  }
};

export const getAllSpecialtyByDepartmentId = async (req: any, res: any) => {
  const { departmentId } = req.params;

  try {
    if (!departmentId) {
      return res
        .status(400)
        .json({ message: "Thiếu departmentId trong yêu cầu." });
    }

    const specialties = await Specialty.find({ departmentId })
      .populate("serviceIds")
      .sort({ name: 1 });

    res.status(200).json(specialties);
  } catch (error) {
    console.error("Lỗi khi lấy danh sách chuyên khoa theo khoa:", error);
    res.status(500).json({ message: "Đã xảy ra lỗi khi lấy chuyên khoa." });
  }
};

export const updateSpecialty = async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const data = req.body;
    if (!id) {
      return res.status(400).json({ message: "Thiếu thông tin" });
    }
    const result = await Specialty.findByIdAndUpdate(id, data, { new: true });
    if (!result) {
      return res
        .status(404)
        .json({ message: "Không tìm thấy chuyên khoa này" });
    }
    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({ message: "Lỗi từ server" });
  }
};

export const updateDepartment = async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const data = req.body;
    if (!id) {
      return res.status(400).json({ message: "Thiếu thông tin" });
    }
    const result = await Department.findByIdAndUpdate(id, data, {
      new: true,
    }).populate("serviceIds");
    if (!result) {
      return res
        .status(404)
        .json({ message: "Không tìm thấy chuyên khoa này" });
    }
    return res.status(200).json(result);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Lỗi từ server" });
  }
};

export const getDoctorsByDepartment = async (req: any, res: any) => {
  const { departmentId } = req.params;
  try {
    const doctors = await Doctor.find({ departmentId })
      .populate({
        path: "userId",
        select: "fullName avatar",
      })
      .populate("specialtyId", "name")
      .populate({
        path: "departmentId",
        select: "name",
      });

    const simplified = doctors.map((doc: any) => ({
      _id: doc._id,
      fullName: doc.userId?.fullName,
      avatar: doc.userId?.avatar,
      department: doc.departmentId?.name,
      specialization: doc.specialtyId?.name || "Chưa có lĩnh vực chuyên môn",
      nameSlug: doc.nameSlug,
      degree: doc.degree,
      academicTitle: doc.academicTitle,
    }));

    res.status(200).json(simplified);
  } catch (error) {
    console.error(error);
  }
};

export const createSpecialty = async (req: any, res: any) => {
  try {
    const data = req.body;
    const result = await Specialty.create(data);
    if (!result) {
      return res.status(400).json({ message: "Lỗi khi tạo chuyên khoa" });
    }
    return res.status(201).json(result);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Lỗi server", err });
  }
};

export const getAllSpecialty = async (req: any, res: any) => {
  try {
    const specialtyData = await Specialty.find();
    if (!specialtyData) {
      return res.status(404).json({ message: "Không có chuyên khoa nào" });
    }
    return res.status(200).json(specialtyData);
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "Lỗi server khi lấy chuyên khoa", error });
  }
};

export const getNameOfAllSpecialty = async () => {
  try {
    const specialtyData = await Specialty.find().select("name");
    if (!specialtyData) {
      return [];
    }
    return specialtyData;
  } catch (error) {
    console.error(error);
    return;
  }
};

export const getSpecialtyById = async (req: any, res: any) => {
  const { id } = req.params;

  try {
    const specialty = await Specialty.findById(id);

    if (!specialty) {
      return res.status(404).json({ message: "Không tìm thấy chuyên khoa." });
    }

    res.status(200).json(specialty);
  } catch (error) {
    console.error("Lỗi khi lấy chuyên khoa:", error);
    res.status(500).json({ message: "Đã xảy ra lỗi khi lấy chuyên khoa." });
  }
};

export const getIntroduction = async (req: any, res: any) => {
  try {
    const { id } = req.params; // ID của Department
    const department = await Department.findById(id).populate({
      path: "contentId",
      select: "content", // Chỉ lấy trường 'content' từ Post
    });

    if (!department) {
      return res.status(404).json({ message: "Không tìm thấy phòng ban" });
    }

    const content = (department.contentId as any)?.content;

    return res.status(200).json({ content });
  } catch (error) {
    console.error("Lỗi khi lấy nội dung giới thiệu:", error);
    return res.status(500).json({ message: "Lỗi server" });
  }
};
