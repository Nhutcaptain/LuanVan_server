import mongoose from "mongoose";

  const specialScheduleSchema = new mongoose.Schema({
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Doctor',
      required: true
    },
    startDate: {
      type: Date,
      required: true // Ngày bắt đầu của lịch đặc biệt
    },
    endDate: {
      type: Date,
      required: true // Ngày kết thúc của lịch đặc biệt
    },
    type: {
      type: String,
      required: true
    },
    note: {
      type: String
    }
  }, { timestamps: true });

const weeklyScheduleSchema = new mongoose.Schema({
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
  schedule: [
    {
      dayOfWeek: {
        type: Number,
        min: 0,
        max: 6,
        required: true
      },
      shiftIds: {
        type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Shift' }],
        required: true,
        validate: [(val: any[]) => val.length > 0, 'Phải có ít nhất 1 ca']
      }
    }
  ],
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

export const SpecialSchedule = mongoose.model('SpecialSchedule', specialScheduleSchema);
export const WeeklySchedule = mongoose.model('WeeklySchedule', weeklyScheduleSchema);