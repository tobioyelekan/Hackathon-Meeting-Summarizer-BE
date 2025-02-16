const mongoose = require('mongoose');

const MeetingSchema = new mongoose.Schema({
  meetLink: {
    type: String,
    required: true,
  },
  userEmail: {
    type: String,
    required: true, 
  },
  meetingName: {
      type:String,
      required: false,
      default: "Unnamed meeting"
  },
  recordingUrl: {
    type: String,
  },
  transcriptUrl: {
    type: String,
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  conferenceRecord: {
      type: String, 
  }
});

module.exports = mongoose.model('Meeting', MeetingSchema);