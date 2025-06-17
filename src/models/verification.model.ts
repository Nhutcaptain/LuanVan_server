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
}, { timestamps: true });

export const Verification = mongoose.model('Verification', verificationSchema);