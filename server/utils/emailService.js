const nodemailer = require('nodemailer');

// 1. Create the Transporter (The Postman)
// We are using Ethereal for testing. It generates a fake account automatically.
// In production, you would swap this for Gmail or Outlook details.
const transporter = nodemailer.createTransport({
  host: 'smtp.ethereal.email',
  port: 587,
  auth: {
    user: 'demetris.okuneva@ethereal.email', // REPLACE WITH YOUR ETHEREAL USER
    pass: 'hXn7Qy1Z2' // REPLACE WITH YOUR ETHEREAL PASS
  }
});

const sendVerificationEmail = async (userEmail, token) => {
  // Generate test account on the fly if you don't have one
  const testAccount = await nodemailer.createTestAccount();

  const transporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    auth: {
      user: testAccount.user, 
      pass: testAccount.pass
    }
  });

  const verificationUrl = `http://localhost:3000/api/auth/verify/${token}`;

  const info = await transporter.sendMail({
    from: '"AlumniVantage Team" <admin@alumnivantage.com>',
    to: userEmail,
    subject: "Verify your AlumniVantage Account",
    html: `
      <h1>Welcome!</h1>
      <p>Please click the link below to verify your email address:</p>
      <a href="${verificationUrl}">Verify My Email</a>
    `,
  });

  console.log("📨 Email sent: %s", info.messageId);
  // This is the magic part: It gives you a URL to view the email in your browser!
  console.log("👀 Preview URL: %s", nodemailer.getTestMessageUrl(info));
};

module.exports = { sendVerificationEmail };