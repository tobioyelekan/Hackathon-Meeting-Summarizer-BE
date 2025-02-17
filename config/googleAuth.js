// server/config/googleAuth.js
const { google } = require('googleapis');
const { JWT } = require('google-auth-library');
require('dotenv').config();

const SCOPES = [
  'https://www.googleapis.com/auth/meetings.space.created',
  'https://www.googleapis.com/auth/meetings.space.readonly',
  'https://www.googleapis.com/auth/drive.readonly',
  'https://www.googleapis.com/auth/calendar'
];

const createAuth = (userEmail) => {
  try {
    const serviceAccount = JSON.parse(process.env.SERVICE_ACCOUNT_KEY);
    const auth = new JWT({
      email: serviceAccount.client_email,
      key: serviceAccount.private_key,
      scopes: SCOPES,
      subject: userEmail,
    });
    return auth;
  } catch (err) {
    console.error("Failed to read service account:", err);
    return null;
  }
};

module.exports = createAuth;