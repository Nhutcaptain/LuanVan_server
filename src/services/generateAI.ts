import { addToUserChatHistory } from "../routes/openai.route";

export const handleBookingGuide = async (userId: string, prompt: string) => {
  const message = `
Dưới đây là các bước để đặt lịch hẹn khám với bác sĩ tại website:

1. **Tại Trang chủ**, nhấn vào nút **"Đặt lịch khám"**.
2. **Chọn chuyên khoa** và **bác sĩ** mà bạn muốn khám.
3. **Chọn khám ngoài giờ hay trong giờ làm việc**.
4. **Chọn ngày và giờ** phù hợp với lịch trống của bác sĩ.
5. **Nhập các thông tin triệu chứng**.
5. Nhấn **"Xác nhận đặt lịch"** để hoàn tất.

Lưu ý, bạn nên tới đúng giờ đặt lịch, nếu bạn muốn huỷ lịch, hãy **huỷ trước đó một ngày**
`.trim();

  await addToUserChatHistory(userId, 'user', prompt);
  await addToUserChatHistory(userId, 'assistant', message);

  return message;
};