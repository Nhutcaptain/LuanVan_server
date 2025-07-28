import express, { Request, Response, Router } from 'express';
import { askGPT, extractSymptoms } from '../config/azureOpenaiClient';
import { fetchAllUsers } from '../config/services/user.service';
import { askGoogleAI, convertHealthDataToText, detectIntent, detectIntentHealthReview, getDiagnosisWithAI } from '../config/services/googleAIService';
import { getGenerativeModel } from '../config/googleClient';
import { getHealthStatusForAI } from '../controllers/patient.controller';
import { generateDoctorPrompt, getDoctorsByDepartmentName } from '../controllers/doctorController';
import { handleDiagnosis } from '../controllers/symptom.controller';
import { handleBookingGuide } from '../services/generateAI';
const geminiController = require('../controllers/gemini.controller');

const router: Router = express.Router();

router.post('/ask', async (req: Request, res: Response): Promise<void> => {
  const { message } = req.body;
  if (!message) {
    res.status(400).json({ error: 'Message is required' });
    return;
  }

  try {
    if (message.toLowerCase().includes('trả về danh sách user')) {
      // Lấy danh sách user trực tiếp từ DB
      const users = await fetchAllUsers();
      // Trả về dạng JSON object luôn, không stringify
      res.json({ reply: users });
      return;
    }

    const intentDiagnosis = await detectIntent(message);

    if(intentDiagnosis === 'diagnosis') {
      res.json({
        reply: 'Để có thể hỗ trợ chẩn đoán chính xác, bạn hãy bật chức năng chẩn đoán, khi bật chức năng này, hệ thống sẽ lưu lại triệu chứng và tiến hành phân tích nâng cao'
      });
      return;
    }

    // Các message khác gọi GPT bình thường
    const reply = await askGPT(message);
    res.json({ reply });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to get response from GPT' });
  }
});

const userChatHistory = new Map<string, { role: 'user' | 'assistant', content: string }[]>();

export const addToUserChatHistory = (
  userId: string,
  role: 'user' | 'assistant',
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

    switch (intent) {
      case "health_review":
        const latestHealth = await getHealthStatusForAI(userId);
        if (!latestHealth) {
          return res.status(404).json({ error: "Không có dữ liệu sức khỏe" });
        }

        const healthDataText = convertHealthDataToText(latestHealth);
        const healthPrompt = `
Tôi là một bác sĩ. Dưới đây là dữ liệu sức khỏe của bệnh nhân. Hãy phân tích từng chỉ số, nêu rõ những gì bình thường hoặc bất thường, cảnh báo nếu có và đưa ra lời khuyên.

${healthDataText}`.trim();

        const healthResult = await model.generateContent(healthPrompt);
        const healthText = (await healthResult.response).text();

        await addToUserChatHistory(userId, 'user', 'Phân tích dữ liệu sức khỏe của tôi');
        await addToUserChatHistory(userId, 'assistant', healthText);

        return res.status(200).json({ healthData: healthDataText, response: healthText });

      case "diagnosis":
        const diagnosisResult = await handleDiagnosis(userId, prompt);

        let doctors;
        if (diagnosisResult.department) {
          doctors = await getDoctorsByDepartmentName(diagnosisResult.department);
        }

        await addToUserChatHistory(userId, 'user', prompt);
        await addToUserChatHistory(userId, 'assistant', diagnosisResult.response);

        return res.status(200).json({
          response: diagnosisResult.response,
          doctors
        });
      
      case "booking_guide":
        const guide = await handleBookingGuide(userId, prompt);
        return res.status(200).json({response: guide});

      case "normal":
        // Dùng lịch sử để trả lời thông thường
        const history = getUserChatHistory(userId);
        history.push({ role: 'user', content: prompt });

        const contextPrompt = history.map(msg =>
          `${msg.role === 'user' ? 'Người dùng' : 'Trợ lý'}: ${msg.content}`
        ).join('\n');

        const normalResult = await model.generateContent(contextPrompt);
        const normalText = (await normalResult.response).text();

        await addToUserChatHistory(userId, 'user', prompt);
        await addToUserChatHistory(userId, 'assistant', normalText);

        return res.status(200).json({ response: normalText });

      default:
        // Trường hợp hỏi về bác sĩ cụ thể
        const docPrompt = await generateDoctorPrompt(intent);
        if (!docPrompt) {
          return res.status(404).json({ error: "Không có dữ liệu bác sĩ" });
        }

        const docResult = await model.generateContent(docPrompt);
        const docText = (await docResult.response).text();

        await addToUserChatHistory(userId, 'user', prompt);
        await addToUserChatHistory(userId, 'assistant', docText);

        return res.status(200).json({
          healthData: docPrompt,
          response: docText
        });
    }
  } catch (error) {
    console.error("Error generating content:", error);
    res.status(500).json({ error: "Failed to generate content" });
  }
});


router.post('/exploreDoctorInfo',geminiController.exploreDoctorInfo);


export default router;
