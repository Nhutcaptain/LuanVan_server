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