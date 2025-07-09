import mongoose from "mongoose";

const specialScheduleSchema = new mongoose.Schema({
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
  date: { type: Date, required: true }, // ngày cụ thể, ví dụ 2025-07-12
  type: {
    type: String,
    required: true
  },
  note: { type: String }, // ghi chú thêm (ví dụ: "nghỉ phép", "họp hội đồng", v.v.)
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