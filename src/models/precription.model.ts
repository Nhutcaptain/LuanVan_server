import mongoose from "mongoose";

const precriptionSchema = new mongoose.Schema({
    medications: [{
        medicineId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Medicine',
        },
        dosage: {
            type: String,
            required: true,
            trim: true
        },
        frequency: {
            type: String,
            required: true,
            trim: true
        },
        duration: {
            type: String,
            required: true,
            trim: true
        }
    }],
    printed: {
        type: Boolean,
        default: false
    },
})

export const Prescription = mongoose.model('Prescription', precriptionSchema);