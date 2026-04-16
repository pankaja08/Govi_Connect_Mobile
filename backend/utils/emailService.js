const nodemailer = require('nodemailer');

// Show a warning if email credentials are not set in the .env file
if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
  console.warn('⚠️ WARNING: EMAIL_USER or EMAIL_PASS is missing in your .env file! Emails will not send.');
}

// Configure the transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

/**
 * Send an email notification for Expert Approval
 */
exports.sendApprovalEmail = async (userEmail, userName) => {
  const mailOptions = {
    from: process.env.EMAIL_USER || 'no-reply@goviconnect.com',
    to: userEmail,
    subject: '🪴 Govi Connect - Your Expert Account is Approved!',
    html: `
      <h2>Hello ${userName},</h2>
      <p>Congratulations! Your account as an Agricultural Expert has been verified and approved by our administrators.</p>
      <p>You can now log in to the platform and access your Expert Dashboard to start sharing your knowledge with the community.</p>
      <br/>
      <p>Welcome to Govi Connect!</p>
      <p>The Govi Connect Team</p>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`\n======================================================`);
    console.log(`✅ SUCCESS: Approval email sent to ${userEmail}`);
    console.log(`✅ Message ID: ${info.messageId}`);
    console.log(`======================================================\n`);
  } catch (error) {
    console.error(`\n======================================================`);
    console.error(`❌ ERROR: Failed to send approval email to ${userEmail}`);
    console.error(`❌ Please check your EMAIL_USER and EMAIL_PASS config.`);
    console.error(`❌ Details:`, error.message);
    console.error(`======================================================\n`);
  }
};

/**
 * Send an email notification for Expert Rejection
 */
exports.sendRejectionEmail = async (userEmail, userName, reason) => {
  const mailOptions = {
    from: process.env.EMAIL_USER || 'no-reply@goviconnect.com',
    to: userEmail,
    subject: 'Govi Connect - Expert Verification Status',
    html: `
      <h2>Hello ${userName},</h2>
      <p>Thank you for your interest in joining Govi Connect as an Agricultural Expert.</p>
      <p>After reviewing your professional credentials, unfortunately, we are unable to approve your account at this time.</p>
      <p><strong>Reason for rejection:</strong> ${reason}</p>
      <br/>
      <p>You can log in to your account to update your profile and resubmit your details for a new review.</p>
      <p>The Govi Connect Team</p>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`\n======================================================`);
    console.log(`✅ SUCCESS: Rejection email sent to ${userEmail}`);
    console.log(`✅ Message ID: ${info.messageId}`);
    console.log(`======================================================\n`);
  } catch (error) {
    console.error(`\n======================================================`);
    console.error(`❌ ERROR: Failed to send rejection email to ${userEmail}`);
    console.error(`❌ Please check your EMAIL_USER and EMAIL_PASS config.`);
    console.error(`❌ Details:`, error.message);
    console.error(`======================================================\n`);
  }
};
