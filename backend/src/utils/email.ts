import nodemailer from 'nodemailer';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

const createTransporter = () => {
  const port = Number(process.env.EMAIL_PORT) || 587;
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.hostinger.com',
    port,
    secure: port === 465,
    requireTLS: port === 587,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    tls: {
      rejectUnauthorized: false,
    },
  });
};

export const sendEmail = async (options: EmailOptions): Promise<void> => {
  const unconfigured = !process.env.EMAIL_USER ||
    !process.env.EMAIL_PASS ||
    process.env.EMAIL_PASS === 'your_email_password_here';

  if (unconfigured) {
    console.log(`[Email - NOT SENT] To: ${options.to} | Subject: ${options.subject}`);
    return;
  }

  const transporter = createTransporter();
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || 'LinkSports <noreply@linksports.in>',
      to: options.to,
      subject: options.subject,
      html: options.html,
    });
    console.log(`[Email] Sent to ${options.to}`);
  } catch (err) {
    console.error(`[Email] FAILED to send to ${options.to}:`, err);
    // Don't rethrow — caller continues even if email fails
  }
};

export const emailTemplates = {
  verifyEmail: (otp: string, name: string) => ({
    subject: '🏅 Verify Your Email - LinkSports',
    html: `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.10);">

        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#0f172a 0%,#1e293b 100%);padding:36px 40px;text-align:center;">
            <div style="display:inline-flex;align-items:center;gap:10px;">
              <span style="font-size:28px;">⚡</span>
              <span style="color:#ffffff;font-size:26px;font-weight:800;letter-spacing:-0.5px;">Link<span style="color:#f97316;">Sports</span></span>
            </div>
            <p style="color:#94a3b8;margin:8px 0 0;font-size:13px;letter-spacing:0.5px;">INDIA'S SPORTS NETWORKING PLATFORM</p>
          </td>
        </tr>

        <!-- Hero banner -->
        <tr>
          <td style="background:linear-gradient(135deg,#f97316,#ea580c);padding:28px 40px;text-align:center;">
            <p style="margin:0;color:#fff3e0;font-size:13px;font-weight:600;letter-spacing:1.5px;text-transform:uppercase;">Email Verification</p>
            <h1 style="margin:8px 0 0;color:#ffffff;font-size:28px;font-weight:800;">Almost there, ${name}! 🎯</h1>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="background:#ffffff;padding:40px;">
            <p style="color:#475569;font-size:15px;line-height:1.7;margin:0 0 24px;">
              Welcome to <strong style="color:#0f172a;">LinkSports</strong> — India's fastest growing sports scouting network.
              To activate your account and start connecting with athletes, coaches, and academies, please verify your email using the OTP below.
            </p>

            <!-- OTP Box -->
            <div style="background:linear-gradient(135deg,#0f172a,#1e293b);border-radius:12px;padding:32px 20px;text-align:center;margin:28px 0;">
              <p style="color:#94a3b8;font-size:12px;letter-spacing:2px;text-transform:uppercase;margin:0 0 12px;">Your Verification Code</p>
              <div style="display:inline-block;">
                <span style="color:#f97316;font-size:48px;font-weight:900;letter-spacing:14px;font-family:'Courier New',monospace;">${otp}</span>
              </div>
              <p style="color:#64748b;font-size:12px;margin:16px 0 0;">⏱ Expires in <strong style="color:#f97316;">15 minutes</strong></p>
            </div>

            <!-- Steps -->
            <div style="background:#f8fafc;border-radius:10px;padding:20px 24px;margin:24px 0;border-left:4px solid #f97316;">
              <p style="margin:0 0 12px;font-size:13px;font-weight:700;color:#0f172a;text-transform:uppercase;letter-spacing:0.5px;">How to verify:</p>
              <p style="margin:4px 0;color:#475569;font-size:14px;">1️⃣ &nbsp;Go back to the LinkSports verification page</p>
              <p style="margin:4px 0;color:#475569;font-size:14px;">2️⃣ &nbsp;Enter the 6-digit code shown above</p>
              <p style="margin:4px 0;color:#475569;font-size:14px;">3️⃣ &nbsp;Start connecting with India's best sports talent!</p>
            </div>

            <p style="color:#94a3b8;font-size:12px;margin:24px 0 0;padding-top:20px;border-top:1px solid #f1f5f9;">
              🔒 Never share this OTP with anyone. LinkSports will never ask for your OTP.<br>
              If you didn't create a LinkSports account, please ignore this email.
            </p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#0f172a;padding:24px 40px;text-align:center;">
            <p style="color:#475569;font-size:12px;margin:0;">© 2026 LinkSports · India's Sports Networking Platform</p>
            <p style="margin:8px 0 0;">
              <a href="${process.env.CLIENT_URL}" style="color:#f97316;font-size:12px;text-decoration:none;">linksports.in</a>
              &nbsp;·&nbsp;
              <a href="${process.env.CLIENT_URL}/help" style="color:#64748b;font-size:12px;text-decoration:none;">Help Center</a>
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>
    `,
  }),

  resetPassword: (otp: string, name: string) => ({
    subject: '🔐 Password Reset Request - LinkSports',
    html: `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.10);">

        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#0f172a 0%,#1e293b 100%);padding:36px 40px;text-align:center;">
            <span style="color:#ffffff;font-size:26px;font-weight:800;">⚡ Link<span style="color:#f97316;">Sports</span></span>
            <p style="color:#94a3b8;margin:8px 0 0;font-size:13px;letter-spacing:0.5px;">INDIA'S SPORTS NETWORKING PLATFORM</p>
          </td>
        </tr>

        <!-- Hero -->
        <tr>
          <td style="background:linear-gradient(135deg,#dc2626,#b91c1c);padding:28px 40px;text-align:center;">
            <p style="margin:0;color:#fecaca;font-size:13px;font-weight:600;letter-spacing:1.5px;text-transform:uppercase;">Password Reset</p>
            <h1 style="margin:8px 0 0;color:#ffffff;font-size:26px;font-weight:800;">Reset your password, ${name}</h1>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="background:#ffffff;padding:40px;">
            <p style="color:#475569;font-size:15px;line-height:1.7;margin:0 0 24px;">
              We received a request to reset your <strong style="color:#0f172a;">LinkSports</strong> account password.
              Use the OTP below to proceed. If you didn't request this, you can safely ignore this email.
            </p>

            <!-- OTP Box -->
            <div style="background:linear-gradient(135deg,#7f1d1d,#991b1b);border-radius:12px;padding:32px 20px;text-align:center;margin:28px 0;">
              <p style="color:#fca5a5;font-size:12px;letter-spacing:2px;text-transform:uppercase;margin:0 0 12px;">Password Reset Code</p>
              <span style="color:#ffffff;font-size:48px;font-weight:900;letter-spacing:14px;font-family:'Courier New',monospace;">${otp}</span>
              <p style="color:#f87171;font-size:12px;margin:16px 0 0;">⏱ Expires in <strong style="color:#fca5a5;">15 minutes</strong></p>
            </div>

            <div style="background:#fef2f2;border-radius:10px;padding:16px 20px;margin:24px 0;border-left:4px solid #dc2626;">
              <p style="margin:0;color:#991b1b;font-size:13px;font-weight:600;">⚠️ Security Notice</p>
              <p style="margin:6px 0 0;color:#b91c1c;font-size:13px;">Never share this OTP with anyone. LinkSports support will never ask for it.</p>
            </div>

            <p style="color:#94a3b8;font-size:12px;margin:24px 0 0;padding-top:20px;border-top:1px solid #f1f5f9;">
              If you did not request a password reset, your account may be at risk. Please contact us immediately at support@linksports.in
            </p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#0f172a;padding:24px 40px;text-align:center;">
            <p style="color:#475569;font-size:12px;margin:0;">© 2026 LinkSports · India's Sports Networking Platform</p>
            <p style="margin:8px 0 0;">
              <a href="${process.env.CLIENT_URL}" style="color:#f97316;font-size:12px;text-decoration:none;">linksports.in</a>
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>
    `,
  }),

  loginOtp: (otp: string, name: string) => ({
    subject: 'Your Login OTP - LinkSports',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #0f172a; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="color: white; margin: 0;">LinkSports</h1>
          <p style="color: #94a3b8; margin: 5px 0 0;">India's Sports Networking Platform</p>
        </div>
        <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px;">
          <h2 style="color: #111827;">Hello ${name}!</h2>
          <p style="color: #6b7280;">Your login OTP is:</p>
          <div style="background: #0f172a; color: white; font-size: 36px; font-weight: bold; text-align: center; padding: 24px; border-radius: 8px; letter-spacing: 10px;">${otp}</div>
          <p style="color: #6b7280; margin-top: 20px;">This OTP expires in <strong>15 minutes</strong>. Do not share it with anyone.</p>
          <p style="color: #9ca3af; font-size: 12px; margin-top: 30px;">If you didn't request this, please ignore this email or contact support.</p>
        </div>
      </div>
    `,
  }),

  connectionRequest: (senderName: string) => ({
    subject: `${senderName} wants to connect with you - LinkSports`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #1a56db; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="color: white; margin: 0;">LinkSports</h1>
        </div>
        <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px;">
          <h2 style="color: #111827;">New Connection Request</h2>
          <p style="color: #6b7280;"><strong>${senderName}</strong> wants to connect with you on LinkSports.</p>
          <a href="${process.env.CLIENT_URL}/connections" style="display: inline-block; background: #1a56db; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; margin-top: 20px;">View Request</a>
        </div>
      </div>
    `,
  }),
};
