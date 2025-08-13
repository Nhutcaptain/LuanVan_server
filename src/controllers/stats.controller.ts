import { Request, Response } from "express";
import { Examination } from "../models/examination.model";
import { Doctor } from "../models/doctor.model";
import mongoose from "mongoose";

const getDateRange = (type: string, customMonth?: number, customYear?: number) => {
  const now = new Date();
  const offset = 7 * 60 * 60 * 1000; // offset UTC+7

  let start: Date, end: Date;

  if (type === "daily") {
    const localNow = new Date(now.getTime() + offset);
    start = new Date(localNow.setHours(0, 0, 0, 0) - offset);
    end = new Date(localNow.setHours(23, 59, 59, 999) - offset);
  } else if (type === "weekly") {
    const localNow = new Date(now.getTime() + offset);
    const day = localNow.getDay();
    const diff = localNow.getDate() - day + (day === 0 ? -6 : 1); // Tính thứ 2 đầu tuần
    const monday = new Date(localNow.setDate(diff));
    start = new Date(new Date(monday.setHours(0, 0, 0, 0)).getTime() - offset);
    end = new Date(new Date(monday.setDate(monday.getDate() + 6)).setHours(23, 59, 59, 999) - offset);
  } else if (type === "monthly") {
    const localNow = new Date(now.getTime() + offset);
    const year = customYear || localNow.getFullYear();
    const month = customMonth != null ? customMonth - 1 : localNow.getMonth(); // JavaScript month: 0-indexed

    const firstDay = new Date(year, month, 1, 0, 0, 0, 0);
    const lastDay = new Date(year, month + 1, 0, 23, 59, 59, 999);

    start = new Date(firstDay.getTime() - offset);
    end = new Date(lastDay.getTime() - offset);
  } else {
    throw new Error("Invalid type");
  }

  return { start, end };
};

export const getStats = async (req: Request, res: Response) => {
  try {
    const { type, doctorId, month, year } = req.query;

    if (!type || typeof type !== "string") {
      return res.status(400).json({ message: "Missing or invalid type" });
    }

    const selectedMonth = month ? parseInt(month as string, 10) : undefined;
    const selectedYear = year ? parseInt(year as string, 10) : undefined;

    const { start, end } = getDateRange(type, selectedMonth, selectedYear);

    const matchQuery: any = {
      date: { $gte: start, $lte: end },
    };
    if (doctorId) matchQuery.doctorId = doctorId;

    const uniquePatients = await Examination.aggregate([
      { $match: matchQuery },
      { $group: { _id: "$patientId" } },
      { $count: "count" },
    ]);

    const doctorStats = await Examination.aggregate([
      { $match: matchQuery },
      { $group: { _id: "$doctorId", totalExaminations: { $sum: 1 } } },
    ]);

    const topDiseases = await Examination.aggregate([
      { $match: { ...matchQuery, provisional: { $ne: null } } },
      { $group: { _id: "$provisional", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    res.status(200).json({
      patients: uniquePatients[0]?.count || 0,
      doctors: doctorStats.map((item) => ({
        doctorId: item._id,
        totalExaminations: item.totalExaminations,
      })),
      topDiseases,
      range: { start, end },
    });
  } catch (err) {
    console.error("Stats error", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

interface StatisticsRequest {
  startDate: string;
  endDate: string;
  viewMode: 'all' | 'doctor' | 'department';
  doctorId?: string;
  departmentId?: string;
}

interface DiagnosisStat {
  diagnosis: string;
  count: number;
}

interface DoctorStat {
  doctorId: string;
  doctorName: string;
  count: number;
}

interface DepartmentStat {
  departmentId: string;
  departmentName: string;
  count: number;
}

interface ApiResponse {
  success: boolean;
  message?: string;
  diagnosisStats?: DiagnosisStat[];
  doctorStats?: DoctorStat[];
  departmentStats?: DepartmentStat[];
  error?: string;
}

export const getStatistics = async (req: Request<{}, {}, StatisticsRequest>, res: Response<ApiResponse>) => {
  // Validate request body
  if (!req.body.startDate || !req.body.endDate || !req.body.viewMode) {
    return res.status(400).json({
      success: false,
      error: 'Missing required fields: startDate, endDate, viewMode'
    });
  }

  try {
    const { startDate, endDate, viewMode, doctorId, departmentId } = req.body;
    console.log(req.body);

    // Validate dates
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({
        success: false,
        error: 'Invalid date format'
      });
    }

    if (start > end) {
      return res.status(400).json({
        success: false,
        error: 'Start date must be before end date'
      });
    }

    // Validate IDs if provided
    if (doctorId && !mongoose.Types.ObjectId.isValid(doctorId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid doctorId format'
      });
    }

    if (departmentId && !mongoose.Types.ObjectId.isValid(departmentId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid departmentId format'
      });
    }

    // Base query
    const query: {
      date: {
        $gte: Date;
        $lte: Date;
      };
      doctorId?: any;
    } = {
      date: {
        $gte: start,
        $lte: end
      }
    };

    // Apply filters based on view mode
    if (viewMode === 'doctor' && doctorId) {
      query.doctorId = new mongoose.Types.ObjectId(doctorId);
    } else if (viewMode === 'department' && departmentId) {
      const doctorsInDept = await Doctor.find({ 
        departmentId: new mongoose.Types.ObjectId(departmentId) 
      }).select('_id');
      
      const doctorIds = doctorsInDept.map(d => d._id);
      query.doctorId = { $in: doctorIds };
    }

    // Get examinations with populated data
    const examinations = await Examination.find(query)
      .populate<{
        doctorId: {
          _id: mongoose.Types.ObjectId;
          name: string;
          departmentId: {
            _id: mongoose.Types.ObjectId;
            name: string;
          };
        };
      }>({
        path: 'doctorId',
        select: 'name departmentId',
        populate: {
          path: 'departmentId',
          select: 'name'
        }
      });

    // Calculate diagnosis statistics
    const diagnosisStats = examinations.reduce((acc, exam) => {
      const diagnosis = exam.provisional || 'Không có chẩn đoán';
      const existing = acc.find(item => item.diagnosis === diagnosis);
      if (existing) {
        existing.count++;
      } else {
        acc.push({ diagnosis, count: 1 });
      }
      return acc;
    }, [] as DiagnosisStat[]).sort((a, b) => b.count - a.count);

    // Calculate doctor statistics
    const doctorStats = examinations.reduce((acc, exam) => {
      if (!exam.doctorId) return acc;
      
      const doctorId = exam.doctorId._id.toString();
      const existing = acc.find(item => item.doctorId === doctorId);
      if (existing) {
        existing.count++;
      } else {
        acc.push({ 
          doctorId,
          doctorName: exam.doctorId.name,
          count: 1
        });
      }
      return acc;
    }, [] as DoctorStat[]).sort((a, b) => b.count - a.count);

    // Calculate department statistics
    const departmentStats = examinations.reduce((acc, exam) => {
      if (!exam.doctorId?.departmentId) return acc;
      
      const departmentId = exam.doctorId.departmentId._id.toString();
      const existing = acc.find(item => item.departmentId === departmentId);
      if (existing) {
        existing.count++;
      } else {
        acc.push({ 
          departmentId,
          departmentName: exam.doctorId.departmentId.name,
          count: 1
        });
      }
      return acc;
    }, [] as DepartmentStat[]).sort((a, b) => b.count - a.count);

    return res.status(200).json({
      success: true,
      diagnosisStats,
      doctorStats,
      departmentStats
    });

  } catch (error) {
    console.error('Error in statistics API:', error);
    return res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
};