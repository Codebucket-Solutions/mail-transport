import axios from 'axios';
import FormData from 'form-data';
import { createReadStream, readFileSync } from 'fs';
import { basename } from 'path';
import { Readable } from 'stream';
import { URL, fileURLToPath, format, type Url } from 'url';
import type { Transport, SentMessageInfo } from 'nodemailer';
import type Mail from 'nodemailer/lib/mailer';
import addressParser, { type ParsedAddress } from 'nodemailer/lib/addressparser';
import MailMessage from "nodemailer/lib/mailer/mail-message";
import { TransportOptions } from './types';

type AddressObject = {
    address: string;
    name?: string;
};

type AddressInput = string | AddressObject | Array<string | AddressObject> | undefined;

type BodyInput = string | Buffer | {
    content?: string | Buffer;
    path?: string | URL | Url;
} | undefined;

interface MailData {
    from?: AddressInput;
    to?: AddressInput;
    cc?: AddressInput;
    bcc?: AddressInput;
    subject?: string;
    text?: BodyInput;
    html?: BodyInput;
    attachments?: Mail.Attachment[];
}

function flattenAddresses(entries: ParsedAddress[]): ParsedAddress[] {
    return entries.flatMap((entry) => entry.group?.length ? flattenAddresses(entry.group) : [entry]);
}

function parseAddressString(value: string): AddressObject[] {
    return flattenAddresses(addressParser(value))
        .filter((entry) => typeof entry.address === 'string' && entry.address.length > 0)
        .map((entry) => ({
            address: entry.address!,
            name: entry.name || undefined,
        }));
}

function normalizeAddresses(value: AddressInput): AddressObject[] {
    if (!value) {
        return [];
    }

    if (typeof value === 'string') {
        return parseAddressString(value);
    }

    if (Array.isArray(value)) {
        return value.flatMap((entry) => normalizeAddresses(entry));
    }

    if (typeof value.address === 'string' && value.address.length > 0) {
        return [{
            address: value.address,
            name: value.name,
        }];
    }

    return [];
}

function normalizeLocalPath(value: string | URL | Url): string {
    if (value instanceof URL) {
        if (value.protocol !== 'file:') {
            throw new Error('Only local file URLs are supported for attachments and body content.');
        }

        return fileURLToPath(value);
    }

    if (typeof value === 'object' && value !== null) {
        if (value.protocol !== 'file:') {
            throw new Error('Only local file URLs are supported for attachments and body content.');
        }

        return fileURLToPath(format(value));
    }

    if (value.startsWith('file://')) {
        return fileURLToPath(new URL(value));
    }

    if (value.startsWith('http://') || value.startsWith('https://') || value.startsWith('data:')) {
        throw new Error('Remote URLs are not supported. Use attachment content or a local file path instead.');
    }

    return value;
}

function resolveBodyContent(value: BodyInput, fieldName: 'html' | 'text'): string {
    if (typeof value === 'string') {
        return value;
    }

    if (Buffer.isBuffer(value)) {
        return value.toString('utf-8');
    }

    if (!value || typeof value !== 'object') {
        throw new Error(`Unsupported ${fieldName} content type.`);
    }

    if (typeof value.content === 'string') {
        return value.content;
    }

    if (Buffer.isBuffer(value.content)) {
        return value.content.toString('utf-8');
    }

    if (value.path) {
        return readFileSync(normalizeLocalPath(value.path), 'utf-8');
    }

    throw new Error(`Unsupported ${fieldName} content type.`);
}

function getAttachmentFilename(attachment: Mail.Attachment): string | undefined {
    if (attachment.filename === false) {
        return undefined;
    }

    if (typeof attachment.filename === 'string' && attachment.filename.length > 0) {
        return attachment.filename;
    }

    // Nodemailer 10 types `path` as a string, but callers may still pass a URL object at runtime.
    const attachmentPath: unknown = attachment.path;
    if (attachmentPath instanceof URL) {
        return basename(normalizeLocalPath(attachmentPath));
    }

    if (typeof attachment.path === 'string' && attachment.path.length > 0) {
        return basename(normalizeLocalPath(attachment.path));
    }

    return 'attachment';
}

function appendAttachment(form: FormData, attachment: Mail.Attachment): void {
    const filename = getAttachmentFilename(attachment);
    const options = filename ? { filename } : undefined;

    if (attachment.path) {
        form.append('attachments', createReadStream(normalizeLocalPath(attachment.path)), options);
        return;
    }

    if (attachment.content instanceof Readable) {
        form.append('attachments', attachment.content, options);
        return;
    }

    if (Buffer.isBuffer(attachment.content)) {
        form.append('attachments', attachment.content, options);
        return;
    }

    if (typeof attachment.content === 'string') {
        const encoding = typeof attachment.encoding === 'string' ? attachment.encoding as BufferEncoding : 'utf-8';
        form.append('attachments', Buffer.from(attachment.content, encoding), options);
        return;
    }

    throw new Error('Unsupported attachment content type. Use content, a local path, or a readable stream.');
}

export class MailTransport implements Transport {
    name = 'MailTransport';
    version = '1.0.6';

    private options: TransportOptions;

    constructor(options: TransportOptions) {
        this.options = options;
    }

    async send(mail: MailMessage, callback: (err: Error | null, info?: SentMessageInfo) => void): Promise<void> {
        try {
            const form = new FormData();
            const data = mail.data as MailData;
            const sender = normalizeAddresses(data.from)[0];
            const toAddresses = normalizeAddresses(data.to).map((entry) => entry.address);
            const ccAddresses = normalizeAddresses(data.cc).map((entry) => entry.address);
            const bccAddresses = normalizeAddresses(data.bcc).map((entry) => entry.address);
            const allRecipients = [...toAddresses, ...ccAddresses, ...bccAddresses];
            const hasHtml = data.html !== undefined && data.html !== null;

            form.append('senderId', this.options.senderId);

            if (sender?.name) {
                form.append('sourceName', sender.name);
            }

            form.append('sourceEmailAddress', sender?.address || '');
            form.append('destinationEmailAddresses', toAddresses.join(','));
            form.append('subject', data.subject || '');
            form.append('content', hasHtml ? resolveBodyContent(data.html, 'html') : resolveBodyContent(data.text, 'text'));
            form.append('isHtml', hasHtml ? 'true' : 'false');

            if (ccAddresses.length > 0) {
                form.append('carbonCopyEmailAddresses', ccAddresses.join(','));
            }

            if (bccAddresses.length > 0) {
                form.append('blindCarbonCopyEmailAddresses', bccAddresses.join(','));
            }

            if (Array.isArray(data.attachments)) {
                for (const attachment of data.attachments) {
                    appendAttachment(form, attachment);
                }
            }

            let { data: response } = await axios.post(this.options.url, form, {
                headers: {...form.getHeaders(), 'Authorization': `Bearer ${this.options.accessToken}`}
            });

            callback(null, {
                envelope: {
                    from: sender?.address,
                    to: allRecipients
                },
                message: response.message,
                messageId: response.messageId || response.message,
            });
        } catch (err: any) {
            callback(err);
        }
    }
}

/**
 * Create a Nodemailer transport backed by the Codebucket email gateway.
 */
function createTransport(options: TransportOptions): Transport {
    return new MailTransport(options);
}

export { createTransport };
export type { TransportOptions };
