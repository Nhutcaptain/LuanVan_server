import { Request, Response } from 'express';
import path from 'path';
import { createObjectCsvWriter } from 'csv-writer';
import { exec } from 'child_process';
import fs from 'fs';
import { diagnoseFromSymptoms, extractSymptoms } from '../config/azureOpenaiClient';
import { adviseFromDiagnosis, generateFullHealthResponse } from '../config/services/gpt.service';
import { getSuggestDoctors } from './doctorController';
import { addToUserChatHistory } from '../routes/openai.route';
import { diagnosisToDepartmentMap, getSpecialtyByDiagnosis } from '../config/services/diagnosis.service';

// 📁 Đường dẫn đến thư mục chatbot
const baseDir = path.join(__dirname, '..', '..', '..', 'chatbot');
const filePath = path.join(baseDir, 'data.csv');
const trainPath = path.join(baseDir, 'train.py');
const pythonPath = path.join(baseDir, 'venv', 'Scripts', 'python.exe');

// Cấu hình ghi file CSV
const csvWriter = createObjectCsvWriter({
  path: filePath,
  header: [
    { id: 'symptoms', title: 'symptoms' },
    { id: 'diagnosis', title: 'diagnosis' }
  ],
  append: true,
  alwaysQuote: true
});

//  Hàm chuẩn hoá chuỗi: xoá khoảng trắng thừa
const cleanText = (text: string): string => {
  return text.trim().replace(/\s+/g, ' ').toLowerCase();
};

export const addSymptom = async (req: Request, res: Response) => {
  let { symptoms, diagnosis } = req.body;

  if (!symptoms || !diagnosis) {
    return res.status(400).json({ message: 'Thiếu triệu chứng hoặc chẩn đoán.' });
  }

  // Chuẩn hoá đầu vào
  symptoms = cleanText(symptoms);
  diagnosis = cleanText(diagnosis);

  // Kiểm tra tệp tồn tại
  if (!fs.existsSync(filePath)) {
    return res.status(500).json({ message: `Không tìm thấy file CSV: ${filePath}` });
  }

  if (!fs.existsSync(pythonPath)) {
    return res.status(500).json({ message: `Không tìm thấy Python trong môi trường ảo: ${pythonPath}` });
  }

  // Kiểm tra xem dòng đã tồn tại chưa (tránh ghi trùng)
  const existingData = fs.readFileSync(filePath, 'utf-8').split('\n').map(line => line.trim());
  const newLine = `"${symptoms}","${diagnosis}"`;

  if (existingData.includes(newLine)) {
    return res.status(200).json({ message: 'Triệu chứng và chẩn đoán đã tồn tại trong dữ liệu.' });
  }

  try {
    // Ghi vào CSV
    await csvWriter.writeRecords([{ symptoms, diagnosis }]);
    console.log('Ghi vào CSV thành công.');

    // Gọi train.py bằng Python trong môi trường ảo
    exec(`"${pythonPath}" "${trainPath}"`, (err, stdout, stderr) => {
      if (err) {
        console.error('Lỗi khi train:', err);
        console.error('stderr:', stderr);
        return res.status(500).json({ message: ' Đã ghi dữ liệu nhưng train mô hình thất bại.' });
      }

      console.log('Train mô hình thành công:\n', stdout);
      return res.json({ message: 'Ghi dữ liệu và train lại mô hình thành công.' });
    });
  } catch (error) {
    console.error('Lỗi ghi CSV:', error);
    return res.status(500).json({ message: 'Ghi dữ liệu thất bại.' });
  }
};

const userSymptomsMap = new Map<string, string[]>(); 

const updateUserSymptoms = (userId: string, newSymptoms: string): string[] => {
  const oldSymptoms = userSymptomsMap.get(userId) || [];
  const newList = newSymptoms.split(",").map(s => s.trim()).filter(Boolean);
  const combined = [...oldSymptoms, ...newList];
  const unique = [...new Set(combined)];
  userSymptomsMap.set(userId, unique);
  return unique;
}

export const getDiagnosis = async (req: Request, res: Response) => {
  try {
    const { userId, description } = req.body;

    if (!userId || !description) {
      return res.status(400).json({ error: "Thiếu userId hoặc description" });
    }

    // 1. Trích xuất triệu chứng từ mô tả
    const extracted = await extractSymptoms(description);

    // 2. Gộp triệu chứng cũ và mới
    const updatedSymptoms = await updateUserSymptoms(userId, extracted);
    const normalized = updatedSymptoms.join(", ");

    // 3. Gọi ML model
    const mlResponse = await fetch('http://localhost:5001/predict', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ symptoms: normalized })
    });

    const mlResult = await mlResponse.json();
    const mlDiagnosis = mlResult.prediction?.trim().toLowerCase();

    // 6. Tạo phản hồi tự nhiên
    const fullResponse = await generateFullHealthResponse(mlDiagnosis, normalized);
    addToUserChatHistory(userId, 'assistant',fullResponse )
    const doctors = await getSuggestDoctors(mlDiagnosis);

    return res.json({
      response: fullResponse,
      diagnosis: mlDiagnosis,
      source: 'ml-model',
      symptoms: updatedSymptoms,
      comparison: {
        ml: mlDiagnosis,
      },
      doctors: doctors
    });

  } catch (error) {
    console.error('Lỗi chẩn đoán:', error);
    return res.status(500).json({ error: 'Lỗi hệ thống' });
  }
};

export const handleDiagnosis = async (userId: string, description: string) => {
  if (!userId || !description) {
    throw new Error("Thiếu userId hoặc description");
  }

  // 1. Trích xuất triệu chứng từ mô tả
  const extracted = await extractSymptoms(description);
  console.log(extracted);

  // 2. Gộp triệu chứng cũ và mới
  const updatedSymptoms = await updateUserSymptoms(userId, extracted);
  const normalized = updatedSymptoms.join(", ");

  // 3. Gọi ML model
  const mlResponse = await fetch('http://localhost:5001/predict', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ symptoms: extracted })
  });

  const mlResult = await mlResponse.json();
   const predictions = mlResult?.predictions || [];
   console.log("Các bệnh được chẩn đoán",predictions)

    if (predictions.length === 0) {
      return {
        response: "Tôi chưa thể đưa ra chẩn đoán với triệu chứng bạn cung cấp.",
        diagnosis: null,
        source: 'ml-model',
        symptoms: updatedSymptoms,
        comparison: {},
        doctors: []
      };
    }

    const topPrediction = predictions[0];
    const topDiagnosis = topPrediction.diagnosis.toLowerCase();

  // 4. Tạo phản hồi tự nhiên
  const fullResponse = await generateFullHealthResponse(predictions, normalized);
  const department = await getSpecialtyByDiagnosis(topDiagnosis);

  return {
    response: fullResponse,
    diagnosis: topDiagnosis,
    department,
    source: 'ml-model',
    symptoms: updatedSymptoms,
    comparison: {
      ml: topDiagnosis,
    },

  };
};

