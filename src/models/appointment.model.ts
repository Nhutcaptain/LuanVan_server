import mongoose from "mongoose";

const appointmentSchema = new mongoose.Schema({
    patientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    doctorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Doctor',
        required: true
    },
    queueNumber: Number,
    appointmentDate: {
        type: Date,
        required: true,
    },
    session:{
        type: String,
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
    location: String,
    status: {
        type: String,
        enum: ['scheduled', 'completed', 'cancelled', 'examining', 'waiting_result'],
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