const mongoose = require('mongoose');
const healthStatusSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    weight: Number,         // cân nặng (kg)
    height: Number,         // chiều cao (cm)
    heartRate: Number,      // nhịp tim (lần/phút)
    bloodPressure: String,  // huyết áp (vd: "120/80")
    diabetes: String,       // tình trạng tiểu đường (vd: "Không", "Type 1", "Type 2")
    blood: String,          // nhóm máu (vd: "A", "B", "O", "AB")
    note: String,           // ghi chú thêm
    createdAt: { type: Date, default: Date.now }
})

const HealthStatus = mongoose.model('HealthStatus', healthStatusSchema);
module.exports = HealthStatus;