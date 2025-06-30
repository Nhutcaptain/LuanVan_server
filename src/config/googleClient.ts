import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export const getGenerativeModel = (modelName: string = "gemini-2.0-flash") => {
  return genAI.getGenerativeModel({ model: modelName });
};