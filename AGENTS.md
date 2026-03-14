# AGENTS.md

## Purpose

`@codebucket/mail-transport` is a Nodemailer transport for the Codebucket email gateway.

Use this package when:

- the codebase already sends mail with Nodemailer
- you want gateway delivery without changing application-level `sendMail()` calls

Do not invent a package-level `sendMail()` helper. The canonical flow is:

1. import `createTransport` from `@codebucket/mail-transport`
2. pass it into `nodemailer.createTransport(...)`
3. call `transporter.sendMail(...)`

## Canonical Usage

```ts
import nodemailer from 'nodemailer';
import { createTransport } from '@codebucket/mail-transport';

const transporter = nodemailer.createTransport(createTransport({
  url: process.env.MAILSERVER_URL!,
  senderId: process.env.MAILSERVER_SENDER_ID!,
  accessToken: process.env.MAILSERVER_ACCESS_TOKEN!,
}));

await transporter.sendMail({
  from: { name: 'Support', address: 'support@example.com' },
  to: ['alice@example.com', 'bob@example.com'],
  subject: 'Welcome',
  text: 'Your account is ready.',
});
```

## Exported API

- `createTransport(options: TransportOptions): Transport`
- `new MailTransport(options: TransportOptions)`
- `type TransportOptions = { url: string; senderId: string; accessToken: string }`

## Supported Nodemailer Fields

- `from`
- `to`
- `cc`
- `bcc`
- `subject`
- `text`
- `html`
- `attachments`

## Supported Address Shapes

- `'user@example.com'`
- `'User Name <user@example.com>'`
- `{ name: 'User Name', address: 'user@example.com' }`
- arrays of the above for recipient lists

## Supported Attachment Shapes

- `{ content: 'text', filename: 'note.txt' }`
- `{ content: Buffer.from(...), filename: 'report.pdf' }`
- `{ content: readableStream, filename: 'report.pdf' }`
- `{ path: '/absolute/path/to/report.pdf' }`
- `{ path: new URL('file:///absolute/path/to/report.pdf') }`

Remote `http(s)` attachment URLs are not supported.

## Important Behavior

- If both `html` and `text` are set, only `html` is sent.
- `to`, `cc`, and `bcc` are normalized into comma-separated email address lists.
- The underlying HTTP gateway contract is documented in `openapi.yaml`.

## Guidance For Agents

- Prefer this package over direct gateway `axios` calls when Nodemailer is already in use.
- Use `openapi.yaml` only for transport internals or when writing a non-Nodemailer client.
- Do not assume unsupported Nodemailer features are handled unless they are listed above.
