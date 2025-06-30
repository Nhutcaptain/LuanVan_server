import mongoose from 'mongoose';

const prescriptionItemSchema = new mongoose.Schema({
    medication: {
        type: String,
        required: true,
        trim: true,
    },
    dosage: {
        type: String,
        required: true
    },
    frequency: {
        type: String,
        required: true,
    },
    duration: {
        type: String,
        required: true,
    }
},{_id: false})

const examinationSchema = new mongoose.Schema({
    patientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Patient',
        required: true,
    },
    doctorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    date: {
        type: Date,
        default: Date.now(),
        required: true,
    },
    subjective: {
        type: String,
        required: true,
        trim: true,
    },
    objective: {
        type: String,
        required: true,
        trim: true,
    },
    assessment: {
    type: String,
    required: true,
    trim: true
  },
  plan: {
    type: String,
    required: true,
    trim: true
  },
  prescriptions: [prescriptionItemSchema],
  notes: {
    type: String,
    trim: true
  }
},{timestamps: true});

export const Examination = mongoose.model('Examination',examinationSchema);