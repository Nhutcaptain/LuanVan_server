import { Certificate } from 'crypto';
import mongoose from 'mongoose';

const doctorSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    nameSlug:{
        type: String,
    },
    departmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Department'
    },
    specialtyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Specialty',
        required: true,
        trim: true
    },
    specialization: {
        type: String,
        trim: true
    },
    subSpecialty: {
        type: [String],
        default: [],
        trim: true,
    },
    certificate:{
        type:[String],
        default:[],
        trim: true
    },
    overtimeExaminationPrice: Number,
    officeExaminationPrice: Number,
    experience: {
        type: [String],
        default: [],
        trim: true
    },
    schedule: {
        date: Date,
        time: String,
        shifts: [String],
    }
})



export const Doctor = mongoose.model('Doctor', doctorSchema);