import dayjs from 'dayjs';
import { Appointment } from '../models/appointment.model';
import { OvertimeSchedule } from '../models/overtimeSchedule.model';
import { Shift } from '../models/shift.model';
import { SpecialSchedule, WeeklySchedule } from '../models/weeklySchedule.model';

export const createAppointment = async (req: any, res: any) => {
  try {
    const {
      patientId,
      doctorId,
      appointmentDate,
      session,
      departmentId,
      specialtyId,
      reason,
    } = req.body;

    // Kiểm tra các trường bắt buộc
    if (!patientId || !doctorId || !appointmentDate || !session) {
      return res.status(400).json({ message: 'Vui lòng nhập đầy đủ thông tin bắt buộc.' });
    }

    // Đếm số lịch đã đặt cùng bác sĩ, ngày và session
    const count = await Appointment.countDocuments({
      doctorId,
      appointmentDate,
      session,
      status: 'scheduled'
    });

    if (count >= 10) {
      return res.status(409).json({
        message: 'Đã đủ số lượng bệnh nhân cho bác sĩ này vào buổi khám đó. Vui lòng chọn thời gian khác.'
      });
    }

    const queueNumber = count + 1;

    const newAppointment = new Appointment({
      patientId,
      doctorId,
      appointmentDate,
      session,
      departmentId,
      specialtyId,
      reason,
      queueNumber,
      notificationSent: {
        email: false,
        sms: false
      }
    });

    await newAppointment.save();

    res.status(201).json(newAppointment);

  } catch (error) {
    console.error('Lỗi khi tạo lịch hẹn:', error);
    res.status(500).json({ message: 'Đã xảy ra lỗi khi tạo lịch hẹn.' });
  }
};


export const getAppointmentByPatientId = async(req: any, res: any) => {
  try{
    const {patientId} = req.params;
    if(!patientId) {
      return res.status(400).json({message:'Thiếu thông tin của bệnh nhân'});
    }
    const appointments = await Appointment.find({patientId})
    .populate({
      path:'doctorId',
      select:'userId',
      populate: {
        path: 'userId',
        select:'fullName email phone',
      }
    })
    .populate('departmentId', 'name')
    .populate('specialtyId', 'name');
    if(!appointments || appointments.length === 0) {
      return res.status(404).json({message: 'Không tìm thấy lịch hẹn nào'});
    }

    return res.status(200).json(appointments);
  }catch(error) {
    console.error(error);
    return res.status(500).json({message: 'Xảy ra lỗi ở server'});
  }
}

export const getAppointmentByDoctor = async(req: any, res: any) => {
  try{
    const {doctorId} = req.params;
    if(!doctorId){
      return res.status(400).json({message: 'Thiếu thông tin bác sĩ'});
    }
    const appointments = await Appointment.find({doctorId: doctorId})
      .populate('patientId','fullName');
    if(!appointments) {
      return res.status(404).json({message: 'Không tìm thấy lịch đặt khám nào'});
    }
    return res.status(200).json(appointments);
  }catch(error) {
    console.error(error);
    return res.status(500).json({message: 'Lỗi ở server'});
  }
}

export const cancelAppointment = async(req: any, res: any) => {
  try{
    const {appointmentId} = req.params;
    if(!appointmentId) {
      return res.status(400).json({message: 'Thiếu thông tin lịch hẹn'});
    }
    const appointment = await Appointment.findById(appointmentId);
    if(!appointment) {
      return res.status(404).json({message: 'Lịch hẹn không tồn tại'});
    }
    if(appointment.status === 'cancelled') {
      return res.status(400).json({message: 'Lịch hẹn đã được hủy trước đó'});
    }
    appointment.status = 'cancelled';
    await appointment.save();
    return res.status(200).json(appointment);
  }catch(error) {
    console.error(error);
    return res.status(500).json({message: 'Lỗi ở server'});
  }
}

export const completeAppointment = async (req: any, res: any) => {
  try {
    const { appointmentId } = req.params;

    if (!appointmentId) {
      return res.status(400).json({ message: 'Thiếu thông tin lịch hẹn' });
    }

    const appointment = await Appointment.findById(appointmentId);

    if (!appointment) {
      return res.status(404).json({ message: 'Lịch hẹn không tồn tại' });
    }

    if (appointment.status === 'completed') {
      return res.status(400).json({ message: 'Lịch hẹn đã hoàn tất trước đó' });
    }

    if (appointment.status === 'cancelled') {
      return res.status(400).json({ message: 'Không thể hoàn tất lịch hẹn đã bị hủy' });
    }

    appointment.status = 'completed';
    appointment.updatedAt = new Date();
    await appointment.save();

    return res.status(200).json({
      message: 'Hoàn tất lịch hẹn thành công',
      appointment,
    });
  } catch (error) {
    console.error('completeAppointment error:', error);
    return res.status(500).json({ message: 'Lỗi ở server' });
  }
};

const timeToMinutes = (time: string) => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

export const getTodayAppointments = async (req: any, res: any) => {
  try {
    const { doctorId } = req.params;
    const now = new Date();
    const dayOfWeek = now.getDay();
    const currentTime = now.toTimeString().slice(0, 5); // HH:mm

    const startOfDay = new Date(now.setHours(0, 0, 0, 0));
    const endOfDay = new Date(now.setHours(23, 59, 59, 999));

    // 1. Check Special Schedule
    const special = await SpecialSchedule.findOne({ doctorId, date: { $gte: startOfDay, $lte: endOfDay } });
    if (special) {
      return res.status(200).json({
        message: `Bác sĩ có lịch đặc biệt hôm nay: ${special.type}`,
        session: null,
        appointments: []
      });
    }

    // 2. Weekly Schedule
    const weekly = await WeeklySchedule.findOne({ doctorId, isActive: true }).lean();
    let shiftNow: any = null;
    let sessionString = '';
    let isOvertime = false;

    if (weekly) {
      const scheduleToday = weekly.schedule.find(s => s.dayOfWeek === dayOfWeek);
      if (scheduleToday && scheduleToday.shiftIds.length > 0) {
        const shifts = await Shift.find({ _id: { $in: scheduleToday.shiftIds } }).lean();
        const currentMinutes = timeToMinutes(currentTime);
        shiftNow = shifts.find(shift => {
          const start = timeToMinutes(shift.startTime);
          const end = timeToMinutes(shift.endTime);
          return start <= currentMinutes && currentMinutes <= end;
        });
        if (shiftNow) {
          sessionString = `${shiftNow.startTime}-${shiftNow.endTime}`; // Không có khoảng trắng
        }
      }
    }

    // 3. Overtime nếu không có shift cố định
    if (!shiftNow) {
      const overtime = await OvertimeSchedule.findOne({ doctorId }).lean();
      if (overtime) {
        const overtimeToday = overtime.weeklySchedule.find(w => w.dayOfWeek === dayOfWeek && w.isActive);
        if (overtimeToday) {
          const slot = overtimeToday.slots.find(slot => slot.startTime <= currentTime && currentTime <= slot.endTime);
          if (slot) {
            isOvertime = true;
            shiftNow = {
              name: 'Ca tăng ca',
              startTime: slot.startTime,
              endTime: slot.endTime,
              locationId: overtimeToday.locationId
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
        appointments: []
      });
    }

    const appointments = await Appointment.find({
      doctorId,
      appointmentDate: { $gte: startOfDay, $lte: endOfDay },
      session: sessionString,
    })
      .populate({
        path: 'patientId',
        select: 'fullName _id'
      })
      .sort({ queueNumber: 1 })
      .lean();

    // // 5. (Tuỳ chọn) Làm gọn dữ liệu trả về
    // const cleanAppointments = appointments.map(a => ({
    //   _id: a._id,
    //   queueNumber: a.queueNumber,
    //   reason: a.reason,
    //   patient: {
    //     _id: a.patientId?._id,
    //     fullName: a.patientId?.userId?.fullName || '---'
    //   },
    //   status: a.status
    // }));

    return res.status(200).json({
      session: sessionString,
      isOvertime,
      shift: shiftNow,
      appointments: appointments
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Lỗi server', error });
  }
};

export const updateStatusAppointment = async(req: any, res: any) => {
  try{
    const {id} = req.params;
    const {status} = req.body;
    const result = await Appointment.findByIdAndUpdate(id, {status}).populate('patientId', 'fullName _id');
    return res.status(200).json(result);
  }catch(error) {
    console.error(error);
    return res.status(500).json({message: 'Lỗi ở server'});
  }
}