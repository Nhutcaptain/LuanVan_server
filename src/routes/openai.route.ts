import express, { Request, Response, Router } from 'express';
import { askGPT, extractSymptoms } from '../config/azureOpenaiClient';
import { fetchAllUsers } from '../config/services/user.service';
import { askGoogleAI, convertHealthDataToText, detectIntent, detectIntentHealthReview } from '../config/services/googleAIService';
import { getGenerativeModel } from '../config/googleClient';
import { getHealthStatusForAI } from '../controllers/patient.controller';
import { generateDoctorPrompt } from '../controllers/doctorController';
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
  userChatHistory.set(userId, history.slice(-10)); // giữ 10 tin nhắn gần nhất
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
    if (intent === 'health_review') {
      const latestHealth = await getHealthStatusForAI(userId)

      if (!latestHealth) {
        return res.status(404).json({ error: "Không có dữ liệu sức khỏe" });
      }

      const healthDataText = convertHealthDataToText(latestHealth);

      const healthPrompt = `
Tôi là một bác sĩ. Dưới đây là dữ liệu sức khỏe của bệnh nhân. Hãy phân tích từng chỉ số, nêu rõ những gì bình thường hoặc bất thường, cảnh báo nếu có và đưa ra lời khuyên.

${healthDataText}
      `.trim();

      const model = getGenerativeModel();
      const result = await model.generateContent(healthPrompt);
      const response = await result.response;
      const text = response.text();
      addToUserChatHistory(userId, 'user', 'Phân tích dữ liệu sức khỏe của tôi');
      addToUserChatHistory(userId, 'assistant', text);

      return res.status(200).json({
        healthData: healthDataText,
        response: text,
      });
    } else if(intent !== 'health_review' && intent !== "normal") {
        const prompt = await generateDoctorPrompt(intent);
        if(!prompt) {
          return res.status(404).json({ error: "Không có dữ liệu bác sĩ" });
        }

        const model = getGenerativeModel();
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        addToUserChatHistory(userId, 'user', 'Phân tích dữ liệu sức khỏe của tôi');
        addToUserChatHistory(userId, 'assistant', text);

        return res.status(200).json({
          healthData: prompt,
          response: text,
      });
    } else {
      // Prompt bình thường
      const history = getUserChatHistory(userId);
      history.push({ role: 'user', content: prompt });
      const model = getGenerativeModel();
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const answer = response.text();

      addToUserChatHistory(userId, 'user', prompt);
      addToUserChatHistory(userId, 'assistant', answer);

      return res.status(200).json({ response: answer });
    }
  } catch (error) {
    console.error("Error generating content:", error);
    res.status(500).json({ error: "Failed to generate content" });
  }
});

router.post('/exploreDoctorInfo',geminiController.exploreDoctorInfo);


export default router;
