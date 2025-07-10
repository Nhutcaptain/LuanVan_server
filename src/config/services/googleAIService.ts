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

export const detectIntentHealthReview = async (userInput: string) => {
  const model = getGenerativeModel();

  const prompt = `
Bạn là một AI chuyên phân loại ý định người dùng.

Hãy đọc câu sau và xác định xem người dùng có đang muốn đánh giá tình trạng sức khoẻ tổng thể hay không, hoặc nếu người dùng muốn hỏi thông tin 
về một bác sĩ nào đó,
Ví dụ câu đó là: chào bạn, bạn có thể giúp mình đánh giá sức khoẻ tổng quát được không | các chỉ số sức khoẻ của tôi thế nào
Hay câu ví dụ: Hãy cho tôi biết thông tin về bác sĩ Lục Tỷ | hãy giới thiệu cho tôi về bác sĩ Lý Huỳnh
Nếu là hỏi bác sĩ thì trả lời về name-slug của bác sĩ, ví dụ: Hãy cho tôi biết thông tin của bác sĩ Lục Tỷ, thì trả lời: "bs-luc-ty"

- Nếu là hỏi về tình trạng sức khoẻ, trả lời duy nhất: "health_review"
- Nếu không, trả lời duy nhất: "normal"

Câu: "${userInput}"
  `.trim();

  const result = await model.generateContent(prompt);
  const response = await result.response;
  const text = response.text().trim().toLowerCase();

  return text;
};

export const convertHealthDataToText = (data: any): string => {
  const extract = (obj: any, label: string) => {
    return obj?.value != null ? `${label}: ${obj.value} (${formatDate(obj.testedAt)})` : '';
  };

  const formatDate = (d: Date) => d ? new Date(d).toLocaleDateString() : '';

  return `
- Cân nặng: ${extract(data.weight, 'kg')}
- Chiều cao: ${extract(data.height, 'cm')}
- Nhịp tim: ${extract(data.heartRate, 'lần/phút')}
- Huyết áp: ${extract(data.bloodPressure, '')}
- Tiểu đường: ${extract(data.diabetes, '')}
- Nhóm máu: ${extract(data.blood, '')}

Chức năng thận:
- Creatinine: ${extract(data.kidneyFunction?.creatinine, 'mg/dL')}
- Urea: ${extract(data.kidneyFunction?.urea, 'mg/dL')}
- GFR: ${extract(data.kidneyFunction?.gfr, 'ml/phút/1.73m2')}

Chức năng gan:
- ALT: ${extract(data.liverFunction?.alt, 'U/L')}
- AST: ${extract(data.liverFunction?.ast, 'U/L')}
- Bilirubin: ${extract(data.liverFunction?.bilirubin, 'mg/dL')}

Mỡ máu:
- Tổng cholesterol: ${extract(data.cholesterol?.total, 'mg/dL')}
- HDL: ${extract(data.cholesterol?.hdl, 'mg/dL')}
- LDL: ${extract(data.cholesterol?.ldl, 'mg/dL')}
- Triglycerides: ${extract(data.cholesterol?.triglycerides, 'mg/dL')}

Đường huyết:
- Đường huyết đói: ${extract(data.glucose?.fasting, 'mg/dL')}
- HbA1c: ${extract(data.glucose?.hba1c, '%')}

Ghi chú: ${data.note || 'Không có'}
`;
}