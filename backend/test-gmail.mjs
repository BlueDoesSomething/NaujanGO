import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

console.log('=== Gmail SMTP Configuration Test ===\n');

const host = process.env.SMTP_HOST;
const port = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587;
const user = process.env.SMTP_USER;
const pass = process.env.SMTP_PASS;
const from = process.env.MAIL_FROM || process.env.SMTP_USER;

console.log('Configuration loaded:');
console.log(`SMTP_HOST: ${host}`);
console.log(`SMTP_PORT: ${port}`);
console.log(`SMTP_USER: ${user}`);
console.log(`SMTP_PASS: ${pass ? '***' + pass.slice(-4) : 'NOT SET'}`);
console.log(`MAIL_FROM: ${from}`);
console.log();

if (!host || !user || !pass) {
  console.error('❌ ERROR: SMTP configuration is incomplete!');
  console.error('Missing:', {
    host: !host ? 'SMTP_HOST' : null,
    user: !user ? 'SMTP_USER' : null,
    pass: !pass ? 'SMTP_PASS' : null
  });
  process.exit(1);
}

console.log('Creating transporter...\n');

const transporter = nodemailer.createTransport({
  host,
  port,
  secure: port === 465,
  auth: {
    user,
    pass
  }
});

console.log('Testing SMTP connection...\n');

transporter.verify((error, success) => {
  if (error) {
    console.error('❌ SMTP Connection Failed:');
    console.error(error.message);
    console.error('\nPossible fixes:');
    console.error('1. Check if Gmail App Password is correct');
    console.error('2. Enable "Less secure app access" in Gmail settings');
    console.error('3. Use 2FA and generate an App Password (not your regular password)');
    console.error('4. Check if the account has been locked by Google');
    process.exit(1);
  } else {
    console.log('✅ SMTP Connection Successful!\n');
    
    // Try sending a test email
    const testEmail = {
      from,
      to: user,
      subject: 'NaujangGO - Email Configuration Test',
      text: 'If you receive this email, the email configuration is working correctly!',
      html: '<p>If you receive this email, the email configuration is working correctly!</p>'
    };

    console.log('Sending test email...\n');

    transporter.sendMail(testEmail, (error, info) => {
      if (error) {
        console.error('❌ Email Send Failed:');
        console.error(error.message);
        process.exit(1);
      } else {
        console.log('✅ Test Email Sent Successfully!');
        console.log(`Message ID: ${info.messageId}`);
        console.log(`Response: ${info.response}`);
        console.log('\n✅ Email configuration is working! Check your inbox (and spam folder).');
        process.exit(0);
      }
    });
  }
});
