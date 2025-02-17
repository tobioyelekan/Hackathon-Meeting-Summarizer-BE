const express = require('express');
const router = express.Router();
const { google } = require('googleapis');
const Meeting = require('../models/Meeting');
const { sendEmail } = require('../utils/emailService');
<<<<<<< HEAD
const summarizeText = require('../utils/summarise'); 
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
=======
const summarizeText = require('../utils/summarise');
const createAuth = require('../config/googleAuth'); 
require('dotenv').config();

const calendar = google.calendar({version: 'v3', auth: null});
const meet = google.meet({ version: 'v2', auth: null }); 

// Function to create a Google Meet meeting
const createMeeting = async (meetingName, meetingTime, auth) => {
    try {
        // Ensure the authentication is correctly setup
        await auth.authorize();

        const event = {
            'summary': meetingName,
            'start': {
                'dateTime': meetingTime,
                'timeZone': 'America/Los_Angeles',
            },
            'end': {
                'dateTime': meetingTime,
                'timeZone': 'America/Los_Angeles',
            },
            'conferenceData': {
                'createRequest': {
                    'requestId': 'some-unique-string',
                    conferenceSolutionKey: {
                        type: 'hangoutsMeet'
                    }
                },
            },
            reminders: {
                useDefault: false,
                overrides: [
                    { method: 'email', minutes: 24 * 60 },
                    { method: 'popup', minutes: 10 },
                ],
            },
        };

        const request = {
            calendarId: 'primary',
            resource: event,
            conferenceDataVersion: 1,
        };

        calendar.options({auth: auth}) // Set auth

        const response = await calendar.events.insert(request);

        if (response.status === 200) {
            console.log("Success");
            return response.data.hangoutLink;
        } else {
            console.log("Failure");
            return null;
        }
    } catch (error) {
        console.error('Error creating Google Meet meeting:', error);
        throw error;
    }
};

// Function to retrieve meeting recording and transcript
const processMeeting = async (meetingId) => {
    try {
        const meeting = await Meeting.findById(meetingId);

        if (!meeting) {
            console.error('Meeting not found:', meetingId);
            return;
        }

        // Setup the Auth, so it uses meeting
        const authObject = createAuth(meeting.userEmail);
        if (!authObject) {
            console.error('Could not create auth object');
            return;
        }
        await authObject.authorize();

        // List Conference Records
        let conferenceRecordName;

        try {
            meet.options({auth: authObject})
            const conferenceRecords = await meet.conferenceRecords.list({
                pageSize: 10, // Adjust as needed
            });
            const relevantConferenceRecord = conferenceRecords.data.conferenceRecords?.find(record => record.meetingCode === meeting.meetLink.split('/').pop());

            if (relevantConferenceRecord) {
                conferenceRecordName = relevantConferenceRecord.name;
                console.log("Found Conference Record:", conferenceRecordName);
                meeting.conferenceRecord = conferenceRecordName; // store for reference
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
                const transcript = transcriptsResponse.data.transcripts[0]; // Assuming only one transcript
                transcriptUrl = transcript.docsDestination.exportUri; // transcript file url
                transcriptId = transcript.name.split('/').pop();
                meeting.transcriptId = transcriptId
                console.log("Successfully Obtained Transcript: ", transcriptUrl, transcriptId);
            } else {
                console.log("No Transcripts Found");
                meeting.status = 'failed';
                await meeting.save();
                return;
            }
        } catch (transcriptsError) {
            console.error("Error listing transcripts:", transcriptsError);
            meeting.status = 'failed';
            await meeting.save();
            return;
        }

        // Get All Transcript Entries
        let fullTranscript = "";
        try {
            const transcriptEntriesResponse = await meet.conferenceRecords.transcripts.entries.list({
                parent: `conferenceRecords/${conferenceRecordName}/transcripts/${transcriptId}`,
                pageSize: 100, // Adjust as needed because of API limits
            });

            if (transcriptEntriesResponse.data.transcriptEntries && transcriptEntriesResponse.data.transcriptEntries.length > 0) {
                fullTranscript = transcriptEntriesResponse.data.transcriptEntries
                    .map(entry => entry.text)
                    .join(" ");
            } else {
                console.log("No Transcript Entries Found.");
            }
        } catch (entriesError) {
            console.error("Error getting transcript entries:", entriesError);
            meeting.status = 'failed';
            await meeting.save();
            return;
        }

        // Summarize Transcript
        let summary = null;
        if (fullTranscript) {
            try {
                summary = await summarizeText(fullTranscript);  // Pass transcript to summarise
                console.log("Successfully summarized transcript");
            } catch (summaryError) {
                console.error("Error summarizing transcript:", summaryError);
            }
        } else {
            console.log("No transcript available, skipping summarization.");
        }

        // List Recordings
        let recordingUrl = null;
        try {
            const recordingsResponse = await meet.conferenceRecords.recordings.list({
                parent: conferenceRecordName, // Ensure conferenceRecordName is set
            });

            if (recordingsResponse.data.recordings && recordingsResponse.data.recordings.length > 0) {
                const recording = recordingsResponse.data.recordings[0]; // Assuming only one recording
                recordingUrl = recording.driveDestination.exportUri; //Save exportUri
                meeting.status = 'completed'
                console.log("Successfully Obtained Recording: ", recordingUrl);
            } else {
                console.log("No Recordings Found");
            }

        } catch (recordingsError) {
            console.error("Error listing recordings:", recordingsError);
            meeting.status = 'failed';
            await meeting.save();
            return;
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

// Route to meeting
router.post('/', async (req, res) => {
    try {
        const { userEmail, meetingName, meetingTime } = req.body;

        // Validation
        if (!userEmail || !meetingName || !meetingTime) {
            return res.status(400).json({ message: 'Email, meeting name, and time are required' });
        }
        
        // Setup Google Meet API
        const authObject = createAuth(userEmail); //Setting up auth for that particular user.
        if (!authObject) {
            return res.status(500).json({ message: 'Could not authenticate with Google API' });
        }

        // 2. Create Google Meet
        const meetLink = await createMeeting(meetingName, meetingTime, authObject);
        if (!meetLink) {
            return res.status(500).json({ message: 'Failed to create Google Meet meeting' });
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
                 <p>Your meeting <strong>${meetingName}</strong> is scheduled with Summaree.</p>
                 <p>Meet Link: <a href="${meetLink}">${meetLink}</a></p>
                 <p>We'll send you an email with the summary, recording and transcript when it is ready.</p>
                 <p>Thanks for using Summaree!</p>`
            );
            console.log('Confirmation email sent to:', userEmail);
        } catch (emailError) {
            console.error('Error sending confirmation email:', emailError);
            // Log the email error, but don't prevent the meeting from being saved
        }

        res.status(201).json({ message: 'Meeting scheduled successfully!', meetingId: meeting._id, meetLink });

        // Start processing the meeting in the background
        processMeeting(meeting._id);

    } catch (error) {
        console.error('Error submitting meeting:', error);
        res.status(500).json({ message: 'Failed to submit meeting' });
    }
});

// Get meeting by id
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
>>>>>>> ad3624d (restructured backend)
});

module.exports = router;