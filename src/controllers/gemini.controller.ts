import { getGenerativeModel } from '../config/googleClient';

export const exploreDoctorInfo = async(req: any, res: any) => {
    try {
        const { prompt, userId } = req.body;
    
        if (!prompt) {
        return res.status(400).json({ error: "Prompt is required" });
        }
    
        // Call the Gemini model to explore doctor information
        const model = getGenerativeModel();
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const answer = response.text();
    
        // Log the user query and AI response
        console.log(`User Query: ${prompt}`);
        console.log(`AI Response: ${answer}`);
    
        return res.status(200).json({ response: answer });
    } catch (error) {
        console.error("Error exploring doctor info:", error);
        res.status(500).json({ error: "Failed to explore doctor information" });
    }
}