//NOTE - Sends email via Nodemailer

const nodemailer = require("nodemailer");
require("dotenv").config();

// Configure the email transporter
const transporter = nodemailer.createTransport({
    service: "gmail", // Change if using another email provider
    auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS,
    },
});

/**
 * Send meeting summary email to participants
 * @param {Array} emails - List of recipient email addresses
 * @param {String} summary - Meeting summary content
 */
async function sendSummaryEmail(emails, summary) {
    try {
        await transporter.sendMail({
            from: process.env.GMAIL_USER,
            to: emails.join(","), // Convert array to a comma-separated string
            subject: "Meeting Summary",
            text: summary,
        });

        console.log("Email sent successfully!");
        return { success: true, message: "Email sent successfully!" };
    } catch (error) {
        console.error("Error sending email:", error);
        return { success: false, message: "Failed to send email." };
    }
}

module.exports = { sendSummaryEmail };
