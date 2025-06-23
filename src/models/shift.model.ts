import mongoose from "mongoose";

const shiftSchema = new mongoose.Schema({
  name: { type: String, required: true },
  startTime: { type: String, required: true }, // Format: "HH:mm"
  endTime: { type: String, required: true },   // Format: "HH:mm"
  location: { type: String },
}, { timestamps: true });

export const Shift = mongoose.model('Shift',shiftSchema)