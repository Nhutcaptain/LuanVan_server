import mongoose from "mongoose";

const prescriptionItemSchema = new mongoose.Schema(
  {
    medication: {
      type: String,
      // required: true,
      trim: true,
    },
    dosage: {
      type: String,
      // required: true
    },
    frequency: {
      type: String,
      // required: true,
    },
    duration: {
      type: String,
      // required: true,
    },
    quantity: Number,
    unit: String,
  },
  { _id: false }
);

const testOrderSchema = new mongoose.Schema(
  {
    serviceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Services",
      required: true,
    },
    status: {
      type: String,
      enum: ["ordered", "in_progress", "completed"],
      default: "ordered",
    },
    resultFileUrl: {
      type: String,
      default: null,
    },
  },
  { _id: false }
);

const examinationSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
    },
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
      required: true,
    },
    patientCode: String,
    date: {
      type: Date,
      default: Date.now(),
      required: true,
    },
    subjective: {
      type: String,
      // required: true,
      trim: true,
    },
    provisional : {
      type: String,
      // required: true,
      trim: true,
    },
    assessment: {
      type: String,
      // required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ["examining", "waiting_result", "completed"],
      default: "examining",
    },
    plan: {
      type: String,
      // required: true,
      trim: true,
    },
    prescriptions: [prescriptionItemSchema],
    testOrders: [testOrderSchema],
    notes: {
      type: String,
      trim: true,
    },
    isOvertimeAppointment: Boolean,
    invoiceNumber: {
      type: String,
      unique: true,
      sparse: true, // để tránh lỗi unique với dữ liệu cũ chưa có invoiceNumber
      trim: true,
    },
    followUp: {
      type: Date,
    },
  },
  { timestamps: true }
);

export const Examination = mongoose.model("Examination", examinationSchema);
