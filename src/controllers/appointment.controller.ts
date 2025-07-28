import dayjs from "dayjs";
import { Appointment } from "../models/appointment.model";
import { OvertimeSchedule } from "../models/overtimeSchedule.model";
import { Shift } from "../models/shift.model";
import {
  SpecialSchedule,
  WeeklySchedule,
} from "../models/weeklySchedule.model";
import { emitCancelAppointment, emitCompleteStatus, emitCompleteStatusForPatient, emitNewAppointment, handleTestOrderUpdate } from "../socket";
import { Examination } from "../models/examination.model";
import { sendEmail } from "../utils/email";
import moment from "moment";

export const createAppointment = async (req: any, res: any) => {
  try {
    const {
      patientId,
      doctorId,
      appointmentDate,
      session,
      departmentId,
      reason,
      isOvertime,
    } = req.body;

    if (!patientId || !doctorId || !appointmentDate || !session) {
      return res
        .status(400)
        .json({ message: "Vui lòng nhập đầy đủ thông tin bắt buộc." });
    }

    console.log(appointmentDate);

    // Kiểm tra bệnh nhân đã đặt lịch trong cùng ngày & session chưa
    const existingAppointment = await Appointment.findOne({
      patientId,
      appointmentDate,
      status: "scheduled",
    });

    if (existingAppointment) {
      return res.status(409).json({
        message:
          "Bạn đã có lịch khám với bác sĩ này trong ngày này. Vui lòng chọn buổi khác hoặc huỷ lịch cũ.",
      });
    }

    // Kiểm tra số lượng bệnh nhân đã đặt lịch với bác sĩ
    const count = await Appointment.countDocuments({
      doctorId,
      appointmentDate,
      session,
      status: "scheduled",
    });

    if (count >= 10) {
      return res.status(409).json({
        message:
          "Đã đủ số lượng bệnh nhân cho bác sĩ này vào buổi khám đó. Vui lòng chọn thời gian khác.",
      });
    }

    const queueNumber = count + 1;

    const newAppointment = new Appointment({
      patientId,
      doctorId,
      appointmentDate,
      session,
      departmentId,
      reason,
      queueNumber,
      notificationSent: {
        email: false,
        sms: false,
      },
      isOvertime,
    });

    await newAppointment.save();
    const populatedAppointment = await Appointment.findById(newAppointment._id)
      .populate("patientId", "_id fullName") 
      .lean(); 

    if (!populatedAppointment) {
      return res.status(500).json({ message: "Không thể lấy thông tin lịch hẹn vừa tạo." });
    }
    const patientListItem = {
      _id: populatedAppointment._id.toString(),
      appointmentDate: populatedAppointment.appointmentDate,
      queueNumber: populatedAppointment.queueNumber,
      doctorId: populatedAppointment.doctorId,
      status: populatedAppointment.status,
      patientId: {
        _id: populatedAppointment.patientId._id.toString(),
        fullName: (populatedAppointment.patientId as any).fullName,
      },
      isOvertime: populatedAppointment.isOvertime
    };
    emitNewAppointment(patientListItem);
    res.status(201).json(newAppointment);
  } catch (error) {
    console.error("Lỗi khi tạo lịch hẹn:", error);
    res.status(500).json({ message: "Đã xảy ra lỗi khi tạo lịch hẹn." });
  }
};

export const getAppointmentByPatientId = async (req: any, res: any) => {
  try {
    const { patientId } = req.params;
    if (!patientId) {
      return res.status(400).json({ message: "Thiếu thông tin của bệnh nhân" });
    }
    const appointments = await Appointment.find({ patientId })
      .populate({
        path: "doctorId",
        select: "userId",
        populate: {
          path: "userId",
          select: "fullName email phone",
        },
      })
      .populate("departmentId", "name")
    if (!appointments || appointments.length === 0) {
      return res.status(404).json({ message: "Không tìm thấy lịch hẹn nào" });
    }

    return res.status(200).json(appointments);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Xảy ra lỗi ở server" });
  }
};

export const cancelAppointment = async (req: any, res: any) => {
  try {
    const { appointmentId } = req.params;

    const appointment = await Appointment.findById(appointmentId);

    if (!appointment) {
      return res.status(404).json({ message: "Không tìm thấy lịch hẹn." });
    }

    if (appointment.status === "cancelled") {
      return res.status(400).json({ message: "Lịch hẹn đã bị huỷ trước đó." });
    }

    // Cập nhật trạng thái của lịch hẹn hiện tại
    appointment.status = "cancelled";
    await appointment.save();

    // Cập nhật lại thứ tự của các lịch hẹn sau đó
    const result = await Appointment.updateMany(
      {
        doctorId: appointment.doctorId,
        appointmentDate: appointment.appointmentDate,
        session: appointment.session,
        status: "scheduled",
        queueNumber: { $gt: appointment.queueNumber },
      },
      { $inc: { queueNumber: -1 } } // đẩy số thứ tự lên
    );

    emitCancelAppointment(appointment);

    res.status(200).json({ message: "Huỷ lịch thành công." });
  } catch (error) {
    console.error("Lỗi khi huỷ lịch hẹn:", error);
    res.status(500).json({ message: "Đã xảy ra lỗi khi huỷ lịch hẹn." });
  }
};

export const getAppointmentByDoctor = async (req: any, res: any) => {
  try {
    const { doctorId } = req.params;
    const { date, type } = req.query;
    const query: any = { doctorId };
    if (!doctorId) {
      return res.status(400).json({ message: "Thiếu thông tin bác sĩ" });
    }
    if (date) {
      query.appointmentDate = date; // Lưu ý: cần đảm bảo date là chuỗi "YYYY-MM-DD"
    }

    if (type === 'overtime') {
      query.isOvertime = true;
    } else if (type === 'normal') {
      query.isOvertime = false;
    }
    const appointments = await Appointment.find(query).populate("patientId", "fullName");
    if (!appointments) {
      return res
        .status(404)
        .json({ message: "Không tìm thấy lịch đặt khám nào" });
    }
    return res.status(200).json(appointments);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Lỗi ở server" });
  }
};

export const completeAppointment = async (req: any, res: any) => {
  try {
    const { appointmentId } = req.params;

    if (!appointmentId) {
      return res.status(400).json({ message: "Thiếu thông tin lịch hẹn" });
    }

    const appointment = await Appointment.findById(appointmentId);

    if (!appointment) {
      return res.status(404).json({ message: "Lịch hẹn không tồn tại" });
    }

    if (appointment.status === "completed") {
      return res.status(400).json({ message: "Lịch hẹn đã hoàn tất trước đó" });
    }

    if (appointment.status === "cancelled") {
      return res
        .status(400)
        .json({ message: "Không thể hoàn tất lịch hẹn đã bị hủy" });
    }

    appointment.status = "completed";
    appointment.updatedAt = new Date();
    await appointment.save();

    return res.status(200).json({
      message: "Hoàn tất lịch hẹn thành công",
      appointment,
    });
  } catch (error) {
    console.error("completeAppointment error:", error);
    return res.status(500).json({ message: "Lỗi ở server" });
  }
};

const timeToMinutes = (time: string) => {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
};
export const getTodayAppointments = async (req: any, res: any) => {
  try {
    const { doctorId } = req.params;
    const now = new Date();
    const dayOfWeek = now.getDay();
    const currentTime = now.toTimeString().slice(0, 5); // HH:mm
    const currentMinutes = timeToMinutes(currentTime);

    const startOfDay = new Date(now.setHours(0, 0, 0, 0));
    const endOfDay = new Date(now.setHours(23, 59, 59, 999));

    // 1. Check Special Schedule
    const special = await SpecialSchedule.findOne({
      doctorId,
      date: { $gte: startOfDay, $lte: endOfDay },
    });
    if (special) {
      return res.status(200).json({
        message: `Bác sĩ có lịch đặc biệt hôm nay: ${special.type}`,
        session: null,
        appointments: [],
      });
    }

    // 2. Weekly Schedule
    const weekly = await WeeklySchedule.findOne({
      doctorId,
      isActive: true,
    }).lean();
    let shiftNow: any = null;
    let sessionString = "";
    let isOvertime = false;

    if (weekly) {
      const scheduleToday = weekly.schedule.find(
        (s) => s.dayOfWeek === dayOfWeek
      );
      if (scheduleToday && scheduleToday.shiftIds.length > 0) {
        const shifts = await Shift.find({
          _id: { $in: scheduleToday.shiftIds },
        }).lean();
        const sortedShifts = shifts.sort(
          (a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime)
        );

        let previousShift = null;

        for (let i = 0; i < sortedShifts.length; i++) {
          const shift = sortedShifts[i];
          const start = timeToMinutes(shift.startTime);
          const nextShift = sortedShifts[i + 1];
          const nextStart = nextShift
            ? timeToMinutes(nextShift.startTime)
            : Infinity;

          if (currentMinutes >= start && currentMinutes < nextStart) {
            shiftNow = shift;
            sessionString = `${shift.startTime}-${shift.endTime}`;

            if (i > 0) previousShift = sortedShifts[i - 1];
            break;
          }
        }

        // 🚨 Nếu có ca trước và chưa khám xong thì chuyển bệnh nhân sang ca hiện tại
        if (previousShift && shiftNow) {
          const prevSession = `${previousShift.startTime}-${previousShift.endTime}`;
          const unserved = await Appointment.find({
            doctorId,
            appointmentDate: { $gte: startOfDay, $lte: endOfDay },
            session: prevSession,
            status: { $ne: "done" },
            migratedFromSession: { $ne: prevSession }, // tránh chuyển nhiều lần
          }).lean();

          for (const appt of unserved) {
            await Appointment.findByIdAndUpdate(appt._id, {
              session: sessionString,
              note: "Tự động chuyển từ ca trước do chưa khám",
              migratedFromSession: prevSession,
            });
          }
        }
      }
    }

    // 3. Overtime nếu không có shift cố định
    if (!shiftNow) {
      const overtime = await OvertimeSchedule.findOne({ doctorId }).lean();
      if (overtime) {
        const overtimeToday = overtime.weeklySchedule.find(
          (w) => w.dayOfWeek === dayOfWeek && w.isActive
        );
        if (overtimeToday) {
          const slot = overtimeToday.slots.find(
            (slot) => slot.startTime <= currentTime
          );
          if (slot) {
            isOvertime = true;
            shiftNow = {
              name: "Ca tăng ca",
              startTime: slot.startTime,
              endTime: slot.endTime,
              locationId: overtimeToday.locationId,
            };
            sessionString = `${slot.startTime}-${slot.endTime}`;
          }
        }
      }
    }

    if (!shiftNow) {
      return res.status(200).json({
        message: "Hiện tại bác sĩ không có ca khám nào (bao gồm cả tăng ca).",
        session: null,
        appointments: [],
      });
    }

    // 4. Lấy danh sách bệnh nhân đúng với ca hiện tại
    const appointments = await Appointment.find({
      doctorId,
      appointmentDate: { $gte: startOfDay, $lte: endOfDay },
      session: sessionString,
      status: { $ne: "cancelled" },
    })
      .populate({
        path: "patientId",
        select: "fullName _id",
      })
      .sort({ queueNumber: 1 })
      .lean();

    return res.status(200).json({
      session: sessionString,
      isOvertime,
      shift: shiftNow,
      appointments: appointments,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Lỗi server", error });
  }
};

// export const getTodayAppointments = async (req: any, res: any) => {
//   try {
//     const { doctorId } = req.params;
//     const now = new Date();
//     const dayOfWeek = now.getDay();
//     const currentTime = now.toTimeString().slice(0, 5); // HH:mm

//     const startOfDay = new Date(now.setHours(0, 0, 0, 0));
//     const endOfDay = new Date(now.setHours(23, 59, 59, 999));

//     // 1. Check Special Schedule
//     const special = await SpecialSchedule.findOne({ doctorId, date: { $gte: startOfDay, $lte: endOfDay } });
//     if (special) {
//       return res.status(200).json({
//         message: `Bác sĩ có lịch đặc biệt hôm nay: ${special.type}`,
//         session: null,
//         appointments: []
//       });
//     }

//     // 2. Weekly Schedule
//     const weekly = await WeeklySchedule.findOne({ doctorId, isActive: true }).lean();
//     let shiftNow: any = null;
//     let sessionString = '';
//     let isOvertime = false;

//     if (weekly) {
//       const scheduleToday = weekly.schedule.find(s => s.dayOfWeek === dayOfWeek);
//       if (scheduleToday && scheduleToday.shiftIds.length > 0) {
//         const shifts = await Shift.find({ _id: { $in: scheduleToday.shiftIds } }).lean();
//         const currentMinutes = timeToMinutes(currentTime);

//         // Sắp xếp theo giờ bắt đầu
//         const sortedShifts = shifts.sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));

//         for (let i = 0; i < sortedShifts.length; i++) {
//           const shift = sortedShifts[i];
//           const start = timeToMinutes(shift.startTime);

//           // Tìm giờ bắt đầu của ca kế tiếp (nếu có)
//           const nextShift = sortedShifts[i + 1];
//           const nextStart = nextShift ? timeToMinutes(nextShift.startTime) : Infinity;

//           // Nếu giờ hiện tại >= giờ bắt đầu và chưa sang ca kế tiếp
//           if (currentMinutes >= start && currentMinutes < nextStart) {
//             shiftNow = shift;
//             sessionString = `${shift.startTime}-${shift.endTime}`;
//             break;
//           }
//         }
//       }
//     }

//     // 3. Overtime nếu không có shift cố định
//     if (!shiftNow) {
//       const overtime = await OvertimeSchedule.findOne({ doctorId }).lean();
//       if (overtime) {
//         const overtimeToday = overtime.weeklySchedule.find(w => w.dayOfWeek === dayOfWeek && w.isActive);
//         if (overtimeToday) {
//           const slot = overtimeToday.slots.find(slot => slot.startTime <= currentTime);
//           if (slot) {
//             isOvertime = true;
//             shiftNow = {
//               name: 'Ca tăng ca',
//               startTime: slot.startTime,
//               endTime: slot.endTime,
//               locationId: overtimeToday.locationId
//             };
//             sessionString = `${slot.startTime}-${slot.endTime}`;
//           }
//         }
//       }
//     }

//     if (!shiftNow) {
//       return res.status(200).json({
//         message: "Hiện tại bác sĩ không có ca khám nào (bao gồm cả tăng ca).",
//         session: null,
//         appointments: []
//       });
//     }

//     // Lấy danh sách bệnh nhân đúng với ca (kể cả kéo dài vượt endTime)
//     const appointments = await Appointment.find({
//       doctorId,
//       appointmentDate: { $gte: startOfDay, $lte: endOfDay },
//       session: sessionString,
//     })
//       .populate({
//         path: 'patientId',
//         select: 'fullName _id'
//       })
//       .sort({ queueNumber: 1 })
//       .lean();

//     return res.status(200).json({
//       session: sessionString,
//       isOvertime,
//       shift: shiftNow,
//       appointments: appointments
//     });

//   } catch (error) {
//     console.error(error);
//     return res.status(500).json({ message: 'Lỗi server', error });
//   }
// };

export const updateStatusAppointment = async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const { status, examinationId } = req.body;
    const result = await Appointment.findByIdAndUpdate(id, {
      status,
      examinationId,
    }).populate("patientId", "fullName _id");
    if(!result) return res.status(404).json({message: 'Không tìm thấy lịch hẹn này'});
    if(status === 'completed'){
      emitCompleteStatus(result?.doctorId.toString(), result._id.toString());
      emitCompleteStatusForPatient(result.patientId.toString(), result._id.toString());
    }
    return res.status(200).json(result);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Lỗi ở server" });
  }
};

export const getTestOrder = async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const result = await Examination.findById(id);
    if (!result) return res.status(404).json({});
    return res.status(200).json(result.testOrders);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Lỗi server" });
  }
};

export const stopAppointments = async (req: any, res: any) => {
  try {
    const { doctorId } = req.params; 
    const { date, type, reason } = req.body;

    if (!doctorId || !date || !reason) {
      return res.status(400).json({ message: "Thiếu thông tin cần thiết" });
    }

    const query: any = {
      doctorId,
      // appointmentDate: {
      //   $eq: moment(date).startOf('day').toDate(), // đảm bảo chỉ lấy ngày, bỏ giờ
      // },
      appointmentDate: date,
      status: 'scheduled', // chỉ dừng các lịch chưa thực hiện
    };

    console.log(query);

    if (type === 'overtime') {
      query.isOvertime = true;
    } else if (type === 'normal') {
      query.isOvertime = false;
    }

    // Lấy danh sách lịch cần hủy
    const appointments = await Appointment.find(query).populate('patientId', 'email fullName');
    console.log(appointments);

    if (!appointments.length) {
      return res.status(404).json({ message: "Không có lịch hẹn để hủy" });
    }

    // Gửi email cho từng bệnh nhân
    for (const appointment of appointments) {
      const patient = appointment.patientId;
      if ((patient as any).email) {
        await sendEmail({
          to: (patient as any).email,
          subject: "Thông báo hủy lịch hẹn",
          html: `
            <p>Chào ${(patient as any).fullName},</p>
            <p>Lịch hẹn của bạn vào ngày <strong>${moment(appointment.appointmentDate).format("DD/MM/YYYY")}</strong> đã bị hủy do lý do: <em>${reason}</em>.</p>
            <p>Chúng tôi xin lỗi vì sự bất tiện này.</p>
          `
        });
      }
    }

    // Cập nhật status và reason
    await Appointment.updateMany(query, {
      $set: {
        status: 'cancelled',
        reason: reason,
      }
    });

    return res.status(200).json({ message: "Đã dừng tất cả lịch hẹn thành công" });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Lỗi ở server khi dừng lịch hẹn" });
  }
};