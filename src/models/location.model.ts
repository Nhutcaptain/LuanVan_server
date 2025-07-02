import mongoose from "mongoose";

const locationSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    departmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Department',
        default: null,
    },
    address: String,
    image: {
        url: String,
        publicId: String,
    },
    floor: String,
},{timestamps: true});

export const Location = mongoose.model('Location', locationSchema);