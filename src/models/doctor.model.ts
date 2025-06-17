import { Certificate } from 'crypto';
import mongoose from 'mongoose';

const doctorSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    specialization: {
        type: String,
        required: true,
        trim: true
    },
    certificate:{
        type:[String],
        default:[],
        trim: true
    },
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