import nodemailer from 'nodemailer';
import { createTransport, type TransportOptions } from '@codebucket/mail-transport';

const options: TransportOptions = {
    url: process.env.MAILSERVER_URL!,
    senderId: process.env.MAILSERVER_SENDER_ID!,
    accessToken: process.env.MAILSERVER_ACCESS_TOKEN!,
};

const transporter = nodemailer.createTransport(createTransport(options));

async function main() {
    const info = await transporter.sendMail({
        from: { name: 'Billing', address: 'billing@example.com' },
        to: 'customer@example.com',
        cc: ['audit@example.com'],
        subject: 'Invoice',
        html: '<strong>Your invoice is attached.</strong>',
        attachments: [
            { path: '/absolute/path/to/invoice.pdf' },
        ],
    });

    console.log(info.messageId);
}

void main();
