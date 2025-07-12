import mongoose from 'mongoose';

const patientSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
     patientCode: {
        type: String,
        required: true,
        unique: true,
        match: [/^\d{8}$/, 'Patient code must be exactly 8 digits']
    },
    medicalHistory: {
        type: String,
        trim: true
    },
    allergies: [String],
    medications: {
        type: String,
        trim: true
    },
    insurance: {
        provider: String,
        number: String,
        validUntil: Date
    },

},{timestamps: true});

function generate8DigitCode(): string {
  return Math.floor(10000000 + Math.random() * 90000000).toString();
}

patientSchema.pre('save', async function (next) {
  if (this.isNew && !this.patientCode) {
    let code: string = '';
    let isUnique = false;

    while (!isUnique) {
      code = generate8DigitCode();
      const existing = await mongoose.models.Patient.findOne({ patientCode: code });
      if (!existing) isUnique = true;
    }

    this.patientCode = code;
  }
  next();
});

export const Patient = mongoose.model('Patient', patientSchema);