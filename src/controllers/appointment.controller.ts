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