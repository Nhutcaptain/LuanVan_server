import { GoogleGenerativeAI } from "@google/generative-ai";
import { getGenerativeModel } from "../googleClient";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({ model: "gemini-pro" });

export const askGoogleAI = async(req: any, res: any) => {
   const { prompt } = req.body;
  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    res.json({ reply: text });
  } catch (err) {
    console.error("Gemini API error:", err);
    res.status(500).json({ error: "Something went wrong with Gemini API" });
  }
}

export const detectIntent = async(userInput: string) => {
  const model = getGenerativeModel();

  const prompt = `
    Bạn là AI phân loại ý định người dùng.

    Hãy đọc câu sau và xác định xem nó có phải là yêu cầu chẩn đoán bệnh không.

    Nếu có, trả lời duy nhất: "diagnosis"
    Nếu không, trả lời duy nhất: "normal"

    Câu: "${userInput}"
    `.trim();

  const result = await model.generateContent(prompt);
  const response = await result.response;
  const text = response.text().trim().toLowerCase();

  return text === 'diagnosis' ? 'diagnosis' : 'normal';
}