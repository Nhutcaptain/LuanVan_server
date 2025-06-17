import ModelClient, { isUnexpected } from "@azure-rest/ai-inference";
import { AzureKeyCredential } from "@azure/core-auth";
import dotenv from "dotenv";
import { fetchAllUsers } from "./services/user.service";

dotenv.config();

const endpoint = process.env.AZURE_OPENAI_ENDPOINT!;
const apiKey = process.env.AZURE_OPENAI_KEY!;
const model = process.env.AZURE_OPENAI_MODEL || "gpt-4";

const client = ModelClient(endpoint, new AzureKeyCredential(apiKey));

export async function askGPT(prompt: string): Promise<string> {

  if (prompt.toLowerCase().includes("trả về danh sách user")) {
    try {
      const users = await fetchAllUsers();
      return JSON.stringify(users, null, 2);
    } catch (error) {
      return "Lỗi khi lấy danh sách user: " + (error as Error).message;
    }
  }

  const response = await client.path("/chat/completions").post({
    body: {
      messages: [
        { role: "system", content: "You are a helpful assistant." },
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
      model,
    },
    contentType: "application/json",
  });

  if (isUnexpected(response)) {
    throw new Error(`Unexpected: ${JSON.stringify(response.body)}`);
  }

  return response.body.choices?.[0]?.message?.content || "No response.";
}