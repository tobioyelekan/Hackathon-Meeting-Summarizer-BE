//NOTE - Calls OpenAI API for summarization

const { OpenAI } = require("openai");
require("dotenv").config();

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

async function getSummaryFromAI(text) {
    try {
        const response = await openai.chat.completions.create({
            model: "gpt-4", // Use GPT-4 or GPT-3.5
            messages: [
                { role: "system", content: "You are an AI that summarizes meetings concisely." },
                { role: "user", content: `Summarize this meeting transcript:\n${text}` }
            ],
            temperature: 0.5,
        });

        return response.choices[0].message.content.trim();
    } catch (error) {
        console.error("Error generating summary:", error);
        return "Failed to generate summary.";
    }
}

module.exports = { getSummaryFromAI };
