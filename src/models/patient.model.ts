import mongoose from 'mongoose';

const patientSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    medicalHistory: {
        type: String,
        trim: true
    },
    allergies: {
        type: String,
        trim: true
    },
    medications: {
        type: String,
        trim: true
    },
    insurance: {
        provider: String,
        number: String,
        validUntil: Date
    },

});

export const Patient = mongoose.model('Patient', patientSchema);