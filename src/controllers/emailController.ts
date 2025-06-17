import { Request, Response } from 'express';
import { sendVerificationEmail } from '../utils/email';

// Test API: POST /api/test-send-email
export const testSendVerificationEmail = async (req: Request, res: Response) => {
  const { email, token } = req.body;

  if (!email || !token) {
    return res.status(400).json({ message: 'Email và token là bắt buộc.' });
  }

  try {
    await sendVerificationEmail(email, token);
    return res.status(200).json({ message: 'Đã gửi email xác thực thành công.' });
  } catch (error) {
    return res.status(500).json({ message: 'Gửi email thất bại.', error });
  }
};