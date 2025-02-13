//NOTE - transcription & summarization
const express = require("express");
const { getSummaryFromAI } = require("../services/gptService");

const router = express.Router();

// Process Transcribed Text
router.post("/", async (req, res) => {
    try {
        const { transcribedText } = req.body;

        if (!transcribedText) {
            return res.status(400).json({ error: "No transcribed text provided" });
        }

        // Send text to AI model for summarization
        const summary = await getSummaryFromAI(transcribedText);

        res.json({ summary });
    } catch (error) {
        console.error("Error processing text:", error);
        res.status(500).json({ error: "Failed to process text" });
    }
});

module.exports = router;

