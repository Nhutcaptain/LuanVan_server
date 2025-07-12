import mongoose from "mongoose";

const medecalRecordSchema = new mongoose.Schema({
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
    appointmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Appointment',
    },
    diagnosis: {
        type: String,
        required: true,
        trim: true
    },
    symptoms: String,
    prescriptionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Prescription',
    },
    notes: {
        type: String,
        trim: true
    }
}, { timestamps: true });


export const MedicalRecord = mongoose.model('MedicalRecord', medecalRecordSchema);