const  { GoogleGenerativeAI } = require('@google/generative-ai');
const dotenv = require("dotenv");

dotenv.config();

const API_KEY = process.env.GOOGLE_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(API_KEY);

const summarizeText = async (transcript) => {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
        const prompt = `Summarize the following transcript concisely:\n\n"${transcript}"`;
    
        const result = await model.generateContent(prompt);
        const response = await result.response;
        
        return response.text();
      } catch (error) {
        console.error("Summarization Error:", error);
        return "Failed to summarize.";
      }
}

module.exports = summarizeText;