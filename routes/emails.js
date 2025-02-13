const nodemailer = require("nodemailer");
require("dotenv").config();

async function sendSummaryEmail(emails, summary) {
    try {
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.GMAIL_USER,
                pass: process.env.GMAIL_PASS
            }
        });

        const mailOptions = {
            from: process.env.GMAIL_USER,
            to: emails.join(','), // Corrected `.join`
            subject: "Meeting Summary",
            text: summary
        };

        const info = await transporter.sendMail(mailOptions);
        console.log("Email sent successfully:", info.response);
    } catch (error) {
        console.error("Error sending email:", error);
    }
}

module.exports = { sendSummaryEmail };
