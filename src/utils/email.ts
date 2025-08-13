import nodemailer from 'nodemailer';

export const sendVerificationEmail = async (to: string, token: string) => {
    const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: parseInt(process.env.EMAIL_PORT || '587', 10),
        secure: false, // true for 465, false for other ports
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
        tls: {
            rejectUnauthorized: false, // Chấp nhận các chứng chỉ không hợp lệ (không an toàn)
        },
    });

    const mailOptions = {
        from: `"Lục Lâm 2" <${process.env.EMAIL_USER}>`, // sender address
        to, // list of receivers
        subject: 'Xác thực tài khoản', // Subject line
        text: `Vui lòng xác thực tài khoản của bạn bằng cách nhấp vào liên kết sau: ${process.env.APP_URL}/verify?token=${token}`, // plain text body
        html: `<p>Vui lòng xác thực tài khoản của bạn bằng cách nhấp vào liên kết sau:</p>
               <a href="${process.env.APP_URL}/verify?token=${token}">Xác thực tài khoản</a>`, // html body
    };
    try {
        await transporter.sendMail(mailOptions);
        console.log('Email sent successfully');
    } catch (error) {
        console.error('Error sending email:', error);
        throw new Error('Failed to send verification email');
    }

}

export const sendEmail = async ( {to, subject, html }:any) => {
  const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to,
    subject,
    html,
  });
};

export const sendEmailOtp = async (to: string, otp: string) => {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT || "587", 10),
      secure: false, // true cho 465, false cho 587
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: `"Support" <${process.env.EMAIL_USER}>`, // bạn bị viết sai EMAIL_USERs -> sửa lại
      to,
      subject: "Mã OTP xác thực",
      text: `Mã OTP của bạn là: ${otp}. Có hiệu lực trong 5 phút.`,
      html: `<p>Mã OTP của bạn là: <b>${otp}</b></p><p>Có hiệu lực trong 5 phút.</p>`,
    };

    const info = await transporter.sendMail(mailOptions);

    // info sẽ chứa thông tin nếu gửi thành công
    console.log("Email sent:", info.messageId);
    console.log("Server response:", info.response);

    return {
      success: true,
      messageId: info.messageId,
      response: info.response,
    };
  } catch (error: any) {
    console.error("Send email error:", error.message);
    return {
      success: false,
      error: error.message,
    };
  }
};
