const express = require('express');
const router = express.Router();
const { google } = require('googleapis');
const Meeting = require('../models/Meeting');
const {sendEmail} = require('../utils/emailService');
require('dotenv').config();

const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
);

// Route to submit a new meeting
router.post('/', async (req, res) => {
    try {
        const { meetLink, userEmail, meetingName } = req.body;

        if (!meetLink || !userEmail) {
            return res.status(400).json({ message: 'Meet link and user email are required' });
        }

        const meeting = new Meeting({
            meetLink,
            userEmail,
            meetingName
        });

        await meeting.save();

        // Send confirmation email
        try {
            await sendEmail(
                userEmail,
                'Summaree - Meeting Scheduled Confirmation',
                `<p>Hello!</p>
                 <p>Your meeting <strong>${meetingName || 'Unnamed Meeting'}</strong> summary has been successfully scheduled with Summaree.</p>
                 <p>We'll send you an email with the summary, recording and transcript when it is ready.</p>
                 <p>Thanks for using Summaree!</p>`
            );
            console.log('Confirmation email sent to:', userEmail);
        } catch (emailError) {
            console.error('Error sending confirmation email:', emailError);
            // Log the email error, but don't prevent the meeting from being saved
        }

        res.status(201).json({ message: 'Meeting submitted successfully!', meetingId: meeting._id });
    } catch (error) {
        console.error('Error submitting meeting:', error);
        res.status(500).json({ message: 'Failed to submit meeting' });
    }
});

//Get meeting by id
router.get('/:id', async (req, res) => {
    try {
        const meeting = await Meeting.findById(req.params.id);
        if (!meeting) {
            return res.status(404).json({ message: 'Meeting not found' });
        }
        res.status(200).json(meeting);
    } catch (error) {
        console.error('Error fetching meeting:', error);
        res.status(500).json({ message: 'Failed to fetch meeting' });
    }
});

//Simplified cron job/background process to check meeting status using google meet api..
router.post('/process/:id', async (req, res) => {
    try {
        const meetingId = req.params.id;
        const meeting = await Meeting.findById(meetingId);

        if (!meeting) {
            return res.status(404).json({ message: 'Meeting not found' });
        }

        //Simulate processing time
        await new Promise(resolve => setTimeout(resolve, 5000));

        //Update meeting status and results.
        meeting.status = 'completed';
        meeting.recordingUrl = 'http://example.com/recording.mp4'; //recording url
        meeting.transcriptUrl = 'http://example.com/transcript.txt'; //transcript url
        await meeting.save();

        //Send email notification
        await sendEmail(
            meeting.userEmail,
            'Summaree - Your Meeting Summary is Ready',
            `<p>Hello, your meeting summary is ready!</p>
             <p>Recording: <a href="${meeting.recordingUrl}">${meeting.recordingUrl}</a></p>
             <p>Transcript: <a href="${meeting.transcriptUrl}">${meeting.transcriptUrl}</a></p>`
        );

        res.status(200).json({ message: 'Meeting processed and email sent!' });

    } catch (error) {
        console.error('Error processing meeting:', error);
        res.status(500).json({ message: 'Failed to process meeting' });
    }
});


module.exports = router;