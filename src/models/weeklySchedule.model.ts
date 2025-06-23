import mongoose from "mongoose";

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

export const WeeklySchedule = mongoose.model('WeeklySchedule', weeklyScheduleSchema);