import OpenAI from "openai";
import dotenv from "dotenv";
import { fetchAllUsers } from "./services/user.service";

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

const model = process.env.OPENAI_MODEL || "gpt-4o-mini";

export async function askGPT(prompt: string): Promise<string> {
  if (prompt.toLowerCase().includes("trả về danh sách user")) {
    try {
      const users = await fetchAllUsers();
      return JSON.stringify(users, null, 2);
    } catch (error) {
      return "Lỗi khi lấy danh sách user: " + (error as Error).message;
    }
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000); // 10 giây

  try {
    const completion = await openai.chat.completions.create({
      model,
      messages: [
        { role: "system", content: "You are a helpful assistant." },
        { role: "user", content: prompt },
      ],
      temperature: 0.7
    });

    clearTimeout(timeout);

    return completion.choices[0].message?.content || "No response.";
  } catch (error: any) {
    if (error.name === "AbortError") {
      return "Yêu cầu mất quá nhiều thời gian và đã bị hủy (timeout).";
    }
    return `Đã xảy ra lỗi: ${error.message}`;
  }
}

export async function extractSymptoms(userInput: string): Promise<string> {
  const prompt = `
  Bạn là hệ thống trích xuất triệu chứng y tế chuyên nghiệp. 
  Hãy chuyển câu sau thành các triệu chứng y tế chuẩn, ngắn gọn, cách nhau bằng dấu phẩy:

  Ví dụ:
  - Input: "Tôi bị đau đầu và buồn nôn"
  - Output: "đau đầu, buồn nôn"

  - Input: "Em cảm thấy sốt cao, ho khan và đau họng"
  - Output: "sốt cao, ho khan, đau họng"

  -Input: "Mình bị chóng mặt khi đứng lên, choáng nhẹ"
  -Output: "chóng mặt khi đứng lên, choáng nhẹ"

  Input cần xử lý: "${userInput}"

  Chỉ trả về các triệu chứng, không thêm bất kỳ giải thích nào khác.
  `;

  const completion = await openai.chat.completions.create({
    model,
    messages: [
      { role: "system", content: "Bạn là trợ lý trích xuất triệu chứng y tế." },
      { role: "user", content: prompt },
    ],
    temperature: 0.3, // Giảm nhiệt độ để kết quả ổn định hơn
  });

  return completion.choices[0].message?.content?.trim() || "";
}

export async function diagnoseFromSymptoms(symptoms: string): Promise<string> {
  const prompt = `
  Bạn là bác sĩ AI chuyên chẩn đoán bệnh dựa trên triệu chứng. 
  Hãy đưa ra chẩn đoán phù hợp nhất cho các triệu chứng sau:

  Triệu chứng: "${symptoms}"

  Yêu cầu:
  - Chỉ trả về tên bệnh/bệnh lý ngắn gọn (không giải thích)
  - Nếu không chắc chắn, hãy trả về "Không xác định"
  - Sử dụng thuật ngữ y tế chuẩn

  Ví dụ:
  - Triệu chứng: "sốt, đau đầu, buồn nôn" → "cúm"
  - Triệu chứng: "đau bụng, tiêu chảy" → "viêm dạ dày"
  `;

  const completion = await openai.chat.completions.create({
    model,
    messages: [
      { 
        role: "system", 
        content: "Bạn là hệ thống chẩn đoán bệnh tự động. Chỉ trả về tên bệnh duy nhất." 
      },
      { role: "user", content: prompt },
    ],
    temperature: 0.3,
  });

  return completion.choices[0].message?.content?.trim() || "Không xác định";
}
