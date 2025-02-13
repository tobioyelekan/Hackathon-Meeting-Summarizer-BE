//NOTE - Handles audio upload, retrive meeting ID

const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const { transcribeAudio } = require("../services/whisperService");

const router = express.Router();

// Set up multer for file uploads
const upload = multer({ dest: "uploads/" });

// Upload & Transcribe Audio
router.post("/", upload.single("audio"), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: "No audio file uploaded" });
        }

        const audioPath = req.file.path;
        console.log("Audio file received:", audioPath);

        // Transcribe audio using OpenAI Whisper
        const transcription = await transcribeAudio(audioPath);

        // Delete the file after transcription (optional)
        fs.unlink(audioPath, (err) => {
            if (err) console.error("Error deleting file:", err);
        });

        res.json({ transcription });
    } catch (error) {
        console.error("Error processing audio:", error);
        res.status(500).json({ error: "Failed to transcribe audio" });
    }
});

module.exports = router;
