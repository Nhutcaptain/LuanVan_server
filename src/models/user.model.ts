import mongoose from 'mongoose';

const addressSchema = new mongoose.Schema({
  province: { 
    name: String,
    code: Number,
  },
  district: {
    name: String,
    code: Number,
  },
  ward: { 
    name: String,
    code: Number,
  },
  houseNumber: { type: String },
}, { _id: false }); // Không tạo _id cho subdocument

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    unique: true,
    trim: true,
    lowercase: true,
    sparse: true, // Cho phép giá trị null hoặc không có
  },
  googleId: {
    type: String,
    unique: true,
    sparse: true, // Cho phép giá trị null hoặc không có
  },
  password: {
    type: String,
    required: function(this: any) {
      return !this.googleId;
    },
    minlength: 6,
  },
  fullName: {
    type: String,
  },
  avatar: {
    type: String,
    default: '',
  },
  role: {
    type: String,
    enum: ['admin', 'doctor', 'nurse', 'patient'],
    default: 'patient',
  },
  phone: {
    type: String,
    unique: true,
    trim: true,
    sparse: true, // Cho phép giá trị null hoặc không có
  },
  address: addressSchema,
  dateOfBirth: {
    type: Date,
  },
  gender: String,
  isActive: {
    type: Boolean,
    default: true,
  },
  emailVerified: {
    type: Boolean,
    default: false,
  },
  emailVerificationToken: String,
  emailVerificationTokenExpires: Date,
}, { timestamps: true });

export const User = mongoose.model('User', userSchema);