const nodemailer = require('nodemailer');
const { createTransport } = require('@codebucket/mail-transport');

const transporter = nodemailer.createTransport(createTransport({
  url: process.env.MAILSERVER_URL,
  senderId: process.env.MAILSERVER_SENDER_ID,
  accessToken: process.env.MAILSERVER_ACCESS_TOKEN,
}));

async function main() {
  const info = await transporter.sendMail({
    from: { name: 'Support', address: 'support@example.com' },
    to: ['alice@example.com', 'bob@example.com'],
    subject: 'Welcome',
    text: 'Your account is ready.',
  });

  console.log(info.messageId);
}

main().catch(console.error);
