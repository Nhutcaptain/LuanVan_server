import { Shift } from "../models/shift.model";
import {
  SpecialSchedule,
  WeeklySchedule,
} from "../models/weeklySchedule.model";
import { Location } from "../models/location.model";
import { OvertimeSchedule } from "../models/overtimeSchedule.model";

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
    const createData = await SpecialSchedule.create(data);
    if (!createData) {
      return res.status(404).json({ message: "Lỗi khi tạo lịch" });
    }
    return res.status(201).json(createData);
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "Lỗi server khi tạo lịch đặc biệt" });
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

const isTimeOverlap = (
  startA: string,
  endA: string,
  startB: string,
  endB: string
): boolean => {
  return !(endA <= startB || endB <= startA);
};

export const createOrUpdateSchedule = async (req: any, res: any) => {
  try {
    const { doctorId, schedule } = req.body;
    if (!doctorId || !Array.isArray(schedule) || schedule.length === 0) {
      return res
        .status(400)
        .json({ message: "Vui lòng cung cấp doctorId và schedule hợp lệ." });
    }

    const allNewShiftIds = schedule.flatMap((day: any) => day.shiftIds);
    const newShifts = await Shift.find({ _id: { $in: allNewShiftIds } });

    const existing = await WeeklySchedule.findOne({ doctorId }).populate({
      path: "schedule.shiftIds",
      select: "name startTime endTime locationId",
    });

    if (existing) {
      for (const newDay of schedule) {
        const existingDay = (existing.schedule as any[]).find(
          (day: any) => day.dayOfWeek === newDay.dayOfWeek
        );

        if (!existingDay) continue;

        const newShiftsForDay = newShifts.filter((shift) =>
          newDay.shiftIds.includes(shift._id.toString())
        );
        const existingShiftsForDay = existingDay.shiftIds;

        for (const newShift of newShiftsForDay) {
          for (const existShift of existingShiftsForDay) {
            if (
              isTimeOverlap(
                newShift.startTime,
                newShift.endTime,
                existShift.startTime,
                existShift.endTime
              ) &&
              newShift.locationId.toString() !==
                existShift.locationId.toString()
            ) {
              return res.status(409).json({
                message: `Lịch bị trùng giờ (${newShift.startTime} - ${newShift.endTime}) với ca khác tại địa điểm khác trong cùng ngày.`,
                conflictShift: {
                  newShift,
                  existShift,
                },
              });
            }
          }
        }
      }
      (existing as any).schedule = schedule;
      await existing.save();
      const populated = await existing.populate({
        path: "schedule.shiftIds",
        select: "name startTime endTime",
      });
      return res.status(200).json(populated);
    } else {
      // Nếu chưa có lịch nào, tạo mới
      const newSchedule = await WeeklySchedule.create({
        doctorId,
        schedule,
        isActive: true,
      });

      const populated = await newSchedule.populate({
        path: "schedule.shiftIds",
        select: "name startTime endTime",
      });
      return res.status(201).json(populated);
    }
  } catch (error) {
    console.error("[createOrUpdateWeeklySchedule] Lỗi:", error);
    return res.status(500).json({ message: "Lỗi máy chủ", error: error });
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
    console.log(doctorId);

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
    const { scheduleId, dayOfWeek, slots, isActive, locationId } = req.body;

    if (!scheduleId || dayOfWeek === undefined || !Array.isArray(slots)) {
      return res.status(400).json({ message: "Thiếu dữ liệu." });
    }

    const overtime = await OvertimeSchedule.findById(scheduleId);
    if (!overtime) {
      return res.status(404).json({ message: "Không tìm thấy lịch ngoài giờ." });
    }

    const doctorId = overtime.doctorId;
    const weekly = await WeeklySchedule.findOne({ doctorId });
    const shiftIds =
      weekly?.schedule.find((d) => d.dayOfWeek === dayOfWeek)?.shiftIds || [];
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

    const day = overtime.weeklySchedule.find((d) => d.dayOfWeek === dayOfWeek);
    if (!day) {
      return res.status(404).json({ message: "Ngày này chưa tồn tại trong lịch ngoài giờ." });
    }

    day.set("slots", slots);
    if (isActive !== undefined) day.isActive = isActive;
    if (locationId) day.locationId = locationId;

    await overtime.save();
    return res.status(200).json({ message: "Cập nhật thành công.", data: overtime });
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
    if (!overtime)
      return res
        .status(404)
        .json({ message: "Không tìm thấy lịch ngoài giờ." });

    const originalLength = overtime.weeklySchedule.length;
    const updatedSchedule = overtime.weeklySchedule.filter(
      (d) => d.dayOfWeek !== dayOfWeek
    );
    overtime.set("weeklySchedule", updatedSchedule);

    if (overtime.weeklySchedule.length === originalLength) {
      return res
        .status(404)
        .json({ message: "Không có lịch để xoá cho ngày này." });
    }

    await overtime.save();
    return res.status(200).json({ message: "Xoá thành công.", data: overtime });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Lỗi server." });
  }
};
