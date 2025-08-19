import mongoose from "mongoose";

const defaultDepartmentSchema = new mongoose.Schema({
    name: {
      type: String,
      unique: true,
      trim: true,
    },
    id: String,
    description: String,
    serviceIds: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Services',
    }],
    contentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Post',
    },
    content: {
      type: String,
      default: '',
    }

},{timestamps: true});

defaultDepartmentSchema.pre("save", async function (next) {
    const doc = this as any;
    
    // Kiểm tra trùng tên (không phân biệt hoa thường)
    if (doc.isModified('name')) {
        const existingDept = await mongoose.model("Department").findOne({
            name: { $regex: new RegExp(`^${doc.name}$`, 'i') }
        });
        
        if (existingDept && existingDept._id.toString() !== doc._id?.toString()) {
            return next(new Error('Tên khoa đã tồn tại'));
        }
    }
    
    // Phần tạo ID của bạn...
    if (!doc.isNew || doc.id) return next();
    
    try {
        let isUnique = false;
        let generatedId = '';

        while (!isUnique) {
            generatedId = String(Math.floor(Math.random() * 1000000)).padStart(6, '0');
            const exists = await mongoose.model("Department").findOne({ id: generatedId });
            if (!exists) {
                isUnique = true;
            }
        }

        doc.id = generatedId;
        next();
    } catch (err) {
        console.error(err);
        next(err as Error);
    }
});

export const Department = mongoose.model("Department", defaultDepartmentSchema);