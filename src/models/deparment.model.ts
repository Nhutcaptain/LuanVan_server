import mongoose from "mongoose";

const defaultDepartmentSchema = new mongoose.Schema({
    name: String,
    id: String,
    description: String,

},{timestamps: true});

defaultDepartmentSchema.pre("save", async function (next) {
  const doc = this as any;

  if (!doc.isNew || doc.id) return next(); // đã có id thì bỏ qua

  try {
    let isUnique = false;
    let generatedId = '';

    while (!isUnique) {
      // Tạo ID ngẫu nhiên 6 chữ số, padding nếu cần
      generatedId = String(Math.floor(Math.random() * 1000000)).padStart(6, '0');

      // Kiểm tra xem đã tồn tại trong DB chưa
      const exists = await mongoose.model("Department").findOne({ id: generatedId });

      if (!exists) {
        isUnique = true;
      }
    }

    doc.id = generatedId;
    next();
  } catch (err) {
    console.error(err);
  }
});

export const Department = mongoose.model("Department", defaultDepartmentSchema);