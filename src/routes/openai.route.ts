import express, { Request, Response, Router } from 'express';
import { askGPT, extractSymptoms } from '../config/azureOpenaiClient';
import { fetchAllUsers } from '../config/services/user.service';
import { askGoogleAI, detectIntent } from '../config/services/googleAIService';
import { getGenerativeModel } from '../config/googleClient';

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

    const intent = await detectIntent(message);

    if(intent === 'diagnosis') {
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

router.post("/generate", async (req: any, res: any) => {
  try {
    const { prompt } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required" });
    }

    const model = getGenerativeModel();
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    res.json({ response: text });
  } catch (error) {
    console.error("Error generating content:", error);
    res.status(500).json({ error: "Failed to generate content" });
  }
});


export default router;