import { GoogleGenerativeAI } from "@google/generative-ai";
import { getGenerativeModel } from "../googleClient";
import OpenAI from "openai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
// const model = genAI.getGenerativeModel({ model: "gemini-pro" });

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

const model = process.env.OPENAI_MODEL || "gpt-4o-mini";

// export const askGoogleAI = async (req: any, res: any) => {
//   const { prompt } = req.body;
//   try {
//     const result = await model.generateContent(prompt);
//     const response = await result.response;
//     const text = response.text();
//     res.json({ reply: text });
//   } catch (err) {
//     console.error("Gemini API error:", err);
//     res.status(500).json({ error: "Something went wrong with Gemini API" });
//   }
// };

export const detectIntent = async (userInput: string) => {
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

  return text === "diagnosis" ? "diagnosis" : "normal";
};

export const detectIntentHealthReview = async (userInput: string) => {
  const prompt = `
Bạn là một AI chuyên phân loại ý định người dùng. Hãy đọc câu sau và xác định xem người dùng muốn gì:

1. Nếu người dùng hỏi về việc **đánh giá sức khoẻ tổng thể**, trả lời: "health_review"
   Ví dụ: "Hãy đánh giá tình trạng sức khỏe của tôi", "Các chỉ số của tôi có ổn không?"

2. Nếu người dùng **yêu cầu chẩn đoán bệnh**, ví dụ: "Tôi bị đau đầu và buồn nôn", trả lời: "diagnosis"

3. Nếu người dùng hỏi thông tin về một bác sĩ cụ thể, ví dụ: "Hãy cho tôi biết thông tin về bác sĩ Lý Huỳnh", thì trả về slug của bác sĩ, ví dụ: "bs-ly-huynh"

4. Nếu người dùng hỏi **hướng dẫn cách đặt lịch khám**, ví dụ: "Làm sao để đặt lịch với bác sĩ", "Các bước đặt lịch hẹn", trả về: "booking_guide"

5. Nếu không rơi vào các trường hợp trên, trả về: "normal"

Câu: "${userInput}"
  `.trim();

  const completion = await openai.chat.completions.create({
    model,
    messages: [
      { role: "system", content: "Bạn là AI phân loại ý định người dùng." },
      { role: "user", content: prompt },
    ],
    temperature: 0, // để kết quả ổn định, không random
  });

  const raw = completion.choices[0].message?.content?.trim().toLowerCase() || "normal";
  const text = raw.trim().toLowerCase().replace(/^"|"$/g, ""); 

  return text;
};


const diagnosisToDepartmentMap: Record<string, string> = {
  "Viêm họng": "Tai Mũi Họng",
  "Viêm Amidan": "Tai Mũi Họng",
  "Cảm lạnh": "Nội Tổng Quát",
  "Sốt xuất huyết": "Truyền Nhiễm",
  "Viêm phổi": "Hô Hấp",
  "Viêm dạ dày": "Tiêu Hóa",
  "Rối loạn tiền đình": "Thần Kinh",
  "Cúm": "Nội Tổng Quát",
  "Covid-19": "Hô Hấp",
  "Viêm da cơ địa": "Da Liễu",
};

export const getDiagnosisWithAI = async (symptoms: string) => {
  const model = getGenerativeModel();

  const prompt = `
Bạn là một AI bác sĩ chuyên chẩn đoán bệnh.

Dựa trên các triệu chứng sau, hãy đưa ra chẩn đoán có thể xảy ra và lời khuyên ban đầu:

Triệu chứng: ${symptoms}

Vui lòng cung cấp thông tin theo định dạng Markdown, bao gồm:
- **Chẩn đoán có thể xảy ra:** Liệt kê các bệnh lý có khả năng cao nhất.
- **Giải thích ngắn gọn:** Nêu lý do cho từng chẩn đoán.
- **Lời khuyên ban đầu:** Các bước nên làm tiếp theo.
- **Lưu ý quan trọng:** Nhắc nhở người dùng rằng đây chỉ là chẩn đoán sơ bộ và không thay thế cho lời khuyên y tế chuyên nghiệp.
  `.trim();

  const result = await model.generateContent(prompt);
  const response = await result.response;
  const markdownText = response.text();

  // Tách các chẩn đoán từ markdown, ví dụ dòng bắt đầu bằng số thứ tự
  const diagnosisMatches = markdownText.match(/^1\.\s\*\*(.+?)\*\*/gm);
  const diagnosisList = diagnosisMatches?.map(line => line.replace(/^1\.\s\*\*|\*\*/g, '').trim()) || [];

  // Map sang danh sách các khoa
  const departments = diagnosisList.map(diagnosis => {
    return diagnosisToDepartmentMap[diagnosis] || "Chưa xác định";
  });

  return {
    markdown: markdownText,
    diagnosisList,
    departments,
  };
};


export const convertHealthDataToText = (data: any): string => {
  const extract = (obj: any, label: string) => {
    return obj?.value != null
      ? `${label}: ${obj.value} (${formatDate(obj.testedAt)})`
      : "";
  };

  const formatDate = (d: Date) => (d ? new Date(d).toLocaleDateString() : "");

  return `
- Cân nặng: ${extract(data.weight, "kg")}
- Chiều cao: ${extract(data.height, "cm")}
- Nhịp tim: ${extract(data.heartRate, "lần/phút")}
- Huyết áp: ${extract(data.bloodPressure, "")}
- Tiểu đường: ${extract(data.diabetes, "")}
- Nhóm máu: ${extract(data.blood, "")}

Chức năng thận:
- Creatinine: ${extract(data.kidneyFunction?.creatinine, "mg/dL")}
- Urea: ${extract(data.kidneyFunction?.urea, "mg/dL")}
- GFR: ${extract(data.kidneyFunction?.gfr, "ml/phút/1.73m2")}

Chức năng gan:
- ALT: ${extract(data.liverFunction?.alt, "U/L")}
- AST: ${extract(data.liverFunction?.ast, "U/L")}
- Bilirubin: ${extract(data.liverFunction?.bilirubin, "mg/dL")}

Mỡ máu:
- Tổng cholesterol: ${extract(data.cholesterol?.total, "mg/dL")}
- HDL: ${extract(data.cholesterol?.hdl, "mg/dL")}
- LDL: ${extract(data.cholesterol?.ldl, "mg/dL")}
- Triglycerides: ${extract(data.cholesterol?.triglycerides, "mg/dL")}

Đường huyết:
- Đường huyết đói: ${extract(data.glucose?.fasting, "mg/dL")}
- HbA1c: ${extract(data.glucose?.hba1c, "%")}

Ghi chú: ${data.note || "Không có"}
`;
};
