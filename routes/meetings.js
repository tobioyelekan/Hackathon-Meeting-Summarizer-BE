const express = require('express');
const router = express.Router();
const { google } = require('googleapis');
const Meeting = require('../models/Meeting');
const { sendEmail } = require('../utils/emailService');
const summarizeText = require('../utils/summarize'); 
require('dotenv').config();

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

// Function to retrieve meeting recording, transcript, summary
const processMeeting = async (meetingId) => {
  try {
    const meeting = await Meeting.findById(meetingId);

    if (!meeting) {
      console.error('Meeting not found:', meetingId);
      return;
    }

    // List Conference Records
    const meet = google.meet({ version: 'v2', auth: oauth2Client });

    let conferenceRecordName;
    try {
      const conferenceRecords = await meet.conferenceRecords.list({
        pageSize: 10,
      });

      const relevantConferenceRecord = conferenceRecords.data.conferenceRecords?.find(record => record.meetingCode === meeting.meetLink.split('/').pop());

      if (relevantConferenceRecord) {
        conferenceRecordName = relevantConferenceRecord.name;
        console.log("Found Conference Record:", conferenceRecordName);
        meeting.conferenceRecord = conferenceRecordName;
        await meeting.save();
      } else {
        console.log("No Conference Record Found For:", meetingId);
        meeting.status = 'failed';
        await meeting.save();
        return;
      }
    } catch (listError) {
      console.error("Error listing conference records:", listError);
      meeting.status = 'failed';
      await meeting.save();
      return;
    }

    // List Transcripts
    let transcriptUrl = null;
    let transcriptId = null
    try {
      const transcriptsResponse = await meet.conferenceRecords.transcripts.list({
        parent: conferenceRecordName,
      });

      if (transcriptsResponse.data.transcripts && transcriptsResponse.data.transcripts.length > 0) {
        const transcript = transcriptsResponse.data.transcripts[0];
        transcriptUrl = transcript.docsDestination.exportUri;
        transcriptId = transcript.name.split('/').pop();
        meeting.transcriptId = transcriptId
        console.log("Successfully Obtained Transcript: ", transcriptUrl, transcriptId);
      } else {
        console.log("No Transcripts Found");
      }
    } catch (transcriptsError) {
      console.error("Error listing transcripts:", transcriptsError);
    }
    
   // List Recordings
   let recordingUrl = null;
   try {
       const recordingsResponse = await meet.conferenceRecords.recordings.list({
           parent: conferenceRecordName,
       });

       if (recordingsResponse.data.recordings && recordingsResponse.data.recordings.length > 0) {
           const recording = recordingsResponse.data.recordings[0]; 
           recordingUrl = recording.driveDestination.exportUri; 
           meeting.status = 'completed'
           console.log("Successfully Obtained Recording: ", recordingUrl);
       } else {
           console.log("No Recordings Found");
       }

   } catch(recordingsError) {
       console.error("Error listing recordings:", recordingsError);
       meeting.status = 'failed';
       await meeting.save();
       return;
   }

    // Summarize Transcript
    let summary = null;
    if (transcriptId) {
      try {
        summary = await summarizeText(transcriptId);
        console.log("Successfully summarized transcript");
      } catch (summaryError) {
        console.error("Error summarizing transcript:", summaryError);
      }
    } else {
      console.log("No transcript available, skipping summarization.");
    }

    // Update Meeting Model
    meeting.status = 'completed';
    meeting.recordingUrl = recordingUrl;
    meeting.transcriptUrl = transcriptUrl;
    meeting.summary = summary;
    await meeting.save();
    console.log('Meeting processing complete. Details saved to database.');

    // Send email notification
    try {
      await sendEmail(
        meeting.userEmail,
        'Summaree - Your Meeting Summary is Ready',
        `<p>Hello, your meeting summary is ready!</p>
           ${recordingUrl ? `<p>Recording: <a href="${recordingUrl}">${recordingUrl}</a></p>` : ''}
           ${transcriptUrl ? `<p>Transcript: <a href="${transcriptUrl}">${transcriptUrl}</a></p>` : ''}
           ${summary ? `<p>Summary: ${summary}</p>` : ''}`
      );
      console.log('Completion email sent to:', meeting.userEmail);
    } catch (emailError) {
      console.error('Error sending completion email:', emailError);
    }

  } catch (error) {
    console.error('Error processing meeting:', error);
    await Meeting.findByIdAndUpdate(meetingId, { status: 'failed' });
  }
};

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

    // Start the meeting processing (Retrieving recording and transcript from Google API)
    processMeeting(meeting._id);

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

module.exports = router;