import 'dotenv/config';
import nodemailer from 'nodemailer';

console.log('SMTP_HOST:', process.env.SMTP_HOST);
console.log('SMTP_USER:', process.env.SMTP_USER);
console.log('SMTP_PASS length:', process.env.SMTP_PASS?.length);

if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
  console.error('ERROR: SMTP env vars missing');
  process.exit(1);
}

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
});

try {
  await transporter.verify();
  console.log('SMTP connection OK - credentials are valid');
} catch (e) {
  console.error('SMTP connection FAILED:', e.message);
}
