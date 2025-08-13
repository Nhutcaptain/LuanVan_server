import mongoose from 'mongoose';

const verificationSchema = new mongoose.Schema({
  email: String,
  phone: String,
  password: String,
  fullName: String,
  role: String,
  address: Object,
  dateOfBirth: Date,
  gender: String,
  emailVerificationToken: String,
  emailVerificationTokenExpires: Date,
  emailOtp: String,
  emailOtpExpires: Date,
  phoneOtp: { type: String },
  phoneOtpExpires: { type: Date },
}, { timestamps: true });

export const Verification = mongoose.model('Verification', verificationSchema);