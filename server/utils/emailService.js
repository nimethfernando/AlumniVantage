const nodemailer = require('nodemailer');


const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,    // Gmail address
    pass: process.env.EMAIL_PASS   // App password generated from Gmail settings
  }
});

 //SEND VERIFICATION EMAIL
const sendVerificationEmail = async (userEmail, token) => {
  const verificationUrl = `http://localhost:3000/api/auth/verify/${token}`;

  const info = await transporter.sendMail({
    from: '"AlumniVantage Team" <nimeth45@gmail.com>',
    to: userEmail,
    subject: "Verify your AlumniVantage Account",
    html: `
      <h1>Welcome!</h1>
      <p>Please click the link below to verify your email address:</p>
      <a href="${verificationUrl}">Verify My Email</a>
    `,
  });

  console.log("📨 Verification Email sent: %s", info.messageId);
  console.log("👀 Preview URL: %s", nodemailer.getTestMessageUrl(info));
};

// SEND RESET EMAIL
const sendResetEmail = async (userEmail, token) => {
  const resetUrl = `http://localhost:5173/reset-password/${token}`;

  const info = await transporter.sendMail({
    from: '"AlumniVantage Team" <nimeth45@gmail.com>',
    to: userEmail,
    subject: "Reset Your AlumniVantage Password",
    html: `
      <h1>Password Reset Request</h1>
      <p>You requested a password reset. Please click the link below to set a new password:</p>
      <a href="${resetUrl}">Reset My Password</a>
      <p>This link will expire in 1 hour.</p>
    `,
  });

  console.log("📨 Reset Email sent: %s", info.messageId);
  console.log("👀 Preview URL: %s", nodemailer.getTestMessageUrl(info)); 
};

// SEND BID RESULT EMAIL
const sendBidResultEmail = async (userEmail, status) => {
  const subject = status === 'won' ? "Congratulations! You won the Alumni Feature" : "Bid Update: You didn't win this time";
  const message = status === 'won' 
    ? "Your blind bid was the highest! Your profile will be featured on the Alumni board today."
    : "Unfortunately, your bid was not the highest this time. Better luck next time!";

  const info = await transporter.sendMail({
    from: '"AlumniVantage Team" <nimeth45@gmail.com>',
    to: userEmail,
    subject: subject,
    html: `
      <h1>Bid Status: ${status.toUpperCase()}</h1>
      <p>${message}</p>
    `,
  });

  console.log(`📨 Bid Status Email (${status}) sent: %s`, info.messageId);
};

module.exports = { sendVerificationEmail, sendResetEmail, sendBidResultEmail };