const nodemailer = require('nodemailer');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

async function testEmail() {
  console.log('--- Email Debug Test ---');
  const host = process.env.SMTP_HOST || 'smtp.hostinger.com';
  const port = parseInt(process.env.SMTP_PORT) || 465;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD;

  console.log(`Host: ${host}`);
  console.log(`Port: ${port}`);
  console.log(`User: ${user}`);
  console.log(`Password length: ${pass ? pass.length : 0}`);
  if (pass && pass.includes('#')) {
    console.log('⚠️ WARNING: Password contains a "#" character. Make sure it is wrapped in quotes in your .env file!');
  }

  const transporter = nodemailer.createTransport({
    host: host,
    port: port,
    secure: port === 465,
    auth: {
      user: user,
      pass: pass,
    },
    tls: {
      rejectUnauthorized: false
    },
    logger: true, // Enable detailed logging
    debug: true   // Include SMTP traffic in the logs
  });

  try {
    console.log('\nTesting connection and authentication...');
    await transporter.verify();
    console.log('✅ Connection and Authentication SUCCESSFUL!');
    
    console.log('\nSending a test email...');
    const result = await transporter.sendMail({
      from: `Test PeopleOS <${user}>`,
      to: user, // send to itself
      subject: 'PeopleOS - SMTP Debug Test',
      text: 'If you receive this, your SMTP settings are 100% correct!'
    });
    console.log('✅ Email sent successfully!', result.messageId);
    
  } catch (error) {
    console.error('\n❌ FAILED:', error.message);
    if (error.response) {
      console.error('SMTP Response:', error.response);
    }
  }
}

testEmail();
