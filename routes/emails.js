//NOTE - Sends Email

const nodemailer = require('nodemailer');
require(dotenv).config();

async function sendSummaryEmail(emails,summary) {
    const transporter = nodemailer.createTransport({
        service:"gmail",
        auth: {
            user: process.env.GMAIL_USER,
            pass: process.env.GMAIL_PASS
        }
    })
    await transporter.sendMail({
        from: process.env.GMAIL_USER,
        to: emails.joins(','),
        subject: 'Meaning Summary',
        text: summary
    });
}

console.log("Email sent!")

module.exports = {sendSummaryEmail};