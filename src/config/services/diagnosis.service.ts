import OpenAI from "openai";
import { Department } from "../../models/deparment.model";
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const diagnosisToDepartmentMap: Record<string, string> = {
  "Viêm họng": "Tai Mũi Họng",
  "viêm xoan": "Tai Mũi Họng",
  "Viêm Amidan": "Tai Mũi Họng",
  "Cảm lạnh": "Nội Tổng Quát",
  "Sốt xuất huyết": "Truyền Nhiễm",
  "Viêm phổi": "Hô Hấp",
  "Viêm dạ dày": "Tiêu Hóa",
  "Rối loạn tiền đình": "Thần Kinh",
  "Cúm": "Nội Tổng Quát",
  "Covid-19": "Hô Hấp",
  "Viêm da cơ địa": "Da Liễu",
  "Rối loạn tiêu hoá": "Tiêu hoá",
  "Trào ngược dạ dày": "Tiêu hoá",
};

export const getSpecialtyByDiagnosis = async (diagnosis: string) => {
  try {
    // Lấy danh sách chuyên khoa trong DB
    const departments = await Department.find({});
    if (!departments || departments.length === 0) {
      throw new Error("Không có chuyên khoa nào trong hệ thống");
    }

    // Chuyển danh sách chuyên khoa thành text
    const departmentList = departments.map((d, i) => `${i + 1}. ${d.name}`).join("\n");

    const prompt = `
Bạn là bác sĩ AI. Nhiệm vụ của bạn là lựa chọn chuyên khoa phù hợp nhất cho bệnh nhân dựa trên chẩn đoán.

Chẩn đoán: "${diagnosis}"

Danh sách chuyên khoa hiện có:
${departmentList}

Yêu cầu:
- Trả về tên chuyên khoa duy nhất, chọn sát nhất với chẩn đoán
- Không giải thích dài dòng, chỉ trả về tên chuyên khoa có trong danh sách
`.trim();

    // Gọi GPT
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini", // hoặc gpt-4o nếu cần chính xác hơn
      temperature: 0,
      messages: [
        {
          role: "system",
          content: "Bạn là bác sĩ AI hỗ trợ phân loại chuyên khoa.",
        },
        { role: "user", content: prompt },
      ],
    });

    const specialty = completion.choices[0].message?.content?.trim();

    // Tìm chuyên khoa tương ứng trong DB (để trả về object đầy đủ)
    const matched = departments.find(
      (d) => d.name && d.name.toLowerCase() === specialty?.toLowerCase()
    );

    return matched ? matched.name : "Không xác định";
  } catch (error) {
    console.error("Lỗi getSpecialtyByDiagnosis:", error);
    return "Không thể xác định chuyên khoa";
  }
};
