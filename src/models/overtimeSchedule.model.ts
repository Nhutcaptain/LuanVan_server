// models/OvertimeSchedule.ts
import mongoose from 'mongoose';

const overtimeSlotSchema = new mongoose.Schema({
  startTime: {
    type: String, // "HH:mm" format, e.g., "18:00"
    required: true
  },
  endTime: {
    type: String, // "HH:mm" format, e.g., "20:00"
    required: true
  }
}, { _id: false });

const weeklySlotSchema = new mongoose.Schema({
  dayOfWeek: {
    type: Number, // 0 = Sunday, 6 = Saturday
    required: true,
    min: 0,
    max: 6
  },
  isActive: {
    type: Boolean,
    default: false
  },
  slots: {
    type: [overtimeSlotSchema],
    default: []
  },
  locationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Location',
    required: true
  }
}, { _id: false });

const overtimeScheduleSchema = new mongoose.Schema({
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    required: true
  },
  weeklySchedule: {
    type: [weeklySlotSchema],
    default: [] // Array of 0-6 entries for each weekday
  }
}, {
  timestamps: true
});

export const OvertimeSchedule = mongoose.model('OvertimeSchedule', overtimeScheduleSchema);
export const OvertimeSlot = mongoose.model('OvertimeSlot', overtimeSlotSchema);
