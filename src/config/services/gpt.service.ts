import ModelClient, { isUnexpected } from "@azure-rest/ai-inference";
import { AzureKeyCredential } from "@azure/core-auth";
import dotenv from "dotenv";
import { getNameOfAllSpecialty } from "../../controllers/deparment.controller";

dotenv.config();

const endpoint = process.env.AZURE_OPENAI_ENDPOINT!;
const apiKey = process.env.AZURE_OPENAI_KEY!;
const model = process.env.AZURE_OPENAI_MODEL || "gpt-4";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const client = ModelClient(endpoint, new AzureKeyCredential(apiKey));

export const adviseFromDiagnosis = async (
  diagnosis: string
): Promise<string> => {
  const prompt = `
  Bạn là bác sĩ AI. Dựa trên chẩn đoán bệnh sau, hãy đưa ra lời khuyên chăm sóc, nghỉ ngơi, ăn uống và phục hồi sức khoẻ phù hợp.

  Chẩn đoán: Có vẻ bạn đang bị "${diagnosis}"

  Yêu cầu:
  - Trình bày bằng tiếng Việt
  - Dễ hiểu, súc tích, khoảng 3–6 dòng
  - Không đề cập đến thuốc nếu không cần thiết
  - Nếu là bệnh nhẹ, có thể nói bệnh nhân nên nghỉ ngơi và theo dõi
  - Nếu là bệnh nghiêm trọng, yêu cầu bệnh nhân nên đến gặp bác sĩ.

  Ví dụ:
  - Chẩn đoán: "cúm mùa"
    → Lời khuyên: Nghỉ ngơi đầy đủ, uống nhiều nước ấm, ăn thức ăn dễ tiêu và tránh gió lạnh. Theo dõi nhiệt độ và đến bác sĩ nếu sốt cao kéo dài.

  - Chẩn đoán: "viêm phổi"
    → Lời khuyên: Cần nghỉ ngơi hoàn toàn, uống đủ nước, tránh gió và cần tái khám nếu khó thở tăng. Nên theo dõi sát triệu chứng.

  Trả lời ngắn gọn, rõ ràng.
  `;

  const response = await client.path("/chat/completions").post({
    body: {
      messages: [
        {
          role: "system",
          content: "Bạn là bác sĩ AI tư vấn chăm sóc sức khỏe.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.4,
      model,
    },
  });

  if (isUnexpected(response)) {
    throw new Error(`Unexpected: ${JSON.stringify(response.body)}`);
  }

  return (
    response.body.choices?.[0]?.message?.content?.trim() ||
    "Không có lời khuyên."
  );
};

export const generateFullHealthResponse = async (
  diagnoses: { diagnosis: string; probability?: number }[], // nhận object từ model
  symptoms: string
): Promise<string> => {
  // Lọc bỏ trùng lặp diagnosis
  const uniqueDiagnoses = Array.from(
    new Set(diagnoses.map((d) => d.diagnosis.trim().toLowerCase()))
  ).map(
    (name) => diagnoses.find((d) => d.diagnosis.trim().toLowerCase() === name)?.diagnosis || name
  );

  const prompt = `
Bạn là bác sĩ AI. Dựa trên danh sách các chẩn đoán đã được đưa ra, hãy phản hồi bằng một đoạn tư vấn thân thiện, sử dụng **Markdown**.

Thông tin:
- Triệu chứng bệnh nhân mô tả: "${symptoms}"
- Các chẩn đoán từ hệ thống:
${uniqueDiagnoses.map((d, i) => `${i + 1}. ${d}`).join("\n")}

Yêu cầu:
- Mở đầu bằng: "**Dựa trên các chẩn đoán, có thể bạn đang gặp một trong các tình trạng sau:**"
- Với mỗi chẩn đoán:
  - Trình bày dưới dạng danh sách đánh số
  - Gồm chẩn đoán (bôi đậm), triệu chứng thường gặp (ngắn gọn, dễ hiểu)
  - Lời khuyên chăm sóc, nghỉ ngơi, theo dõi tại nhà

- Kết thúc bằng:
  👉 Nếu tình trạng không cải thiện hoặc có dấu hiệu nặng, bạn nên gặp bác sĩ để được khám trực tiếp.

- Không nêu thuốc
- Không quá 8 dòng
- Viết bằng **tiếng Việt**, dùng **Markdown**
`.trim();

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.5,
      messages: [
        {
          role: "system",
          content: "Bạn là bác sĩ AI tư vấn sức khỏe thân thiện.",
        },
        { role: "user", content: prompt },
      ],
    });

    return (
      completion.choices[0].message?.content?.trim() ||
      "Không thể đưa ra lời khuyên lúc này."
    );
  } catch (error) {
    console.error("Lỗi GPT:", error);
    return "Không thể đưa ra lời khuyên lúc này.";
  }
};


export async function getSubSpecialtyFromDiagnosis(
  diagnosis: string
): Promise<string> {
  // You need to provide the required argument, e.g., 'null' or a proper response object if available
  const specialtiesRaw = await getNameOfAllSpecialty();
  const specialties: string[] = (specialtiesRaw ?? []).map((s: any) => s.name);
  const listText = specialties.map((s, i) => `${i + 1}. ${s}`).join("\n");
  const prompt = `
Bạn là hệ thống phân loại chuyên khoa y tế.

Dưới đây là danh sách các chuyên khoa có sẵn trong bệnh viện:
${listText}

Hãy chọn duy nhất **một chuyên khoa phù hợp nhất** trong danh sách trên để phụ trách điều trị cho bệnh sau:

Bệnh: "${diagnosis}"

Chỉ trả lời **chính xác tên chuyên khoa trong danh sách trên**, không giải thích gì thêm.
Nếu không tìm thấy chuyên khoa phù hợp, trả lời: "khác".
`;

  const response = await client.path("/chat/completions").post({
    body: {
      model,
      messages: [
        {
          role: "system",
          content: "Bạn là hệ thống phân loại bệnh theo chuyên khoa y tế.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.2,
    },
  });

  if (isUnexpected(response)) {
    throw new Error(`Lỗi GPT: ${JSON.stringify(response.body)}`);
  }

  const result = response.body.choices?.[0]?.message?.content?.trim();
  return result || "khác";
}

export const adviseForHealthStatus = async (
  healthStatusData: any
): Promise<string> => {
  const {
    weight,
    height,
    heartRate,
    bloodPressure,
    diabetes,
    kidneyFunction,
    liverFunction,
    cholesterol,
    glucose,
  } = healthStatusData;

  const diagnosisSummary = `
Dữ liệu sức khỏe bệnh nhân:
- Cân nặng: ${weight?.value}kg, Chiều cao: ${height?.value}cm
- Huyết áp: ${bloodPressure?.value}, Nhịp tim: ${heartRate?.value} bpm
- Tiểu đường: ${diabetes?.value}
- Chức năng thận: Creatinine ${kidneyFunction?.creatinine?.value}, Urea ${kidneyFunction?.urea?.value}, GFR ${kidneyFunction?.gfr?.value}
- Chức năng gan: ALT ${liverFunction?.alt?.value}, AST ${liverFunction?.ast?.value}, Bilirubin ${liverFunction?.bilirubin?.value}
- Cholesterol: Tổng ${cholesterol?.total?.value}, HDL ${cholesterol?.hdl?.value}, LDL ${cholesterol?.ldl?.value}, Triglycerides ${cholesterol?.triglycerides?.value}
- Đường huyết: Fasting Glucose ${glucose?.fasting?.value}, HbA1c ${glucose?.hba1c?.value}
`;

  const prompt = `
Bạn là bác sĩ AI. Dựa trên các chỉ số sau, hãy đưa ra lời khuyên chăm sóc, nghỉ ngơi, ăn uống và phục hồi sức khoẻ phù hợp.

${diagnosisSummary}

Yêu cầu:
- Trình bày bằng tiếng Việt
- Dễ hiểu, súc tích, khoảng 3–6 dòng
- Không đề cập đến thuốc nếu không cần thiết
- Nếu là bệnh nhẹ, có thể nói bệnh nhân nên nghỉ ngơi và theo dõi
- Nếu là bệnh nghiêm trọng, yêu cầu bệnh nhân nên đến gặp bác sĩ.

Trả lời ngắn gọn, rõ ràng.
`;

  const response = await client.path("/chat/completions").post({
    body: {
      messages: [
        {
          role: "system",
          content: "Bạn là bác sĩ AI tư vấn chăm sóc sức khỏe.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.4,
      model,
    },
  });

  if (isUnexpected(response)) {
    throw new Error(`Unexpected: ${JSON.stringify(response.body)}`);
  }

  return (
    response.body.choices?.[0]?.message?.content?.trim() ||
    "Không có lời khuyên."
  );
};
