require('dotenv').config();
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS.replace(/\s/g, ''), // strip spaces
  },
});

transporter.verify((err, success) => {
  if (err) {
    console.error('❌ Connection failed:', err.message);
  } else {
    console.log('✅ Gmail connected successfully');
    // Send a real test email
    transporter.sendMail({
      from: `"SnapGallery" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER, // send to yourself
      subject: 'SnapGallery — Email Test',
      text: 'If you see this, nodemailer is working correctly.',
    }, (err2, info) => {
      if (err2) console.error('❌ Send failed:', err2.message);
      else console.log('✅ Test email sent! Message ID:', info.messageId);
    });
  }
});
