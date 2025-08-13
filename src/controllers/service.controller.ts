import { VaccinationAppointment } from "../models/appointment.model";
import { Service } from "../models/service.model";
import { Specialty } from "../models/specialty.model";

export const createService = async (req: any, res: any) => {
  try {
    const data = req.body;
    if (!data) {
      return res.status(400).json({ message: "Thiêu thông tin" });
    }
    const result = await Service.create(data);
    if (result) {
      return res.status(201).json(result);
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Lỗi phía server khi tạo dịch vụ" });
  }
};

export const getServiceById = async (req: any, res: any) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ message: "Thiếu thông tin" });
    }
    const result = await Service.findById(id);
    if (!result) {
      return res.status(404).json({ message: "Không tìm thấy dịch vụ này" });
    }
    return res.status(200).json(result);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Lỗi phía server" });
  }
};

export const getAllServices = async (req: any, res: any) => {
  try {
    const result = await Service.find();
    if (!result) {
      return res.status(404).json({ message: "Không tìm thấy dịch vụ nào" });
    }
    return res.status(200).json(result);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Lỗi phía server" });
  }
};

export const getBySpecialtyId = async (req: any, res: any) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ message: "Thiếu thông tin" });
    const specialty = await Specialty.findById(id).populate("serviceIds");

    if (!specialty) {
      return res.status(404).json({ message: "Không tìm thấy chuyên khoa" });
    }

    if (!specialty.serviceIds || specialty.serviceIds.length === 0) {
      return res.status(404).json({ message: "Không có dịch vụ nào" });
    }
    return res.status(200).json(specialty.serviceIds);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Lỗi ở server" });
  }
};

export const getAllVaccinationService = async (req: any, res: any) => {
  try {
    const vaccinationServices = await Service.find({
      type: "vaccination",
    }).sort({ createdAt: -1 });
    if (!vaccinationServices)
      return res
        .status(404)
        .json({ message: "Không tìm thấy danh sách dịch vụ" });
    return res.status(200).json(vaccinationServices);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Lỗi server" });
  }
};

// Tạo danh sách timeslot mặc định
const generateTimeSlots = () => {
  const slots: { startTime: string; endTime: string; displayTime: string }[] =
    [];
  const startHour = 7;
  const endHour = 17;
  const interval = 30;

  for (let hour = startHour; hour < endHour; hour++) {
    if (hour === 11 || hour === 12 || hour === 13) continue;

    for (let minute = 0; minute < 60; minute += interval) {
      const start = `${hour.toString().padStart(2, "0")}:${minute
        .toString()
        .padStart(2, "0")}`;

      const endMinute = minute + interval;
      const endHourAdjusted = endMinute >= 60 ? hour + 1 : hour;
      const endMinuteAdjusted = endMinute >= 60 ? endMinute - 60 : endMinute;
      const end = `${endHourAdjusted
        .toString()
        .padStart(2, "0")}:${endMinuteAdjusted.toString().padStart(2, "0")}`;

      // Loại bỏ đúng khung giờ 11:30
      if (start === "11:30") continue;

      slots.push({
        startTime: start,
        endTime: end,
        displayTime: `${start} - ${end}`,
      });
    }
  }

  return slots;
};

export const getAvailableTimeSlots = async (req: any, res: any) => {
  try {
    const { serviceId, date } = req.query;

    if (!serviceId || !date) {
      return res.status(400).json({ message: "Thiếu serviceId hoặc date" });
    }

    const selectedDate = new Date(date as string);
    const slots = generateTimeSlots();

    const appointments = await VaccinationAppointment.find({
      serviceId,
      date: selectedDate,
    });

    const slotMap = new Map<string, number>(); // key: displayTime, value: count

    appointments.forEach((appt) => {
      if (appt.time) {
        const key = appt.time;
        slotMap.set(key, (slotMap.get(key) || 0) + 1);
      }
    });

    const availableSlots = slots.map((slot) => {
      const count = slotMap.get(slot.displayTime) || 0;
      return {
        ...slot,
        available: count < 2,
        bookedCount: count,
      };
    });

    return res.status(200).json({
      message: "Lấy danh sách timeslot thành công",
      data: availableSlots,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Lỗi server" });
  }
};
