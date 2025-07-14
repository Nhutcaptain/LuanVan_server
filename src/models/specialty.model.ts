import mongoose from "mongoose";

const specialtySchema = new mongoose.Schema(
  {
    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
    },
    name: {
      type: String,
      required: true,
      unique: true,         // Tránh trùng tên chuyên khoa
      trim: true
    },
    description: {
      type: String,
      default: '',
      trim: true
    },
    code: {
      type: String,
      unique: true,
      sparse: true,         // Mã chuyên khoa (nội bộ hoặc viết tắt, ví dụ: NOI-TIM)
      trim: true
    },
    serviceIds: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: 'Services'
    }
  },
  {
    timestamps: true
  }
);

const subSpecialtySchema = new mongoose.Schema({
  name: String, // Nội tim mạch
  specialtyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Specialty',
    required: true
  }
});

export const Specialty = mongoose.model("Specialty", specialtySchema);
export const SubSpecialty = mongoose.model('Subspecialty', subSpecialtySchema);
