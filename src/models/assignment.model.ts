import mongoose from "mongoose";

const doctorShiftAssignmentSchema = new mongoose.Schema({
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
  shiftId: { type: mongoose.Schema.Types.ObjectId, ref: 'Shift', required: true },
  date: { type: String, required: true }, // Format: "YYYY-MM-DD"
  status: {
    type: String,
    enum: ['active', 'off', 'on-duty'],
    default: 'active'
  },
  note: { type: String },
}, { timestamps: true });

doctorShiftAssignmentSchema.index({ doctorId: 1, date: 1 }, { unique: false });

module.exports = mongoose.model('DoctorShiftAssignment', doctorShiftAssignmentSchema);