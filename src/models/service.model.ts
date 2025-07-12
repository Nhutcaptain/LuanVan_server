import mongoose from "mongoose";

const serviceSchema = new mongoose.Schema({
    name: {
        type: String,
        unique: true,
    },
    type: {
        type: String,
        enum: ['procedure' , 'test' , 'vaccination' , 'other'],
        default: 'procedure',
    },
    price: Number,
    description: String,
    notes: [String],
    usageCount: Number,
},{timestamps: true})

export const Service = mongoose.model('Services', serviceSchema);