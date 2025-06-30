import ModelClient, { isUnexpected } from "@azure-rest/ai-inference";
import { AzureKeyCredential } from "@azure/core-auth";
import dotenv from "dotenv";

dotenv.config();

const endpoint = process.env.AZURE_OPENAI_ENDPOINT!;
const apiKey = process.env.AZURE_OPENAI_KEY!;
const model = process.env.AZURE_OPENAI_MODEL || "gpt-4";

const client = ModelClient(endpoint, new AzureKeyCredential(apiKey));


export const adviseFromDiagnosis = async (diagnosis: string): Promise<string> => {
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
        { role: "system", content: "Bạn là bác sĩ AI tư vấn chăm sóc sức khỏe." },
        { role: "user", content: prompt },
      ],
      temperature: 0.4,
      model,
    },
  });

  if (isUnexpected(response)) {
    throw new Error(`Unexpected: ${JSON.stringify(response.body)}`);
  }

  return response.body.choices?.[0]?.message?.content?.trim() || "Không có lời khuyên.";
}

export const generateFullHealthResponse = async (diagnosis: string, symptoms: string): Promise<string> => {
  const prompt = `
  Bạn là bác sĩ AI. Dựa trên triệu chứng của bệnh nhân và chẩn đoán bệnh, hãy phản hồi bằng một đoạn tư vấn tự nhiên, thân thiện.

  Thông tin:
  - Triệu chứng: "${symptoms}"
  - Chẩn đoán: "${diagnosis}"

  Yêu cầu:
  - Mở đầu bằng nhận định: "Bạn có vẻ đang bị..." + tên bệnh
  - Đưa ra lời khuyên về nghỉ ngơi, ăn uống, theo dõi triệu chứng...
  - Văn phong ngắn gọn, dễ hiểu, không vượt quá 6 dòng
  - Không dùng thuật ngữ chuyên môn phức tạp
  - Không đề cập đến thuốc cụ thể

  Ví dụ đầu ra:
  "Bạn có vẻ đang bị cúm mùa. Bạn nên nghỉ ngơi nhiều, uống nước ấm, tránh tiếp xúc với người khác và ăn các món dễ tiêu. Nếu sốt kéo dài hoặc cảm thấy khó thở, hãy đi khám bác sĩ."

  Viết bằng tiếng Việt.
  `;

  const response = await client.path("/chat/completions").post({
    body: {
      messages: [
        { role: "system", content: "Bạn là bác sĩ AI tư vấn sức khỏe thân thiện." },
        { role: "user", content: prompt },
      ],
      temperature: 0.5,
      model,
    },
  });

  if (isUnexpected(response)) {
    throw new Error(`Unexpected: ${JSON.stringify(response.body)}`);
  }

  return response.body.choices?.[0]?.message?.content?.trim() || "Không thể đưa ra lời khuyên lúc này.";
}

export async function getSubSpecialtyFromDiagnosis(diagnosis: string): Promise<string> {
  const prompt = `
Bạn là hệ thống phân loại chuyên khoa y tế. 
Hãy cho biết chuyên khoa phụ trách điều trị chính cho bệnh sau:

Bệnh: "${diagnosis}"

Chỉ trả lời duy nhất một chuyên khoa ngắn gọn, ví dụ: "Nội tim mạch", "Nội hô hấp", "thần kinh", "huyết học", "tai mũi họng", "da liễu", "nội tiết", "cơ xương khớp", v.v.
Không giải thích gì thêm.
`;

  const response = await client.path("/chat/completions").post({
    body: {
      model,
      messages: [
        { role: "system", content: "Bạn là hệ thống phân loại bệnh theo chuyên khoa y tế." },
        { role: "user", content: prompt },
      ],
      temperature: 0.2
    }
  });

  if (isUnexpected(response)) {
    throw new Error(`Lỗi GPT: ${JSON.stringify(response.body)}`);
  }

  const result = response.body.choices?.[0]?.message?.content?.trim();
  return result || "khác";
}