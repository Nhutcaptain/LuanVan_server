import mongoose from "mongoose";
import { ppid } from "process";

const medicineSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    stock: {
        type: Number,
        required: true,
        min: 0
    },
    unit: {
        type: String,
    },
    expireDate: Date,
    warningThreshold: Number,
    description: {
        type: String,
        trim: true
    },
});
export const Medicine = mongoose.model("Medicine", medicineSchema);