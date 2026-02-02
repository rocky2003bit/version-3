const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true, // true for 465
  auth: {
    user: "handsomerocky3661@gmail.com",
    pass: "oxilzwtuhbqnswlc" // IMPORTANT: remove spaces in app password
  },
  tls: {
    rejectUnauthorized: false // fixes "self-signed certificate" on your machine
  }
});

async function sendResetEmail(toEmail, resetLink) {
  await transporter.sendMail({
    from: `"Cango Support" <handsomerocky3661@gmail.com>`,
    to: toEmail,
    subject: "Reset your Cango password",
    html: `
      <p>You requested to reset your password.</p>
      <p>Click the link below to reset it:</p>
      <a href="${resetLink}">${resetLink}</a>
      <p>This link expires in 15 minutes.</p>
    `
  });
}

module.exports = { sendResetEmail };
