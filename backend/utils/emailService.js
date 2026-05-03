const nodemailer = require('nodemailer');

// Show a warning if email credentials are not set in the .env file
if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
  console.warn('\n⚠️  WARNING: EMAIL_USER or EMAIL_PASS is missing in your .env file!');
  console.warn('⚠️  Emails will not be sent. Please configure them to enable expert verification notifications.\n');
}

// Configure the transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    // Gmail app passwords are shown with spaces but must be used without them
    pass: process.env.EMAIL_PASS ? process.env.EMAIL_PASS.replace(/\s/g, '') : ''
  }
});

// Verify connection configuration on startup
transporter.verify((error, success) => {
  if (error) {
    console.error('\n❌ EMAIL SERVICE ERROR: Connection failed!');
    console.error(`❌ Details: ${error.message}`);
    console.error('❌ Please check if you are using a Gmail App Password and that EMAIL_USER is correct.\n');
  } else {
    console.log('\n🚀 EMAIL SERVICE: Ready to send notifications!\n');
  }
});

/**
 * Send an email notification for Expert Approval
 */
exports.sendApprovalEmail = async (userEmail, userName) => {
  if (!process.env.EMAIL_USER) return;

  const mailOptions = {
    from: `"Govi Connect Admin" <${process.env.EMAIL_USER}>`,
    to: userEmail,
    subject: '🪴 Govi Connect - Your Expert Account is Approved!',
    html: `
      <div style="font-family: sans-serif; line-height: 1.6; color: #333;">
        <h2 style="color: #115C39;">Hello ${userName},</h2>
        <p>Congratulations! Your account as an <strong>Agricultural Expert</strong> has been verified and approved by our administrators.</p>
        <p>You can now log in to the platform and access your Expert Dashboard to start sharing your knowledge with the community.</p>
        <div style="margin: 20px 0; padding: 15px; background-color: #f0fdf4; border-left: 4px solid #115C39;">
           <strong>Account Status:</strong> Active <br/>
           <strong>Access Level:</strong> Agricultural Expert
        </div>
        <p>Welcome to Govi Connect!</p>
        <p>Best Regards,<br/><strong>The Govi Connect Team</strong></p>
      </div>
    `
  };

  try {
    console.log(`📤 [Email] Attempting to send approval to: ${userEmail}...`);
    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ [Email] Approval SUCCESS: Sent to ${userEmail} (ID: ${info.messageId})`);
  } catch (error) {
    console.error(`❌ [Email] Approval FAILED for ${userEmail}:`, error.message);
    if (error.message.includes('Invalid login')) {
      console.error('❌ [Email] ERROR: Invalid Gmail credentials. Please check EMAIL_USER and EMAIL_PASS.');
    }
  }
};

/**
 * Send an email notification for Expert Rejection
 */
exports.sendRejectionEmail = async (userEmail, userName, reason) => {
  if (!process.env.EMAIL_USER) return;

  const mailOptions = {
    from: `"Govi Connect Admin" <${process.env.EMAIL_USER}>`,
    to: userEmail,
    subject: 'Govi Connect - Expert Verification Status',
    html: `
      <div style="font-family: sans-serif; line-height: 1.6; color: #333;">
        <h2 style="color: #D32F2F;">Hello ${userName},</h2>
        <p>Thank you for your interest in joining Govi Connect as an Agricultural Expert.</p>
        <p>After reviewing your professional credentials, unfortunately, we are unable to approve your account at this time.</p>
        <div style="margin: 20px 0; padding: 15px; background-color: #fff1f0; border-left: 4px solid #D32F2F;">
           <strong>Reason for rejection:</strong> ${reason}
        </div>
        <p>You can log in to your account to update your profile and resubmit your details for a new review.</p>
        <p>The Govi Connect Team</p>
      </div>
    `
  };

  try {
    console.log(`📤 [Email] Attempting to send rejection to: ${userEmail}...`);
    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ [Email] Rejection SUCCESS: Sent to ${userEmail} (ID: ${info.messageId})`);
  } catch (error) {
    console.error(`❌ [Email] Rejection FAILED for ${userEmail}:`, error.message);
    if (error.message.includes('Invalid login')) {
      console.error('❌ [Email] ERROR: Invalid Gmail credentials. Please check EMAIL_USER and EMAIL_PASS.');
    }
  }
};

/**
 * Simple test function to verify email delivery
 */
exports.sendTestEmail = async (targetEmail) => {
  const mailOptions = {
    from: `"Govi Connect Test" <${process.env.EMAIL_USER}>`,
    to: targetEmail,
    subject: '🧪 Govi Connect - Email Service Test',
    text: 'If you are reading this, your Govi Connect email service is working correctly!',
    html: '<h3>Success!</h3><p>Your Govi Connect email service is working correctly!</p>'
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ [Test Email] Sent to ${targetEmail} (ID: ${info.messageId})`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`❌ [Test Email] Failed:`, error.message);
    throw error;
  }
};

