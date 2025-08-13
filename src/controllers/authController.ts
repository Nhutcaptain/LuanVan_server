import { User } from '../models/user.model';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { sendEmailOtp, sendVerificationEmail } from '../utils/email';
import { Verification } from '../models/verification.model';
import jwt from 'jsonwebtoken';
import { Patient } from '../models/patient.model';
import { Doctor } from '../models/doctor.model';
import { getDoctorIdByUserId } from './doctorController';
import { Otp } from '../models/otp.model';
import { sendSpeedSms } from '../utils/sendSMS';
import { HealthStatus } from '../models/heathstatus.model';

// export const register = async (req: any, res: any) => {
//   const { email, phone, password, ...rest } = req.body;

//   // Check: ít nhất phải có email hoặc phone
//   if (!email && !phone) {
//     return res.status(400).json({ message: 'Vui lòng cung cấp email hoặc số điện thoại.' });
//   }

//   // Kiểm tra email tồn tại
//   if (email) {
//     const existingEmail = await User.findOne({ email });
//     if (existingEmail) return res.status(400).json({ message: 'Email đã tồn tại' });
//   }

//   // Kiểm tra số điện thoại tồn tại
//   if (phone) {
//     const existingPhone = await User.findOne({ phone });
//     if (existingPhone) return res.status(400).json({ message: 'Số điện thoại đã tồn tại' });
//   }

//   const hashedPassword = await bcrypt.hash(password, 10);

//   let emailVerificationToken: string | undefined;
//   let emailVerificationTokenExpires: number | undefined;
//   let phoneOtp: string | undefined;
//   let phoneOtpExpires: number | undefined;

//   // Nếu đăng ký bằng email
//   if (email) {
//     emailVerificationToken = crypto.randomBytes(32).toString('hex');
//     emailVerificationTokenExpires = Date.now() + 1000 * 60 * 60 * 24; // 24h
//   }

//   // Nếu đăng ký bằng số điện thoại
//   if (phone) {
//     phoneOtp = Math.floor(100000 + Math.random() * 900000).toString(); // 6 số
//     phoneOtpExpires = Date.now() + 1000 * 60 * 5; // 5 phút
//   }

//   // Lưu vào bảng Verification
//   await Verification.create({
//     email,
//     phone,
//     password: hashedPassword,
//     ...rest,
//     emailVerificationToken,
//     emailVerificationTokenExpires,
//     phoneOtp,
//     phoneOtpExpires
//   });

//   // Gửi email xác minh
//   if (email && emailVerificationToken) {
//     await sendVerificationEmail(email, emailVerificationToken);
//   }

//   // Gửi OTP qua SMS
//   if (phone && phoneOtp) {
//     const formattedPhone = phone.startsWith('0') ? '84' + phone.slice(1) : phone;
//     await sendSpeedSms(formattedPhone, phoneOtp);
//   }

//   res.status(200).json({
//     message: email
//       ? 'Vui lòng xác minh email để hoàn tất đăng ký.'
//       : 'Mã OTP đã được gửi tới số điện thoại của bạn.'
//   });
// };

export const register = async (req: any, res: any) => {
  const { email, phone, password, ...rest } = req.body;

  if (!email && !phone) {
    return res.status(400).json({ message: "Vui lòng cung cấp email hoặc số điện thoại." });
  }

  // Kiểm tra trùng trong User (đã đăng ký thành công)
  if (email && await User.findOne({ email })) {
    return res.status(400).json({ message: "Email đã tồn tại" });
  }
  if (phone && await User.findOne({ phone })) {
    return res.status(400).json({ message: "Số điện thoại đã tồn tại" });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const updateData: any = {
    password: hashedPassword,
    ...rest
  };

  if (email) {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    updateData.emailOtp = otp;
    updateData.emailOtpExpires = new Date(Date.now() + 5 * 60 * 1000); // 5 phút
    await sendEmailOtp(email, otp);
  }

  if (phone) {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    updateData.phoneOtp = otp;
    updateData.phoneOtpExpires = new Date(Date.now() + 5 * 60 * 1000);
    const formattedPhone = phone.startsWith("0") ? "84" + phone.slice(1) : phone;
    await sendSpeedSms(formattedPhone, otp);
  }

  // Upsert vào Verification
  await Verification.findOneAndUpdate(
    { $or: [{ email }, { phone }] }, // tìm theo email hoặc phone
    { email, phone, ...updateData },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  res.status(200).json({
    message: email
      ? "Mã OTP đã được gửi tới email của bạn."
      : "Mã OTP đã được gửi tới số điện thoại của bạn.",
  });
};


export const verifyEmail = async (req: any, res: any) => {
  const { token } = req.query;

  const verification = await Verification.findOne({ emailVerificationToken: token });
  if (
    !verification ||
    !verification.emailVerificationTokenExpires ||
    (verification.emailVerificationTokenExpires instanceof Date
      ? verification.emailVerificationTokenExpires.getTime() < Date.now()
      : verification.emailVerificationTokenExpires < Date.now())
  ) {
    return res.status(400).json({ message: 'Mã xác minh không hợp lệ hoặc đã hết hạn.' });
  }

  const {email, phone, password, ...rest} = verification.toObject();
  const newUser = new User({
    email,
    phone,
    password,
    ...rest,
    emailVerified: true,
  });

  await newUser.save();
  await Verification.deleteOne({ _id: verification._id });
  const jwtToken = jwt.sign(
    {userId: newUser._id},
    process.env.JWT_SECRET || 'defaultsecret',
    {expiresIn: '30d'});

  res.status(200).json({ message: 'Email đã được xác minh thành công. Bạn có thể đăng nhập.' ,
    token: jwtToken
  }
  );
}

export const verifyOtp = async (req: any, res: any) => {
  try {
    const { email, phone, otp } = req.body;

    if ((!email && !phone) || !otp) {
      return res.status(400).json({ message: "Vui lòng cung cấp email/phone và OTP." });
    }

    // Tìm bản ghi Verification
    const verification = await Verification.findOne({ $or: [{ email }, { phone }] });

    if (!verification) {
      return res.status(400).json({ message: "Không tìm thấy yêu cầu xác minh." });
    }

    // Xác minh OTP cho email
    if (email) {
      if (verification.emailOtp !== otp) {
        return res.status(400).json({ message: "OTP email không chính xác." });
      }
      if (verification.emailOtpExpires && verification.emailOtpExpires < new Date()) {
        return res.status(400).json({ message: "OTP email đã hết hạn." });
      }
    }

    // Xác minh OTP cho phone
    if (phone) {
      if (verification.phoneOtp !== otp) {
        return res.status(400).json({ message: "OTP phone không chính xác." });
      }
      if (verification.phoneOtpExpires && verification.phoneOtpExpires < new Date()) {
        return res.status(400).json({ message: "OTP phone đã hết hạn." });
      }
    }

    // Tạo user mới từ thông tin lưu tạm
    const newUser = await User.create({
      email: verification.email,
      phone: verification.phone,
      password: verification.password,
      fullName: verification.fullName,
      role: verification.role,
      address: verification.address,
      dateOfBirth: verification.dateOfBirth,
      gender: verification.gender
    });

    // Xoá bản ghi verification sau khi tạo tài khoản
    await Verification.deleteOne({ _id: verification._id });
    const patient = await Patient.findOne({userId: newUser._id});
    if(!patient) {
      const newPatient = new Patient({
        userId: newUser._id,
        // patientCode sẽ được tạo tự động qua pre('save')
      });
      await newPatient.save();
    }
    const healthStatus = await HealthStatus.findOne({userId: newUser._id});
    if(!healthStatus) {
      const newHealthStatus = new HealthStatus({
        userId: newUser._id,
      });
      await newHealthStatus.save();
    }
    const jwtToken = jwt.sign(
    {userId: newUser._id},
    process.env.JWT_SECRET || 'defaultsecret',
    {expiresIn: '30d'});

    res.status(200).json({
      message: "Xác minh OTP thành công!",
      user: newUser,
      token: jwtToken
    });

  } catch (error: any) {
    console.error("Lỗi verify OTP:", error);
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};


export const login = async (req: any, res: any) => {
  const { email, password } = req.body;

  // Kiểm tra đầu vào
  if (!email || !password) {
    return res.status(400).json({ message: 'Vui lòng nhập email và mật khẩu.' });
  }

  // Tìm user theo email
  const user = await User.findOne({ email });
  if (!user) {
    return res.status(400).json({ message: 'Email hoặc mật khẩu không đúng.' });
  }

  // Kiểm tra đã xác minh email chưa
  // if (!user.emailVerified) {
  //   return res.status(400).json({ message: 'Vui lòng xác minh email trước khi đăng nhập.' });
  // }

  // So sánh mật khẩu
  if (!user.password) {
    return res.status(400).json({ message: 'Email hoặc mật khẩu không đúng.' });
  }
  const isMatch = await bcrypt.compare(password, user.password as string);
  if (!isMatch) {
    return res.status(400).json({ message: 'Email hoặc mật khẩu không đúng.' });
  }

  let doctorId;
  if(user.role === 'doctor'){
   doctorId = await Doctor.findOne({userId: user._id});
  }

  // Tạo JWT token
  const jwtToken = jwt.sign(
    { userId: user._id, role: user.role },
    process.env.JWT_SECRET || 'defaultsecret',
{ expiresIn: '30d' }
  );

  res.status(200).json({
    message: 'Đăng nhập thành công.',
    token: jwtToken,
    fullName: user.fullName,
    email: user.email,
    role: user.role,
    doctorId: doctorId ? doctorId._id : null,
  });
};

export const logout = (req:any, res:any) => {
  res.clearCookie('refreshToken');
  res.status(200).json({ message: 'Đăng xuất thành công.' });
};

export const getMe = async (req:any, res:any) => {
  try {
    const userId = req.user.userId;
    const user = await User.findById(userId).select('-password -__v');
    if (!user) {
      return res.status(404).json({ message: 'Người dùng không tồn tại.' });
    }

    res.status(200).json(user);
  }catch(error) {
    res.status(500).json({message: 'Lỗi máy chủ'});
  }
}

export const sendOtp = async (req: any, res: any) => {
  try {
    const { target, method } = req.body; // method: 'sms' | 'email'

    if (!target || !method) {
      return res.status(400).json({ message: 'Vui lòng nhập target và method' });
    }

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    await Otp.findOneAndUpdate(
      { target, type: method },
      { otp: otpCode, createdAt: new Date(), type: method },
      { upsert: true }
    );

    if (method === 'sms') {
      const formattedPhone = target.startsWith('0') ? '84' + target.slice(1) : target;
      await sendSpeedSms(formattedPhone, otpCode);
    } else if (method === 'email') {
      await sendEmailOtp(target, otpCode);
    } else {
      return res.status(400).json({ message: 'Phương thức không hợp lệ' });
    }

    res.json({ message: `Đã gửi OTP qua ${method}` });
  } catch (error: any) {
    res.status(500).json({ message: 'Lỗi gửi OTP', error: error.message });
  }
};