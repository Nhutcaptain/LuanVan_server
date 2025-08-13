import mongoose from "mongoose";

const otpSchema = new mongoose.Schema({
    target: String,
    otp: String,
    type: {
        type: String,
        enum: ['register', 'login', 'reset_password'],
        required: true
    },
    createdAt: Date,

})

export const Otp = mongoose.model("Otp", otpSchema);