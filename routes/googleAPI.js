//NOTE - Fetches participant emails
const express = require("express");
const { google } = require("googleapis");
require("dotenv").config();

const router = express.Router();

// OAuth2 Client Setup
const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
);

// Set Refresh Token
oauth2Client.setCredentials({
    refresh_token: process.env.GOOGLE_REFRESH_TOKEN
});

// API to get meeting details
router.get("/:meetingId", async (req, res) => {
    try {
        const { meetingId } = req.params;

        // Authenticate Google Calendar API
        const calendar = google.calendar({ version: "v3", auth: oauth2Client });

        // Fetch meeting details
        const event = await calendar.events.get({
            calendarId: "primary",
            eventId: meetingId,
        });

        const { summary, attendees, start, end } = event.data;

        res.json({
            title: summary,
            participants: attendees ? attendees.map(a => a.email) : [],
            startTime: start.dateTime,
            endTime: end.dateTime,
        });
    } catch (error) {
        console.error("Error fetching meeting details:", error);
        res.status(500).json({ error: "Failed to retrieve meeting details" });
    }
});

module.exports = router;
