import { Shift } from "../models/shift.model";
import {
  SpecialSchedule,
  WeeklySchedule,
} from "../models/weeklySchedule.model";
import { Location } from "../models/location.model";
import { OvertimeSchedule } from "../models/overtimeSchedule.model";
import { Appointment } from "../models/appointment.model";
import moment from "moment";
import mongoose from "mongoose";
import { Doctor } from "../models/doctor.model";
import { sendEmail } from "../utils/email";

export const createShift = async (req: any, res: any) => {
  try {
    const { name, startTime, endTime, locationId } = req.body;

    if (!name || !startTime || !endTime) {
      return res
        .status(400)
        .json({ message: "Vui lòng điền đủ name, startTime, endTime" });
    }

    const existingShift = await Shift.findOne({
      startTime,
      endTime,
      locationId,
    });
    if (existingShift) {
      return res.status(409).json({ message: "Ca làm đã tồn tại" });
    }

    const newShift = await Shift.create({
      name,
      startTime,
      endTime,
      locationId,
    });

    return res.status(201).json({
      message: "Tạo ca làm việc thành công",
      data: newShift,
    });
  } catch (err) {
    console.error("Lỗi tạo ca:", err);
    return res.status(500).json({ message: "Lỗi máy chủ" });
  }
};

export const createSpecialSchedule = async (req: any, res: any) => {
  try {
    const data = req.body;
    const { doctorId, startDate, endDate } = data;

    if (!doctorId || !startDate || !endDate) {
      return res
        .status(400)
        .json({ message: "Thiếu thông tin để tạo lịch đặc biệt" });
    }

    const startDateTime = new Date(startDate);
    startDateTime.setHours(0, 0, 0, 0); // Đầu ngày

    const endDateTime = new Date(endDate);
    endDateTime.setHours(23, 59, 59, 999); // Cuối ngày
    const overlappingSchedules = await SpecialSchedule.findOne({
      doctorId: doctorId,
      $or: [
        {
          startDate: { $lt: endDateTime },
          endDate: { $gt: startDateTime },
        },
      ],
    });

    if (overlappingSchedules) {
      return res.status(409).json({
        message: "Lịch đặc biệt bị trùng với lịch đã tồn tại",
        conflictedSchedule: overlappingSchedules,
      });
    }

    // Tạo lịch đặc biệt mới
    const createdSchedule = await SpecialSchedule.create(data).then(
      (schedule) =>
        schedule.populate({
          path: "doctorId",
          select: "_id userId departmentId",
          populate: {
            path: "userId",
            select: "fullName",
          },
        })
    );
    if (!createdSchedule) {
      return res.status(500).json({ message: "Lỗi khi tạo lịch đặc biệt" });
    }

    // Huỷ các lịch hẹn bị ảnh hưởng trong khoảng thời gian
    const affectedAppointments = await Appointment.updateMany(
      {
        doctorId: new mongoose.Types.ObjectId(doctorId),
        appointmentDate: {
          $gte: startDateTime,
          $lte: endDateTime,
        },
        status: { $in: ["scheduled", "waiting_result", "examining"] },
      },
      {
        $set: {
          status: "cancelled",
          cancelReason: "Bác sĩ có lịch đột xuất",
        },
      }
    );

    return res.status(201).json({
      message:
        "Tạo lịch đặc biệt thành công và đã huỷ các cuộc hẹn bị ảnh hưởng",
      specialSchedule: createdSchedule,
      cancelledAppointments: affectedAppointments.modifiedCount,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Lỗi server khi tạo lịch đặc biệt và huỷ lịch hẹn",
    });
  }
};

export const deleteSpecialSchedule = async (req: any, res: any) => {
  try {
    const { specialScheduleId } = req.body;

    if (!specialScheduleId) {
      return res
        .status(400)
        .json({ message: "Thiếu ID của lịch đặc biệt cần xoá" });
    }

    const deletedSchedule = await SpecialSchedule.findByIdAndDelete(
      specialScheduleId
    );

    if (!deletedSchedule) {
      return res
        .status(404)
        .json({ message: "Không tìm thấy lịch đặc biệt để xoá" });
    }

    return res.status(200).json({
      message: "Xoá lịch đặc biệt thành công",
      deletedSchedule,
    });
  } catch (error) {
    console.error("Lỗi khi xoá lịch đặc biệt:", error);
    return res
      .status(500)
      .json({ message: "Lỗi server khi xoá lịch đặc biệt" });
  }
};

export const getSpecialScheduleById = async (req: any, res: any) => {
  try {
    const { doctorId } = req.params;
    if (!doctorId) {
      return res.status(400).json({ message: "Thiếu doctorId" });
    }
    const result = await SpecialSchedule.find({ doctorId });
    if (!result) {
      return res.status(404).json({});
    }
    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({ message: "Lỗi server" });
  }
};

export const getSpecialSchedules = async (req: any, res: any) => {
  try {
    const {
      departmentId,
      doctorId,
      search,
      year,
      month,
      week,
      startDate,
      endDate,
    } = req.query;

    const filter: any = {};

    // Nếu có departmentId nhưng không có doctorId
    if (departmentId && !doctorId) {
      // Lấy danh sách doctorIds trong khoa
      const doctorsInDepartment = await Doctor.find(
        { departmentId },
        { _id: 1 }
      );
      const doctorIds = doctorsInDepartment.map((doc) => doc._id);
      filter.doctorId = { $in: doctorIds };
    }

    // Nếu có doctorId cụ thể (ưu tiên hơn departmentId)
    if (doctorId) {
      filter.doctorId = doctorId;
    }

    // Lọc theo từ khóa tìm kiếm
    if (search) {
      filter.$or = [
        { note: { $regex: search, $options: "i" } },
        { type: { $regex: search, $options: "i" } },
      ];
    }

    // Lọc theo tháng
    if (year && month) {
      const start = new Date(`${year}-${month}-01`);
      const end = new Date(start);
      end.setMonth(start.getMonth() + 1);
      end.setMilliseconds(-1);
      filter.startDate = { $lte: end };
      filter.endDate = { $gte: start };
    }

    // Lọc theo tuần
    else if (year && week) {
      const weekNumber = parseInt(week as string, 10);
      const weekStart = getDateOfISOWeek(
        weekNumber,
        parseInt(year as string, 10)
      );
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);

      filter.startDate = { $lte: weekEnd };
      filter.endDate = { $gte: weekStart };
    }

    // Lọc theo khoảng ngày
    else if (startDate && endDate) {
      const start = new Date(startDate as string);
      start.setHours(0, 0, 0, 0);
      const end = new Date(endDate as string);
      end.setHours(23, 59, 59, 999);
      filter.startDate = { $lte: end };
      filter.endDate = { $gte: start };
    }

    const schedules = await SpecialSchedule.find(filter)
      .sort({ startDate: 1 })
      .populate({
        path: "doctorId",
        select: "userId _id departmentId",
        populate: {
          path: "userId",
          select: "fullName",
        },
      });

    return res.status(200).json(schedules);
  } catch (error) {
    console.error("Lỗi khi lấy danh sách lịch đặc biệt:", error);
    return res
      .status(500)
      .json({ message: "Lỗi server khi lấy lịch đặc biệt" });
  }
};

// Trả về ngày đầu tuần (Thứ Hai) của tuần ISO
function getDateOfISOWeek(week: number, year: number) {
  const simple = new Date(year, 0, 1 + (week - 1) * 7);
  const dow = simple.getDay();
  const ISOweekStart = simple;
  if (dow <= 4) ISOweekStart.setDate(simple.getDate() - simple.getDay() + 1);
  else ISOweekStart.setDate(simple.getDate() + 8 - simple.getDay());
  ISOweekStart.setHours(0, 0, 0, 0);
  return ISOweekStart;
}

// const isTimeOverlap = (
//   startA: string,
//   endA: string,
//   startB: string,
//   endB: string
// ): boolean => {
//   return !(endA <= startB || endB <= startA);
// };

function isTimeOverlap(
  startA: string,
  endA: string,
  startB: string,
  endB: string
): boolean {
  const toMinutes = (time: string) => {
    const [h, m] = time.split(":").map(Number);
    return h * 60 + m;
  };

  const aStart = toMinutes(startA);
  const aEnd = toMinutes(endA);
  const bStart = toMinutes(startB);
  const bEnd = toMinutes(endB);

  return aStart < bEnd && bStart < aEnd; // có overlap
}

export const createOrUpdateSchedule = async (req: any, res: any) => {
  try {
    const { doctorId, schedule } = req.body;
    console.log(schedule);

    // Validate input
    if (!doctorId || !Array.isArray(schedule) || schedule.length === 0) {
      return res
        .status(400)
        .json({ message: "Vui lòng cung cấp doctorId và schedule hợp lệ." });
    }

    // Check doctor tồn tại
    const doctorExists = await Doctor.findById(doctorId);
    if (!doctorExists) {
      return res.status(404).json({ message: "Không tìm thấy bác sĩ" });
    }

    // Lấy toàn bộ shift trong schedule mới
    const allNewShiftIds = schedule.flatMap((day: any) =>
      day.shiftIds.map((s: any) => (typeof s === "string" ? s : s._id))
    );
    const newShifts = await Shift.find({
      _id: { $in: allNewShiftIds },
    }).populate("locationId", "name");

    const shiftMap = new Map(
      newShifts.map((shift) => [shift._id.toString(), shift])
    );

    // Lấy lịch hiện tại của bác sĩ
    const existingSchedule = await WeeklySchedule.findOne({
      doctorId,
    }).populate({
      path: "schedule.shiftIds",
      populate: { path: "locationId", select: "name" },
    });

    // --- KIỂM TRA CONFLICT ---
    for (const newDay of schedule) {
      const shiftsInDay = newDay.shiftIds
        .map((id: any) => shiftMap.get(typeof id === "string" ? id : id._id))
        .filter(Boolean);

      // 1. Check conflict giữa các shift mới trong cùng ngày
      for (let i = 0; i < shiftsInDay.length; i++) {
        for (let j = i + 1; j < shiftsInDay.length; j++) {
          const s1 = shiftsInDay[i];
          const s2 = shiftsInDay[j];

          if (
            isTimeOverlap(s1.startTime, s1.endTime, s2.startTime, s2.endTime) &&
            s1.locationId.toString() !== s2.locationId.toString()
          ) {
            return res.status(409).json({
              message: `Ngày ${newDay.dayOfWeek} bị trùng giờ giữa ${s1.name} (${s1.startTime}-${s1.endTime}, ${s1.locationId.name}) và ${s2.name} (${s2.startTime}-${s2.endTime}, ${s2.locationId.name}) tại 2 địa điểm khác nhau.`,
              conflictShifts: [s1, s2],
            });
          }
        }
      }

      // 2. Check conflict với schedule cũ (nếu có)
      if (existingSchedule) {
        const existingDay = existingSchedule.schedule.find(
          (d: any) => d.dayOfWeek === newDay.dayOfWeek
        );
        if (existingDay) {
          for (const newShift of shiftsInDay) {
            for (const existShift of existingDay.shiftIds) {
              if (
                isTimeOverlap(
                  newShift.startTime,
                  newShift.endTime,
                  (existShift as any).startTime,
                  (existShift as any).endTime
                ) &&
                newShift.locationId.toString() !==
                  (existShift as any).locationId.toString()
              ) {
                const dayNames = [
                  "Chủ nhật",
                  "Thứ 2",
                  "Thứ 3",
                  "Thứ 4",
                  "Thứ 5",
                  "Thứ 6",
                  "Thứ 7",
                ];
                return res.status(409).json({
                  message: `${dayNames[newDay.dayOfWeek]} bị trùng giờ giữa ${
                    newShift.name
                  } (${newShift.startTime}-${newShift.endTime}, ${
                    newShift.locationId.name
                  }) và ${(existShift as any).name} (${
                    (existShift as any).startTime
                  }-${(existShift as any).endTime}, ${
                    (existShift as any).locationId.name
                  }) tại 2 địa điểm khác nhau.`,
                  conflictShifts: [newShift, existShift],
                });
              }
            }
          }
        }
      }
    }

    // --- SAVE ---
    let result;
    if (existingSchedule) {
      existingSchedule.set("schedule", schedule);
      result = await existingSchedule.save();
    } else {
      result = await WeeklySchedule.create({
        doctorId,
        schedule,
        isActive: true,
      });
    }

    const populated = await WeeklySchedule.findById(result._id).populate({
      path: "schedule.shiftIds",
      populate: { path: "locationId", select: "name" },
    });

    return res.status(existingSchedule ? 200 : 201).json(populated);
  } catch (error: any) {
    console.error("[createOrUpdateSchedule] Lỗi:", error);
    return res
      .status(500)
      .json({ message: "Lỗi máy chủ", error: error.message });
  }
};

export const getWeeklyScheduleByDoctor = async (req: any, res: any) => {
  try {
    const { doctorId } = req.params;
    if (!doctorId) {
      return res.status(400).json({ message: "Thiếu doctorId trên URL" });
    }
    const schedule = await WeeklySchedule.findOne({ doctorId }).populate({
      path: "schedule.shiftIds",
      select: "name startTime endTime locationId", // Lấy thông tin ca nếu cần
      populate: {
        path: "locationId",
        select: "name _id",
      },
    });

    if (!schedule) {
      return res
        .status(404)
        .json({ message: "Không tìm thấy lịch làm việc của bác sĩ" });
    }
    return res.status(200).json(schedule);
  } catch (error) {
    console.error("[getWeeklyScheduleByDoctor] Lỗi:", error);
    return res.status(500).json({ message: "Lỗi máy chủ", error: error });
  }
};

export const getAllSpecialSchedule = async (req: any, res: any) => {
  try {
    const { doctorId } = req.params;
    const result = await SpecialSchedule.find({ doctorId });
    if (!result) {
      return res.status(400).json({});
    }
    return res.status(200).json(result);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Lỗi phía server" });
  }
};

export const getAllWeeklyScheduleByDoctors = async (req: any, res: any) => {
  try {
    const { doctorIds } = req.body;
    if (!Array.isArray(doctorIds) || doctorIds.length === 0) {
      return res
        .status(400)
        .json({ message: "doctorIds phải là một mảng và không được rỗng" });
    }
    const schedules = await WeeklySchedule.find({
      doctorId: { $in: doctorIds },
    }).populate({
      path: "schedule.shiftIds",
      select: "name startTime endTime locationId",
    });
    return res.status(200).json(schedules);
  } catch (error) {
    console.error(error);
    return res.status(500);
  }
};

export const deleteWeeklyScheduleById = async (req: any, res: any) => {
  try {
    const { doctorId } = req.params;
    if (!doctorId) {
      return res.status(400).json({ message: "Thiếu doctorId." });
    }

    const result = await WeeklySchedule.deleteMany({ doctorId });

    if (result.deletedCount === 0) {
      return res
        .status(404)
        .json({ message: "Không tìm thấy lịch làm việc nào để xóa." });
    }

    return res.status(200).json({ message: "Xoá thành công" });
  } catch (error) {
    console.error(error);
  }
};

export const getShiftByLocation = async (req: any, res: any) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ message: "Phải nhập id" });
    }
    const result = await Shift.find({ locationId: id });

    if (!result || result.length === 0) {
      return res.status(404).json({ message: "Không tìm thấy ca làm nào" });
    }
    return res.status(200).json(result);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Lỗi server" });
  }
};

const isTimeOverlaps = (
  start1: string,
  end1: string,
  start2: string,
  end2: string
) => {
  const toMinutes = (t: string) => {
    const [h, m] = t.split(":").map(Number);
    return h * 60 + m;
  };

  const s1 = toMinutes(start1);
  const e1 = toMinutes(end1);
  const s2 = toMinutes(start2);
  const e2 = toMinutes(end2);

  return !(e1 <= s2 || s1 >= e2); // có giao nhau
};

export const addOvertimeDay = async (req: any, res: any) => {
  try {
    const {
      doctorId,
      dayOfWeek,
      slots,
      isActive = true,
      locationId,
    } = req.body;

    if (
      !doctorId ||
      dayOfWeek === undefined ||
      !Array.isArray(slots) ||
      !locationId
    ) {
      return res.status(400).json({ message: "Thiếu dữ liệu." });
    }

    const weekly = await WeeklySchedule.findOne({ doctorId });
    if (!weekly)
      return res.status(400).json({ message: "Bác sĩ chưa có lịch cố định." });

    const daySchedule = weekly.schedule.find((s) => s.dayOfWeek === dayOfWeek);
    const shiftIds = daySchedule?.shiftIds || [];
    const shifts = await Shift.find({ _id: { $in: shiftIds } });

    for (const slot of slots) {
      for (const shift of shifts) {
        if (
          isTimeOverlaps(
            slot.startTime,
            slot.endTime,
            shift.startTime,
            shift.endTime
          )
        ) {
          return res.status(400).json({
            message: `Ca ngoài giờ (${slot.startTime}-${slot.endTime}) trùng với ca cố định (${shift.startTime}-${shift.endTime})`,
          });
        }
      }
    }

    let overtime = await OvertimeSchedule.findOne({ doctorId });

    if (!overtime) {
      overtime = new OvertimeSchedule({
        doctorId,
        weeklySchedule: [{ dayOfWeek, isActive, slots, locationId }],
      });
    } else {
      const exists = overtime.weeklySchedule.find(
        (d) => d.dayOfWeek === dayOfWeek
      );
      if (exists) {
        return res
          .status(400)
          .json({ message: "Ngày này đã tồn tại trong lịch ngoài giờ." });
      }

      overtime.weeklySchedule.push({ dayOfWeek, isActive, slots, locationId });
    }

    await overtime.save();
    return res
      .status(200)
      .json({ message: "Thêm lịch ngoài giờ thành công.", data: overtime });
  } catch (err) {
    console.error("addOvertimeDay error:", err);
    return res.status(500).json({ message: "Lỗi server." });
  }
};

export const getOvertime = async (req: any, res: any) => {
  try {
    const { doctorId } = req.params;

    if (!doctorId) {
      return res.status(400).json({ message: "Thiếu doctorId" });
    }

    const overtime = await OvertimeSchedule.findOne({ doctorId })
      .populate("weeklySchedule.locationId", "name") // nếu cần lấy tên địa điểm
      .lean();

    if (!overtime) {
      return res
        .status(404)
        .json({ message: "Không tìm thấy lịch ngoài giờ cho bác sĩ này." });
    }

    return res.status(200).json(overtime);
  } catch (err) {
    console.error("getOvertime error:", err);
    return res.status(500).json({ message: "Lỗi server." });
  }
};

export const updateOvertimeDay = async (req: any, res: any) => {
  try {
    const { scheduleId } = req.params;
    const { dayOfWeek, slots, isActive, locationId, pausePeriods } = req.body;
    if (!scheduleId || dayOfWeek === undefined || !Array.isArray(slots)) {
      console.error("Thiếu dữ liệu:", { scheduleId, dayOfWeek, slots });
      return res.status(400).json({ message: "Thiếu dữ liệu." });
    }

    const overtime = await OvertimeSchedule.findById(scheduleId);
    if (!overtime) {
      console.error("Không tìm thấy lịch ngoài giờ:", scheduleId);
      return res
        .status(404)
        .json({ message: "Không tìm thấy lịch ngoài giờ." });
    }

    const doctorId = overtime.doctorId;
    const weekly = await WeeklySchedule.findOne({ doctorId });
    const shiftIds =
      weekly?.schedule.find((d) => d.dayOfWeek === dayOfWeek)?.shiftIds || [];
    const shifts = await Shift.find({ _id: { $in: shiftIds } });

    // Kiểm tra trùng với ca cố định
    for (const slot of slots) {
      for (const shift of shifts) {
        const shiftDay = weekly?.schedule.find(
          (d) => d.dayOfWeek === dayOfWeek
        );
        if (!shiftDay) continue;
        if (
          isTimeOverlaps(
            slot.startTime,
            slot.endTime,
            shift.startTime,
            shift.endTime
          )
        ) {
          return res.status(400).json({
            message: `Ca ngoài giờ (${slot.startTime}-${slot.endTime}) trùng với ca cố định (${shift.startTime}-${shift.endTime})`,
          });
        }
      }
    }

    // Tìm ngày cần cập nhật trong overtime.weeklySchedule
    const day = overtime.weeklySchedule.find((d) => d.dayOfWeek === dayOfWeek);
    if (!day) {
      return res
        .status(404)
        .json({ message: "Ngày này chưa tồn tại trong lịch ngoài giờ." });
    }

    day.set("slots", slots);
    if (isActive !== undefined) day.isActive = isActive;
    if (locationId) day.locationId = locationId;

    // ✅ Cập nhật pausePeriods nếu có
    if (Array.isArray(pausePeriods)) {
      const validPeriods = pausePeriods.filter(
        (p) =>
          p.startDate &&
          p.endDate &&
          new Date(p.startDate) < new Date(p.endDate)
      );
      day.set("pausePeriods", validPeriods);
      for (const period of validPeriods) {
        const start = new Date(period.startDate);
        const end = new Date(period.endDate);

        // Truy vấn các lịch hẹn cần hủy
        const appointmentsToCancel = await Appointment.find({
          doctorId: doctorId,
          isOvertime: true,
          status: "scheduled",
          appointmentDate: {
            $gte: start,
            $lte: end,
          },
        }).populate("patientId", "email fullName");

        // Lọc các appointment có đúng thứ trùng với dayOfWeek (0-6)
        const filteredAppointments = appointmentsToCancel.filter((appt) => {
          const day = new Date(appt.appointmentDate).getDay();
          console.log(
            "Checking appointment day:",
            day,
            "against dayOfWeek:",
            dayOfWeek
          );
          return day === dayOfWeek;
        });

        const appointmentIds = filteredAppointments.map((a) => a._id);

        if (appointmentIds.length > 0) {
          await Appointment.updateMany(
            { _id: { $in: appointmentIds } },
            {
              $set: {
                status: "cancelled",
                cancelReason: "Bác sĩ tạm ngưng khám",
              },
            }
          );
        }
        for (const appointment of filteredAppointments) {
          const patient = appointment.patientId;
          if ((patient as any).email) {
            await sendEmail({
              to: (patient as any).email,
              subject: "Thông báo hủy lịch hẹn",
              html: `
                    <p>Chào ${(patient as any).fullName},</p>
                    <p>Lịch hẹn của bạn vào ngày <strong>${moment(
                      appointment.appointmentDate
                    ).format(
                      "DD/MM/YYYY"
                    )}</strong> đã bị hủy do lý do: <em>Bác sĩ đã ngừng lịch vào ngày này</em>.</p>
                    <p>Chúng tôi xin lỗi vì sự bất tiện này.</p>
                  `,
            });
          }
        }
      }
    }
    await overtime.save();
    return res
      .status(200)
      .json({ message: "Cập nhật thành công.", data: overtime });
  } catch (err) {
    console.error("updateOvertimeDay error:", err);
    return res.status(500).json({ message: "Lỗi server." });
  }
};

export const deleteOvertimeDay = async (req: any, res: any) => {
  try {
    const { doctorId, dayOfWeek } = req.body;

    if (!doctorId || dayOfWeek === undefined) {
      return res.status(400).json({ message: "Thiếu dữ liệu." });
    }

    const overtime = await OvertimeSchedule.findOne({ doctorId });
    if (!overtime) {
      return res
        .status(404)
        .json({ message: "Không tìm thấy lịch ngoài giờ." });
    }

    const indexToRemove = overtime.weeklySchedule.findIndex(
      (d) => d.dayOfWeek === dayOfWeek
    );

    if (indexToRemove === -1) {
      return res
        .status(404)
        .json({ message: "Không có lịch ngoài giờ cho ngày này." });
    }

    const deletedSlots = overtime.weeklySchedule[indexToRemove].slots.map(
      (slot) => `${slot.startTime}-${slot.endTime}`
    );

    // Xoá ngày khỏi weeklySchedule (dùng splice để giữ DocumentArray)
    overtime.weeklySchedule.splice(indexToRemove, 1);
    await overtime.save();

    // Tìm tất cả lịch hẹn có session trùng và ngày đúng thứ
    const allAppointments = await Appointment.find({
      doctorId,
      session: { $in: deletedSlots },
      status: "scheduled",
    });

    // Lọc theo appointmentDate có dayOfWeek trùng
    const appointmentsToCancel = allAppointments.filter(
      (a) => moment(a.appointmentDate).day() === dayOfWeek
    );

    // Cập nhật các lịch này sang cancelled
    if (appointmentsToCancel.length > 0) {
      await Appointment.updateMany(
        { _id: { $in: appointmentsToCancel.map((a) => a._id) } },
        {
          $set: {
            status: "cancelled",
            cancelReason: "Bác sĩ ngừng khám ngoài giờ vào ngày này",
          },
        }
      );
    }

    return res.status(200).json({
      message: "Xoá thành công.",
      cancelledCount: appointmentsToCancel.length,
      data: overtime,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Lỗi server." });
  }
};
