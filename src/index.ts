import axios from 'axios';
import FormData from 'form-data';
import { TransportOptions } from './types';
import type { Transport, SentMessageInfo } from 'nodemailer';
import MailMessage from "nodemailer/lib/mailer/mail-message";

export class MailTransport implements Transport {
    name = 'MailTransport';
    version = '1.0.2';

    private options: TransportOptions;

    constructor(options: TransportOptions) {
        if (!options.url) {
            throw new Error('Transport requires an API URL.');
        }
        if (!options.senderId) {
            throw new Error('Transport requires a Sender ID.');
        }
        if (!options.accessToken) {
            throw new Error('Transport requires an access token.');
        }
        this.options = options;
    }

    async send(mail: MailMessage, callback: (err: Error | null, info?: SentMessageInfo) => void): Promise<void> {
        try {
            const form = new FormData();
            const data = mail.data;
            form.append('senderId', this.options.senderId);
            if(typeof data.from == 'string') {
                form.append('sourceEmailAddress', data.from?.toString() || '');
            } else if(data.from){
                if(data.from?.name) {
                    form.append('sourceName', data.from.name);
                }
                form.append('sourceEmailAddress', data.from.address);
            }

            form.append('destinationEmailAddresses', data.to?.toString() || '');
            form.append('subject', data.subject || '');
            form.append('content', data.html || data.text || '');
            form.append('isHtml', data.html ? 'true' : 'false');
            if(data.cc) {
                form.append('carbonCopyEmailAddresses', data.cc.toString());
            }
            if(data.bcc) {
                form.append('blindCarbonCopyEmailAddresses', data.bcc.toString());
            }

            if (Array.isArray(data.attachments)) {
                for (const attachment of data.attachments) {
                    const content = attachment.content;
                    const filename = attachment.filename || 'file';

                    if (Buffer.isBuffer(content)) {
                        form.append('attachments', content, { filename });
                    } else if (typeof content === 'string') {
                        form.append('attachments', Buffer.from(content, 'utf-8'), { filename });
                    } else {
                        throw new Error('Unsupported attachment content type.');
                    }
                }
            }

            let { data: response } = await axios.post(this.options.url, form, {
                headers: {...form.getHeaders(), 'Authorization': `Bearer ${this.options.accessToken}`}
            });



            callback(null, {
                envelope: {
                    from: data.from?.toString(),
                    to: [data.to?.toString() ?? '']
                },
                message: response.message,
                messageId: response.message,
            });
        } catch (err: any) {
            callback(err);
        }
    }
}

function createTransport(options: TransportOptions): Transport {
    return new MailTransport(options);
}

export { createTransport };