import mongoose from "mongoose";

const defaultDepartmentSchema = new mongoose.Schema({
    name: String,
})

export const Department = mongoose.model("Department", defaultDepartmentSchema);