import { User } from '../models/user.model';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { sendVerificationEmail } from '../utils/email';
import { Verification } from '../models/verification.model';
import jwt from 'jsonwebtoken';

export const register = async (req: any, res: any) => {
  const { email, phone, password, ...rest } = req.body;

  // Check: ít nhất phải có email hoặc phone
  if (!email && !phone) {
    return res.status(400).json({ message: 'Vui lòng cung cấp email hoặc số điện thoại.' });
  }

  // Kiểm tra xem đã tồn tại email/phone chưa
  if (email) {
    const existingEmail = await User.findOne({ email });
    if (existingEmail) return res.status(400).json({ message: 'Email đã tồn tại' });
  }

  if (phone) {
    const existingPhone = await User.findOne({ phone });
    if (existingPhone) return res.status(400).json({ message: 'Số điện thoại đã tồn tại' });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  // Xác minh email (nếu có)
  let emailVerificationToken = undefined;
  let emailVerificationTokenExpires = undefined;

  if (email) {
    emailVerificationToken = crypto.randomBytes(32).toString('hex');
    emailVerificationTokenExpires = Date.now() + 1000 * 60 * 60 * 24;
  }

  await Verification.create({
    email,
    phone,
    password: hashedPassword,
    ...rest,
    emailVerificationToken,
    emailVerificationTokenExpires,
  });

  // Gửi email xác minh nếu có email
  if (email && emailVerificationToken) {
    await sendVerificationEmail(email, emailVerificationToken);
  }

  res.status(200).json({ message: 'Vui lòng xác minh email để hoàn tất đăng ký.' });
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
  if (!user.emailVerified) {
    return res.status(400).json({ message: 'Vui lòng xác minh email trước khi đăng nhập.' });
  }

  // So sánh mật khẩu
  if (!user.password) {
    return res.status(400).json({ message: 'Email hoặc mật khẩu không đúng.' });
  }
  const isMatch = await bcrypt.compare(password, user.password as string);
  if (!isMatch) {
    return res.status(400).json({ message: 'Email hoặc mật khẩu không đúng.' });
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