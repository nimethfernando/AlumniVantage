const nodemailer = require('nodemailer');


const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'nimeth45@gmail.com',    // Gmail address
    pass: 'gxhz zlfk bmyw hctz'   // App password generated from Gmail settings
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
  // Note: Per your previous request, you can remove the line below to hide the link from console
  console.log("👀 Preview URL: %s", nodemailer.getTestMessageUrl(info)); 
};

module.exports = { sendVerificationEmail, sendResetEmail };