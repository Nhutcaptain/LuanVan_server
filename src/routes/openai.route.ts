import express, { Request, Response, Router } from "express";
import { askGPT, extractSymptoms } from "../config/azureOpenaiClient";
import { fetchAllUsers } from "../config/services/user.service";
import {
  convertHealthDataToText,
  detectIntent,
  detectIntentHealthReview,
  getDiagnosisWithAI,
} from "../config/services/googleAIService";
import { getGenerativeModel } from "../config/googleClient";
import { getHealthStatusForAI } from "../controllers/patient.controller";
import {
  generateDoctorPrompt,
  getDoctorsByDepartmentName,
} from "../controllers/doctorController";
import { handleDiagnosis } from "../controllers/symptom.controller";
import { handleBookingGuide } from "../services/generateAI";
import OpenAI from "openai";
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});
const geminiController = require("../controllers/gemini.controller");

const router: Router = express.Router();

router.post("/ask", async (req: Request, res: Response): Promise<void> => {
  const { message } = req.body;
  if (!message) {
    res.status(400).json({ error: "Message is required" });
    return;
  }

  try {
    if (message.toLowerCase().includes("trả về danh sách user")) {
      // Lấy danh sách user trực tiếp từ DB
      const users = await fetchAllUsers();
      // Trả về dạng JSON object luôn, không stringify
      res.json({ reply: users });
      return;
    }

    const intentDiagnosis = await detectIntent(message);

    if (intentDiagnosis === "diagnosis") {
      res.json({
        reply:
          "Để có thể hỗ trợ chẩn đoán chính xác, bạn hãy bật chức năng chẩn đoán, khi bật chức năng này, hệ thống sẽ lưu lại triệu chứng và tiến hành phân tích nâng cao",
      });
      return;
    }

    // Các message khác gọi GPT bình thường
    const reply = await askGPT(message);
    res.json({ reply });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to get response from GPT" });
  }
});

const userChatHistory = new Map<
  string,
  { role: "user" | "assistant"; content: string }[]
>();

export const addToUserChatHistory = (
  userId: string,
  role: "user" | "assistant",
  content: string
): void => {
  const history = userChatHistory.get(userId) || [];
  history.push({ role, content });
  userChatHistory.set(userId, history.slice(-50)); // giữ 10 tin nhắn gần nhất
};

export const getUserChatHistory = (userId: string) => {
  return userChatHistory.get(userId) || [];
};

router.post("/generate", async (req: any, res: any) => {
  try {
    const { prompt, userId } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required" });
    }

    const intent = await detectIntentHealthReview(prompt);
    const model = getGenerativeModel();
    console.log("Detected intent:", intent);

    switch (intent) {
      case "health_review":
        try {
          const latestHealth = await getHealthStatusForAI(userId);
          if (!latestHealth) {
            return res.status(404).json({ error: "Không có dữ liệu sức khỏe" });
          }

          const healthDataText = convertHealthDataToText(latestHealth);
          const healthPrompt = `
Tôi là một bác sĩ. Dưới đây là dữ liệu sức khỏe của bệnh nhân. Hãy phân tích từng chỉ số, nêu rõ những gì bình thường hoặc bất thường, cảnh báo nếu có và đưa ra lời khuyên.

${healthDataText}`.trim();

          // gọi GPT API
          const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini", // hoặc gpt-4o / gpt-4-turbo tuỳ nhu cầu
            messages: [
              {
                role: "system",
                content: "Bạn là một bác sĩ AI phân tích dữ liệu sức khỏe.",
              },
              {
                role: "user",
                content: healthPrompt,
              },
            ],
          });

          const healthText =
            completion.choices[0].message?.content || "Không có phản hồi";

          await addToUserChatHistory(
            userId,
            "user",
            "Phân tích dữ liệu sức khỏe của tôi"
          );
          await addToUserChatHistory(userId, "assistant", healthText);

          return res.status(200).json({
            healthData: healthDataText,
            response: healthText,
          });
        } catch (error) {
          console.error("Lỗi khi gọi GPT API:", error);
          return res
            .status(500)
            .json({ error: "Lỗi khi phân tích dữ liệu sức khỏe" });
        }

      case "diagnosis":
        const diagnosisResult = await handleDiagnosis(userId, prompt);

        let doctors;
        if (diagnosisResult.department) {
          console.log("Chuyên khoa:", diagnosisResult.department);
          doctors = await getDoctorsByDepartmentName(
            diagnosisResult.department
          );
        }

        await addToUserChatHistory(userId, "user", prompt);
        await addToUserChatHistory(
          userId,
          "assistant",
          diagnosisResult.response
        );

        return res.status(200).json({
          response: diagnosisResult.response,
          doctors,
        });

      case "booking_guide":
        const guide = await handleBookingGuide(userId, prompt);
        return res.status(200).json({ response: guide });

      case "normal":
        // Dùng lịch sử để trả lời thông thường
        console.log("Normal messages:");
        const history = getUserChatHistory(userId) || [];
        history.push({ role: "user", content: prompt });

        const messages = [
          { role: "system", content: "Bạn là một trợ lý hữu ích." },
          ...history.map((msg: any) => ({
            role: msg.role,
            content: msg.content,
          })),
        ];

        try {
          const completion = await openai.chat.completions.create({
            model: process.env.OPENAI_MODEL || "gpt-4o-mini",
            messages,
            temperature: 0.7,
          });

          const normalText =
            completion.choices[0].message?.content || "Không có phản hồi.";
          console.log("Normal response:", completion);

          await addToUserChatHistory(userId, "user", prompt);
          await addToUserChatHistory(userId, "assistant", normalText);

          return res.status(200).json({ response: normalText });
        } catch (error: any) {
          console.error("OpenAI error:", error.response?.data || error.message);
          return res.status(500).json({ error: "Lỗi khi gọi OpenAI API" });
        }
      default:
        // Trường hợp hỏi về bác sĩ cụ thể
        const docPrompt = await generateDoctorPrompt(intent);
        if (!docPrompt) {
          return res.status(404).json({ error: "Không có dữ liệu bác sĩ" });
        }

        const docResult = await model.generateContent(docPrompt);
        const docText = (await docResult.response).text();

        await addToUserChatHistory(userId, "user", prompt);
        await addToUserChatHistory(userId, "assistant", docText);

        return res.status(200).json({
          healthData: docPrompt,
          response: docText,
        });
    }
  } catch (error) {
    console.error("Error generating content:", error);
    res.status(500).json({ error: "Failed to generate content" });
  }
});

router.post("/exploreDoctorInfo", geminiController.exploreDoctorInfo);

export default router;
