//NOTE - Calls Whisper API for transcription

const fs = require("fs");
const { OpenAI } = require("openai");
require("dotenv").config();

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

async function transcribeAudio(filePath) {
    try {
        const fileStream = fs.createReadStream(filePath);

        const response = await openai.audio.transcriptions.create({
            file: fileStream,
            model: "whisper-1",
            language: "en", // Adjust based on user needs
        });

        return response.text; // Return the transcribed text
    } catch (error) {
        console.error("Whisper transcription error:", error);
        return "Transcription failed.";
    }
}

module.exports = { transcribeAudio };
