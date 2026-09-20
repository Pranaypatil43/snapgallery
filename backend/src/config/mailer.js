const nodemailer = require('nodemailer');

const emailUser = process.env.EMAIL_USER;
const emailPass = (process.env.EMAIL_PASS || '').replace(/\s/g, '');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: emailUser,
    pass: emailPass,
  },
  connectionTimeout: 5000,
  greetingTimeout: 5000,
  socketTimeout: 10000,
});

/**
 * Send team member invitation email with login credentials.
 * @param {{ name: string, email: string, password: string }} member
 */
const sendInviteEmail = async ({ name, email, password }) => {
  if (!emailUser || !emailPass) {
    console.warn('EMAIL_USER or EMAIL_PASS not set. Skipping invitation email.');
    return;
  }

  const frontendBase = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/+$/, '');
  const loginUrl = `${frontendBase}/login`;

  await transporter.sendMail({
    from: `"SnapGallery" <${emailUser}>`,
    to: email,
    subject: 'You have been added to SnapGallery — Your Login Credentials',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;background:#f9fafb;padding:32px 24px;border-radius:12px;">
        <div style="text-align:center;margin-bottom:28px;">
          <div style="display:inline-block;background:linear-gradient(135deg,#c9a84c,#e8c96a);border-radius:10px;padding:10px 18px;">
            <span style="color:#1a2744;font-size:18px;font-weight:800;">📷 SnapGallery</span>
          </div>
        </div>

        <h2 style="color:#1a2744;font-size:20px;margin-bottom:8px;">Hi ${name}, welcome to the team!</h2>
        <p style="color:#555;font-size:14px;line-height:1.6;margin-bottom:24px;">
          You have been added as a <strong>Team Member</strong> on SnapGallery.
          Use the credentials below to log in and start uploading photos.
        </p>

        <div style="background:#fff;border:1px solid #e5e7eb;border-radius:10px;padding:20px 24px;margin-bottom:24px;">
          <table style="width:100%;font-size:14px;border-collapse:collapse;">
            <tr>
              <td style="color:#888;padding:8px 0;border-bottom:1px solid #f3f4f6;width:40%;">Login URL</td>
              <td style="color:#1a2744;font-weight:600;padding:8px 0;border-bottom:1px solid #f3f4f6;">
                <a href="${loginUrl}" style="color:#0369a1;">${loginUrl}</a>
              </td>
            </tr>
            <tr>
              <td style="color:#888;padding:8px 0;border-bottom:1px solid #f3f4f6;">Email</td>
              <td style="color:#1a2744;font-weight:600;padding:8px 0;border-bottom:1px solid #f3f4f6;">${email}</td>
            </tr>
            <tr>
              <td style="color:#888;padding:8px 0;">Password</td>
              <td style="padding:8px 0;">
                <span style="background:#f3f4f6;border-radius:6px;padding:4px 12px;font-family:monospace;font-size:15px;font-weight:700;color:#1a2744;letter-spacing:1px;">${password}</span>
              </td>
            </tr>
          </table>
        </div>

        <div style="text-align:center;margin-bottom:24px;">
          <a href="${loginUrl}"
            style="display:inline-block;background:#1a2744;color:#fff;text-decoration:none;padding:12px 32px;border-radius:8px;font-size:14px;font-weight:700;">
            Log In Now →
          </a>
        </div>

        <p style="color:#aaa;font-size:12px;text-align:center;">
          Please change your password after your first login.<br/>
          If you did not expect this email, please ignore it.
        </p>
      </div>
    `,
  });
};

module.exports = { sendInviteEmail };
