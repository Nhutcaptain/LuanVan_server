import { Appointment } from '../models/appointment.model';

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

    // Kiểm tra trùng lịch (nếu cần)
    const existing = await Appointment.findOne({
      doctorId,
      appointmentDate,
      session,
      status: 'scheduled'
    });

    if (existing) {
      return res.status(409).json({ message: 'Lịch hẹn đã tồn tại cho bác sĩ này vào thời gian đó.' });
    }

    // Tạo lịch hẹn mới
    const newAppointment = new Appointment({
      patientId,
      doctorId,
      appointmentDate,
      session,
      departmentId,
      specialtyId,
      reason,
      notificationSent: {
        email: false,
        sms: false
      }
    });

    await newAppointment.save();

    res.status(201).json({
      message: 'Tạo lịch hẹn thành công.',
      appointment: newAppointment
    });

  } catch (error) {
    console.error('Lỗi khi tạo lịch hẹn:', error);
    res.status(500).json({ message: 'Đã xảy ra lỗi khi tạo lịch hẹn.' });
  }
};