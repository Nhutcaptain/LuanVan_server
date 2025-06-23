import {Shift} from '../models/shift.model';
import { WeeklySchedule } from '../models/weeklySchedule.model';

export const createShift = async(req: any, res: any) => {
    try {
    const { name, startTime, endTime, location } = req.body;

    if (!name || !startTime || !endTime) {
      return res.status(400).json({ message: 'Vui lòng điền đủ name, startTime, endTime' });
    }

    const newShift = await Shift.create({
      name,
      startTime,
      endTime,
      location
    });

    return res.status(201).json({
      message: 'Tạo ca làm việc thành công',
      data: newShift
    });
  } catch (err) {
    console.error('Lỗi tạo ca:', err);
    return res.status(500).json({ message: 'Lỗi máy chủ' });
  }
}

export const createOrUpdateSchedule = async(req: any, res: any) => {
    try{

        const { doctorId, schedule } = req.body;
        if (!doctorId || !Array.isArray(schedule) || schedule.length === 0) {
            return res.status(400).json({ message: 'Vui lòng cung cấp doctorId và schedule hợp lệ.' });
        }

        const existing = await WeeklySchedule.findOne({ doctorId });

        if (existing) {
            (existing as any).schedule = schedule;
            await existing.save();
            return res.status(200).json({ message: 'Cập nhật lịch làm việc thành công', data: existing });
            } else {
            const newSchedule = await WeeklySchedule.create({
                doctorId,
                schedule,
                isActive: true,
            });
            return res.status(201).json({ message: 'Tạo lịch làm việc thành công', data: newSchedule });
            }

        

    }catch(error) {
        console.error('[createOrUpdateWeeklySchedule] Lỗi:', error);
        return res.status(500).json({ message: 'Lỗi máy chủ', error: error });
    }
}

export const getWeeklyScheduleByDoctor = async(req: any, res: any) => {
    try {

        const {doctorId} = req.params;

        if(!doctorId) {
            return res.status(400).json({ message: 'Thiếu doctorId trên URL' });
        }
        const schedule = await WeeklySchedule.findOne({ doctorId })
        .populate({
            path: 'schedule.shiftIds',
            select: 'name startTime endTime' // Lấy thông tin ca nếu cần
        });

        if (!schedule) {
            return res.status(404).json({ message: 'Không tìm thấy lịch làm việc của bác sĩ' });
        }

        return res.status(200).json(schedule);

    }catch(error) {
        console.error('[getWeeklyScheduleByDoctor] Lỗi:', error);
        return res.status(500).json({ message: 'Lỗi máy chủ', error: error });
    }
}