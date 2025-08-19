import { Certificate } from "crypto";
import mongoose from "mongoose";

const doctorSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  nameSlug: {
    type: String,
  },
  departmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Department",
  },
  specialtyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Specialty",
    trim: true,
    default: null 
  },
  specialization: {
    type: String,
    trim: true,
  },
  subSpecialty: {
    type: [String],
    default: [],
    trim: true,
  },
  certificate: {
    type: [String],
    default: [],
    trim: true,
  },
  overtimeExaminationPrice: Number,
  officeExaminationPrice: Number,
  experience: {
    type: [String],
    default: [],
    trim: true,
  },
  degree: {
    type: String,
    enum: ["Doctor", "Master", "PhD", "Associate Professor", "Professor"],
    default: "Doctor",
  },
  academicTitles: {
    type: String,
    enum: ['Associate Professor' , 'Professor'],
  },
  schedule: {
    date: Date,
    time: String,
    shifts: [String],
  },
  description: String,
});

export const Doctor = mongoose.model("Doctor", doctorSchema);
