import mongoose from "mongoose";

const roomSchema = new mongoose.Schema({
    roomNumber: String,
    departmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Department',
    },
    status: {
        type: String,
        enum: ['available', 'occupied', 'maintenance'],
        default: 'available'
    }
});

export const Room = mongoose.model('Room', roomSchema);