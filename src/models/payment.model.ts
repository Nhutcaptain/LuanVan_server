import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema({
    patientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Patient',
        required: true
    },
    services:[{
        name: String,
        cost: Number,
    }],
    total: Number,
    status: {
        type: String,
        enum: ['paid', 'unpaid', 'pending'],
        default: 'unpaid'
    },
    paymentMethod: String,
    invoiceNumber: String,
}, { timestamps: true });

export const Payment = mongoose.model('Payment', paymentSchema);