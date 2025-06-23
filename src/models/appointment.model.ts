import mongoose from "mongoose";

const appointmentSchema = new mongoose.Schema({
    patientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Patient',
        required: true
    },
    doctorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Doctor',
        required: true
    },
    appointmentDate: {
        type: Date,
        required: true
    },
    session:{
        type: String,
        enum: ['morning','afternoon'],
        required: true,
    },
    departmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Department',
    },
    specialtyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Specialty',
    },
    status: {
        type: String,
        enum: ['scheduled', 'completed', 'cancelled'],
        default: 'scheduled'
    },
    reason:{
        type: String,
    },
    notificationSent: {
        email: Boolean,
        sms: Boolean,
    },
}, { timestamps: true });

export const Appointment = mongoose.model('Appointment', appointmentSchema);