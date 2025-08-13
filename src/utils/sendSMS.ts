import axios from 'axios';

export async function sendSpeedSms(phone: string, otp: string): Promise<any> {
  const authKey = "464410AchgSD7m689c5e9aP1";

  try {
    const res = await axios.get(
      `https://api.msg91.com/api/v5/otp?authkey=${authKey}&mobile=${phone}&template_id=YOUR_TEMPLATE_ID`
    );
    console.log(res.data);
    return res.data;
  } catch (err: any) {
    console.error("MSG91 Error:", err.response?.data || err.message);
    throw new Error("Gửi OTP thất bại");
  }
}