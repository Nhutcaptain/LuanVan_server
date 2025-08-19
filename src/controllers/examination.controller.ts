
import { Examination } from "../models/examination.model";
import mongoose from "mongoose";
import { handleTestOrderUpdate, notifyExaminationUpdate } from "../socket";

export const getSummaryExamination = async (req: any, res: any) => {
  try {
    const { patientId } = req.params;
    console.log(patientId);
    const examinations = await Examination.find({ patientId })
      .select("doctorId date assessment isOvertimeAppointment")
      .populate({
        path: "doctorId",
        populate: {
          path: "userId",
          select: "fullName",
        },
      })
      .sort({ date: -1 })
      .lean();

    const result = examinations.map((exam: any) => {
      const doctor = exam.doctorId;
      const doctorUser = doctor?.userId;

      return {
        id: exam._id,
        date: exam.date,
        doctorName: doctorUser?.fullName || "N/A",
        assessment: exam.assessment,
        isOvertimeAppointment: exam.isOvertimeAppointment,
      };
    });

    return res.json(result);
  } catch (error) {
    console.error(error);
  }
};

export const getExaminationDetailById = async (req: any, res: any) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(404).json({ message: "Không có id" });
    }
    const detail = await Examination.findById(id)
      .populate({
        path: "doctorId",
        select: "overtimeExaminationPrice officeExaminationPrice",
        populate: {
          path: "userId",
          select: "fullName",
        },
      })
      .populate({
        path: "testOrders.serviceId",
        select: "name price",
      })
      .populate("patientId", "fullName dateOfBirth address gender phone email");

    if (!detail) {
      return res.status(404).json({ message: "Không tìm thấy phiếu khám." });
    }

    const detailObj = detail.toObject() as any;
    detailObj.doctorName = (detail.doctorId as any).userId?.fullName || "N/A";
    return res.json(detailObj);
  } catch (error) {
    console.error(error);
  }
};

export const temp_save = async (req: any, res: any) => {
  try {
    const data = req.body;
    const record = new Examination({
      ...data,
      status: "waiting_result",
    });
    record.save();
    handleTestOrderUpdate(
      record.doctorId.toString(),
      record.patientId.toString(),
      record.testOrders
    );
    return res.status(200).json(record);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Lỗi ở server" });
  }
};

export const temp_get = async (req: any, res: any) => {
  try {
    const { doctorId, patientId, date } = req.body;

    if (!doctorId || !patientId || !date) {
      return res
        .status(400)
        .json({ success: false, message: "Thiếu thông tin truy vấn" });
    }

    const inputDate = new Date(date);
    const startOfDay = new Date(inputDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(inputDate);
    endOfDay.setHours(23, 59, 59, 999);

    const record = await Examination.findOne({
      doctorId,
      patientId,
      date: {
        $gte: startOfDay,
        $lte: endOfDay,
      },
      status: "waiting_result", // chỉ lấy bản tạm có trạng thái chờ kết quả
    });

    if (!record) {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy bản ghi" });
    }

    return res.json(record);
  } catch (error) {
    console.error("Lỗi lấy dữ liệu:", error);
    return res.status(500).json({ success: false, message: "Lỗi server" });
  }
};

export const updateExamination = async (req: any, res: any) => {
  try {
    const data = req.body;
    const { id } = req.params;
    const result = await Examination.findByIdAndUpdate(
      id,
      { $set: data },
      { new: true, runValidators: true }
    );

    if (!result)
      return res.status(404).json({ Message: "Không tìm thấy kết quả này" });
    handleTestOrderUpdate(
      result.doctorId.toString(),
      result.patientId.toString(),
      data.testOrders
    );
    return res.status(200).json(result);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Lỗi server" });
  }
};

export const submitTestResult = async (req: any, res: any) => {
  const { patientCode, serviceId, resultFileUrl } = req.body;
  if (!patientCode || !serviceId || !resultFileUrl) {
    return res.status(400).json({ message: "Thiếu dữ liệu đầu vào" });
  }

  try {
    const examination = await Examination.findOne({
      patientCode,
      "testOrders.serviceId": new mongoose.Types.ObjectId(serviceId),
      "testOrders.status": "ordered",
    });

    if (!examination) {
      return res
        .status(404)
        .json({ message: "Không tìm thấy bệnh án hoặc chỉ định phù hợp" });
    }

    const testOrderIndex = examination.testOrders.findIndex(
      (order) =>
        order.serviceId.toString() === serviceId && order.status === "ordered"
    );

    if (testOrderIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy chỉ định xét nghiệm đang chờ",
      });
    }
    // Cập nhật trạng thái và kết quả
    examination.testOrders[testOrderIndex].status = "completed";
    examination.testOrders[testOrderIndex].resultFileUrl = resultFileUrl;

    await examination.save();
    notifyExaminationUpdate(examination._id.toString(), {
      testOrders: examination.testOrders,
    });
    handleTestOrderUpdate(
      examination.doctorId.toString(),
      examination.patientId.toString(),
      examination.testOrders
    );

    return res.json({
      message: "Cập nhật kết quả xét nghiệm thành công",
      examinationId: examination._id,
    });
  } catch (err) {
    console.error("Submit test result error:", err);
    res.status(500).json({ message: "Lỗi server" });
  }
};

export const getTestOrderByAppointment = async (req: any, res: any) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ message: "Thiếu thông tin" });
    const data = await Examination.findById(id);
    if (!data) return res.status(404).json({ message: "Không tìm thấy" });
    return res.status(200).json({
      testOrders: data.testOrders,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Lỗi server" });
  }
};
export const getExaminationsByDate = async (req: any, res: any) => {
  try {
    const { doctorId } = req.params;
    const { date } = req.query;

    if (!doctorId || !date) {
      return res.status(400).json({ message: "Missing doctorId or date" });
    }

    const inputDate = new Date(date as string); // yyyy-mm-dd
    const startOfDay = new Date(inputDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(inputDate);
    endOfDay.setHours(23, 59, 59, 999);

    const examinations = await Examination.find({
      doctorId,
      date: { $gte: startOfDay, $lte: endOfDay },
    })
      .populate("patientId", "fullName _id")
      .sort({ date: 1 });

    res.status(200).json(examinations);
  } catch (error) {
    console.error("Error fetching examinations:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getExaminationsByMonth = async (req: any, res: any) => {
  try {
    const { doctorId } = req.params;
    const { month } = req.query; // Ex: "2025-07"

    if (!doctorId || !month) {
      return res.status(400).json({ message: "Missing doctorId or month" });
    }

    // Parse year and month
    const [yearStr, monthStr] = (month as string).split("-");
    const year = parseInt(yearStr);
    const monthIndex = parseInt(monthStr) - 1; // JS tháng bắt đầu từ 0

    if (isNaN(year) || isNaN(monthIndex)) {
      return res
        .status(400)
        .json({ message: "Invalid month format, expected YYYY-MM" });
    }

    const startOfMonth = new Date(year, monthIndex, 1, 0, 0, 0);
    const endOfMonth = new Date(year, monthIndex + 1, 0, 23, 59, 59, 999); // ngày cuối tháng

    const examinations = await Examination.find({
      doctorId,
      date: { $gte: startOfMonth, $lte: endOfMonth },
    })
      .populate("patientId", "fullName _id")
      .sort({ date: 1 });
    console.log(examinations);

    const stats = {
      examining: examinations.filter((e) => e.status === "examining").length,
      waiting_result: examinations.filter((e) => e.status === "waiting_result")
        .length,
      completed: examinations.filter((e) => e.status === "completed").length,
      total: examinations.length,
    };

    res.status(200).json({ examinations, stats });
  } catch (error) {
    console.error("Error fetching examinations by month:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getExaminationList = async (req: any, res: any) => {
  try {
    const { doctorId } = req.params;
    const { type = "day", date, month } = req.query;

    let match: Record<string, any> = {
      doctorId: new mongoose.Types.ObjectId(doctorId),
    };

    if (type === "day") {
      const target = new Date(date);
      match.date = {
        $gte: new Date(target.setHours(0, 0, 0)),
        $lt: new Date(target.setHours(23, 59, 59)),
      };
    }
    if (type === "week") {
      const target = new Date(date);
      const start = new Date(target);
      start.setDate(target.getDate() - target.getDay());
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      end.setHours(23, 59, 59, 999);
      match.date = { $gte: start, $lt: end };
    }
    if (type === "month") {
      const [y, m] = month.split("-");
      const start = new Date(Number(y), Number(m) - 1, 1);
      const end = new Date(Number(y), Number(m), 0, 23, 59, 59, 999);
      match.date = { $gte: start, $lt: end };
    }

    const list = await Examination.find(match).populate(
      "patientId",
      "fullName"
    );
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: "Lỗi lấy danh sách bệnh án" });
  }
};

export const getExaminationStats = async (req: any, res: any) => {
  try {
    const { doctorId } = req.params;
    const { type = "day", date, month, year, byDisease } = req.query;

    let match: Record<string, any> = {
      doctorId: new mongoose.Types.ObjectId(doctorId),
    };
    let groupId;
    let format;

    if (type === "day") {
      const targetDate = new Date(date);
      match.date = {
        $gte: new Date(targetDate.setHours(0, 0, 0, 0)),
        $lt: new Date(targetDate.setHours(23, 59, 59, 999)),
      };
      groupId = "$date";
      format = "%Y-%m-%d";
    }

    if (type === "week") {
      const targetDate = new Date(date);
      const startOfWeek = new Date(targetDate);
      startOfWeek.setDate(targetDate.getDate() - targetDate.getDay());
      startOfWeek.setHours(0, 0, 0, 0);

      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      endOfWeek.setHours(23, 59, 59, 999);

      match.date = { $gte: startOfWeek, $lt: endOfWeek };
      groupId = { $dateToString: { format: "%Y-%m-%d", date: "$date" } };
      format = "%Y-%m-%d";
    }

    if (type === "month") {
      const [y, m] = month.split("-");
      const startOfMonth = new Date(Number(y), Number(m) - 1, 1);
      const endOfMonth = new Date(Number(y), Number(m), 0, 23, 59, 59, 999);

      match.date = { $gte: startOfMonth, $lt: endOfMonth };
      groupId = { $dateToString: { format: "%Y-%m-%d", date: "$date" } };
      format = "%Y-%m-%d";
    }

    const pipeline: mongoose.PipelineStage[] = [
      { $match: match },
      {
        $group:
          byDisease === "true"
            ? { _id: "$assessment", count: { $sum: 1 } }
            : { _id: groupId, count: { $sum: 1 } },
      },
      { $sort: { _id: 1 as 1 } },
    ];

    const result = await Examination.aggregate(pipeline);

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Lỗi lấy thống kê" });
  }
};
