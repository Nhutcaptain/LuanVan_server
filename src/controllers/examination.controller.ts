import { Message } from "twilio/lib/twiml/MessagingResponse";
import { Examination } from "../models/examination.model";
import mongoose from "mongoose";
import { handleTestOrderUpdate, notifyExaminationUpdate } from "../socket";

export const getSummaryExamination = async (req: any, res: any) => {
  try {
    const { patientId } = req.params;
    console.log(patientId);
    const examinations = await Examination.find({ patientId })
      .select("doctorId date assessment")
      .populate({
        path: "doctorId",
        populate: {
          path: 'userId',
          select: 'fullName',
        }
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
    const detail = await Examination.findById(id).populate({
      path: "doctorId",
      select: 'overtimeExaminationPrice officeExaminationPrice',
      populate: {
        path: 'userId',
        select: 'fullName'
      }
    })
    .populate({
        path: "testOrders.serviceId", 
        select: "name price", 
      });

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
    handleTestOrderUpdate(record.doctorId.toString(), record.patientId.toString(), record.testOrders);
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
    const result = await Examination.findByIdAndUpdate(id, 
      { $set: data },
      { new: true, runValidators: true }
    );

    if (!result)
      return res.status(404).json({ Message: "Không tìm thấy kết quả này" });
    handleTestOrderUpdate(result.doctorId.toString(), result.patientId.toString(), data.testOrders);
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
    console.log(examination);

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

    // // Cập nhật trạng thái chung của examination nếu cần
    // const allCompleted = examination.testOrders.every(o => o.status === 'completed');
    // examination.status = allCompleted ? 'completed' : 'waiting_result';

    await examination.save();
    notifyExaminationUpdate(examination._id.toString(), {
      testOrders: examination.testOrders
    });
    handleTestOrderUpdate(examination.doctorId.toString(), examination.patientId.toString(), examination.testOrders);

    return res.json({
      message: "Cập nhật kết quả xét nghiệm thành công",
      examinationId: examination._id,
    });
  } catch (err) {
    console.error("Submit test result error:", err);
    res.status(500).json({ message: "Lỗi server" });
  }
};

export const getTestOrderByAppointment = async(req: any, res: any) => {
  try{
    const {id} = req.params;
    if(!id) return res.status(400).json({message: 'Thiếu thông tin'});
    const data = await Examination.findById(id);
    if(!data) return res.status(404).json({message: 'Không tìm thấy'});
    return res.status(200).json({
      testOrders: data.testOrders
    })
  }catch(error) {
    console.error(error);
    return res.status(500).json({message: 'Lỗi server'});
  }
}
