import mongoose from "mongoose";

const appointmentSchema = new mongoose.Schema({
    patientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    doctorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Doctor',
        required: true
    },
    queueNumber: Number,
    appointmentDate: {
        type: Date,
        required: true,
    },
    session:{
        type: String,
        required: true,
    },
    departmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Department',
    },
    specialtyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Specialty',
    },
    location: String,
    status: {
        type: String,
        enum: ['scheduled', 'completed', 'cancelled', 'examining', 'waiting_result'],
        default: 'scheduled'
    },
    reason:{
        type: String,
    },
    notificationSent: {
        email: Boolean,
        sms: Boolean,
    },
    examinationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Examination'
    },
    isOvertime: Boolean,
}, { timestamps: true });

const SubAppointmentSchema = new mongoose.Schema({
  title: {
    type: String,
    enum: ['Mũi 1', 'Mũi 2', 'Mũi 3', 'Khám lần 1', 'Lần hẹn khác'],
    default: 'Lần hẹn',
  },
  scheduledDate: {
    type: Date,
    required: true,
  },
  actualDate: {
    type: Date, // Nếu đã tiêm/thực hiện thì lưu ngày thực tế
  },
  status: {
    type: String,
    enum: ['scheduled', 'waiting', 'completed', 'canceled'],
    default: 'Chờ thực hiện',
  },
  delayReason: {
    type: String, // nếu bị hoãn thì ghi lý do
  },
}, { _id: false });

const unifiedAppointmentSchema = new mongoose.Schema({
    patientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    serviceId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Service',
        required: true,
    },
    serviceName: String,
    subAppointment: [SubAppointmentSchema],
    date: {
        type: Date,
        required: true,
    },
    queueNumber: Number,
    type: {
        type: String,
        enum: ['vaccination','test','other'],
        required: true,
    },
    status: {
        type: String,
        enum: ['scheduled', 'completed', 'cancelled', 'waiting', 'waiting_result'],
        default: 'scheduled'
    },
    notificationSent: {
        email: Boolean,
        sms: Boolean,
    },
},{timestamps: true});

export const UnifiedAppointment = mongoose.model('UnifiedAppointment', unifiedAppointmentSchema)
export const Appointment = mongoose.model('Appointment', appointmentSchema);