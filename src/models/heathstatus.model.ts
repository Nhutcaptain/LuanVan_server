const mongoose = require('mongoose');
const healthStatusSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true // Tham chiếu đến người dùng
  },

  // Cân nặng (kg)
  weight: {
    value: Number,
    testedAt: Date // Thời gian đo cân nặng
  },

  // Chiều cao (cm)
  height: {
    value: Number,
    testedAt: Date // Thời gian đo chiều cao
  },

  // Nhịp tim (lần/phút)
  heartRate: {
    value: Number,
    testedAt: Date // Thời gian đo nhịp tim
  },

  // Huyết áp (vd: "120/80")
  bloodPressure: {
    value: String,
    testedAt: Date // Thời gian đo huyết áp
  },

  // Tình trạng tiểu đường ("Không", "Type 1", "Type 2")
  diabetes: {
    value: String,
    testedAt: Date // Thời gian xét nghiệm tiểu đường
  },

  // Nhóm máu (A, B, AB, O)
  blood: {
    value: String,
    testedAt: Date // Thời gian xét nghiệm nhóm máu
  },

  // Chức năng thận
  kidneyFunction: {
    // Creatinine (mg/dL)
    creatinine: {
      value: Number,
      testedAt: Date // Thời gian xét nghiệm creatinine
    },
    // Ure (mg/dL)
    urea: {
      value: Number,
      testedAt: Date // Thời gian xét nghiệm ure
    },
    // GFR (ml/phút/1.73m2) - tốc độ lọc cầu thận
    gfr: {
      value: Number,
      testedAt: Date // Thời gian xét nghiệm GFR
    }
  },

  // Chức năng gan
  liverFunction: {
    // ALT (GPT) - đơn vị U/L
    alt: {
      value: Number,
      testedAt: Date // Thời gian xét nghiệm ALT
    },
    // AST (GOT) - đơn vị U/L
    ast: {
      value: Number,
      testedAt: Date // Thời gian xét nghiệm AST
    },
    // Bilirubin toàn phần (mg/dL)
    bilirubin: {
      value: Number,
      testedAt: Date // Thời gian xét nghiệm bilirubin
    }
  },

  // Mỡ máu (cholesterol)
  cholesterol: {
    // Tổng cholesterol (mg/dL)
    total: {
      value: Number,
      testedAt: Date // Thời gian xét nghiệm tổng cholesterol
    },
    // HDL - cholesterol tốt (mg/dL)
    hdl: {
      value: Number,
      testedAt: Date // Thời gian xét nghiệm HDL
    },
    // LDL - cholesterol xấu (mg/dL)
    ldl: {
      value: Number,
      testedAt: Date // Thời gian xét nghiệm LDL
    },
    // Triglycerides (mg/dL)
    triglycerides: {
      value: Number,
      testedAt: Date // Thời gian xét nghiệm triglycerides
    }
  },

  // Đường huyết
  glucose: {
    // Đường huyết lúc đói (mg/dL)
    fasting: {
      value: Number,
      testedAt: Date // Thời gian xét nghiệm đường huyết đói
    },
    // HbA1c (%)
    hba1c: {
      value: Number,
      testedAt: Date // Thời gian xét nghiệm HbA1c
    }
  },

  // Ghi chú thêm của người dùng hoặc bác sĩ
  note: String,

  // Ngày tạo bản ghi
  createdAt: { type: Date, default: Date.now }
});


export const HealthStatus = mongoose.model('HealthStatus',healthStatusSchema );