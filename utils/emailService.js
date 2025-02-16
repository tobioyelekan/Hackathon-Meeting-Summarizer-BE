const nodemailer = require('nodemailer');
require('dotenv').config();


const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.NODEMAILER_EMAIL, // Your Gmail address
        pass: process.env.NODEMAILER_PASSWORD, // Your Gmail password or an app password
    },
});

const sendEmail = async (to, subject, html) => {
  try {
    await transporter.sendMail({
      from: process.env.NODEMAILER_EMAIL, // Sender address
      to: to, // List of receivers
      subject: subject, // Subject line
      html: html, // HTML body
    });
    console.log('Email sent successfully!');
  } catch (error) {
    console.error('Error sending email:', error);
  }
};

module.exports = {sendEmail};