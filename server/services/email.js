const nodemailer = require('nodemailer');

// ─── Transporter ─────────────────────────────────────────────────────────────
// Uses Ethereal (fake SMTP) for development — preview URLs printed to console.
// Replace with real SMTP (Gmail, SendGrid, Resend, etc.) in production.
// ─────────────────────────────────────────────────────────────────────────────
let transporter;

async function getTransporter() {
  if (transporter) return transporter;

  // Check for real SMTP config
  if (process.env.SMTP_HOST) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
    return transporter;
  }

  // Development: spin up an Ethereal test account (persists in memory)
  const testAccount = await nodemailer.createTestAccount();

  transporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
  });

  // Print the Ethereal preview URL for manual testing
  console.log('📧  Ethereal email account:', testAccount.user);
  console.log('🔗  View sent emails at: https://ethereal.email/login');
  console.log(`    Password: ${testAccount.pass}`);

  return transporter;
}

// ─── Send Reset Email ─────────────────────────────────────────────────────────
async function sendPasswordResetEmail({ to, resetUrl, name }) {
  const transport = await getTransporter();

  const info = await transport.sendMail({
    from: `"Crowd FAQ" <${process.env.EMAIL_FROM || 'noreply@crowd.faq'}>`,
    to,
    subject: '🔐 Reset your Crowd FAQ password',
    html: resetEmailHtml({ resetUrl, name }),
    text: resetEmailText({ resetUrl, name }),
  });

  const previewUrl = nodemailer.getTestMessageUrl(info);
  if (previewUrl) {
    console.log(`✅  Password reset email sent to ${to}`);
    console.log(`🔗  Preview: ${previewUrl}`);
  }

  return { messageId: info.messageId, previewUrl };
}

// ─── HTML / Text templates ────────────────────────────────────────────────────
function resetEmailHtml({ resetUrl, name }) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Reset Password</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
          <!-- Header -->
          <tr>
            <td style="background:#4f46e5;padding:32px 40px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:bold;">🔐 Crowd FAQ</h1>
              <p style="margin:8px 0 0;color:#c7d2fe;font-size:14px;">Password Reset Request</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:40px;">
              <p style="margin:0 0 16px;color:#374151;font-size:15px;">Hi ${name || 'there'},</p>
              <p style="margin:0 0 24px;color:#374151;font-size:15px;line-height:1.6;">
                We received a request to reset your password. Click the button below to set a new one. This link expires in <strong>60 minutes</strong>.
              </p>
              <p style="margin:0 0 32px;text-align:center;">
                <a href="${resetUrl}"
                   style="display:inline-block;background:#4f46e5;color:#ffffff;text-decoration:none;font-size:15px;font-weight:bold;padding:14px 32px;border-radius:8px;">
                  Reset My Password
                </a>
              </p>
              <p style="margin:0 0 16px;color:#374151;font-size:14px;line-height:1.6;">
                If you didn't request this, you can safely ignore this email — your password won't change.
              </p>
              <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;" />
              <p style="margin:0;color:#9ca3af;font-size:12px;line-height:1.6;">
                Reset link: <a href="${resetUrl}" style="color:#4f46e5;word-break:break-all;">${resetUrl}</a>
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background:#f9fafb;padding:20px 40px;text-align:center;border-top:1px solid #e5e7eb;">
              <p style="margin:0;color:#9ca3af;font-size:12px;">
                Crowd FAQ — AI-Powered Knowledge Portal
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function resetEmailText({ resetUrl, name }) {
  return `
Hi ${name || 'there'},

We received a request to reset your Crowd FAQ password.

Click the link below to set a new password (expires in 60 minutes):

${resetUrl}

If you didn't request this, ignore this email — your password won't change.

Crowd FAQ — AI-Powered Knowledge Portal
`.trim();
}

module.exports = { sendPasswordResetEmail };