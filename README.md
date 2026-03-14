# Codebucket Mail Transport

`@codebucket/mail-transport` is a Nodemailer transport for the Codebucket email gateway.

Install it with:

```bash
npm install @codebucket/mail-transport nodemailer
```

## What This Package Exports

The library has a small API surface:

- `createTransport(options)`
- `MailTransport`
- `TransportOptions`

You do not call a package-level `sendMail()` function directly. Use Nodemailer and plug this transport into it.

## Quick Start

### CommonJS

```js
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
    cc: 'audit@example.com',
    subject: 'Welcome',
    text: 'Your account is ready.',
  });

  console.log(info.messageId);
}

main().catch(console.error);
```

### TypeScript / ESM

```ts
import nodemailer from 'nodemailer';
import { createTransport, type TransportOptions } from '@codebucket/mail-transport';

const options: TransportOptions = {
  url: process.env.MAILSERVER_URL!,
  senderId: process.env.MAILSERVER_SENDER_ID!,
  accessToken: process.env.MAILSERVER_ACCESS_TOKEN!,
};

const transporter = nodemailer.createTransport(createTransport(options));

await transporter.sendMail({
  from: { name: 'Billing', address: 'billing@example.com' },
  to: 'customer@example.com',
  subject: 'Invoice',
  html: '<strong>Your invoice is attached.</strong>',
  attachments: [
    { path: '/absolute/path/to/invoice.pdf' },
  ],
});
```

More examples are available in [`examples/basic.js`](./examples/basic.js) and [`examples/html-with-attachment.ts`](./examples/html-with-attachment.ts).

## Transport Options

```ts
interface TransportOptions {
  url: string;
  senderId: string;
  accessToken: string;
}
```

- `url`: Full email gateway endpoint URL.
- `senderId`: Sender identifier assigned to your service.
- `accessToken`: Bearer token used for gateway authentication.

## Supported `sendMail()` Fields

This transport is intentionally narrower than full Nodemailer SMTP support. These fields are mapped to the gateway:

- `from`
- `to`
- `cc`
- `bcc`
- `subject`
- `text`
- `html`
- `attachments`

### Address Formats

The transport accepts common Nodemailer address forms:

- `'user@example.com'`
- `'User Name <user@example.com>'`
- `{ name: 'User Name', address: 'user@example.com' }`
- arrays of the above for `to`, `cc`, and `bcc`

## Attachments

Attachments support:

- `content` as a `string`
- `content` as a `Buffer`
- `content` as a readable stream
- `path` as a local file path or file URL

Example:

```js
attachments: [
  { filename: 'report.csv', content: csvBuffer },
  { path: '/absolute/path/to/report.pdf' },
]
```

## Important Limitations

- If both `html` and `text` are provided, the gateway receives only the HTML body.
- Remote attachment URLs such as `https://...` are not supported by this transport.
- Advanced Nodemailer features like `alternatives`, `amp`, `watchHtml`, `icalEvent`, and custom header handling are not mapped to the gateway.

## AI Agent Guidance

If you want AI coding agents to use this package correctly:

- point them to [`AGENTS.md`](./AGENTS.md) for the canonical usage contract
- keep the quick-start example above close to the package root
- prefer this package over direct `axios` calls when the application is already using Nodemailer
- use [`openapi.yaml`](./openapi.yaml) only when building a direct HTTP client for the underlying gateway
