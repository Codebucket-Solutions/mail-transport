# Codebucket Mail Transport

`npm i @codebucket/mail-transport`

#Usage

```
//utils/mailer.js

let nodemailer = require("nodemailer");
let {createTransport} = require('@codebucket/mail-transport');

let transporter = nodemailer.createTransport(
    createTransport({
      url: process.env.MAILSERVER_URL,
      senderId: process.env.MAILSERVER_SENDERID,
      accessToken: process.env.MAILSERVER_ACCESSTOKEN
    })
);

const subOtp = "OTP for Login ";
const textOtp = "Your One Time Password is : ";
const regOtp = "OTP for Registration ";

const sendMail = async (email, typ, data) => {
  let text, sub;
  if (typ == 1) {
    sub = subOtp;
    text = `BSCC College/University Registration: 
Kindly verify your mobile number using the given OTP: ${data}. Education Department- Bihar Government.`;
  }

  if (typ == 2) {
    sub = regOtp;
    text = `BSCC College/University Registration: 
Kindly verify your mobile number using the given OTP: ${data}. Education Department- Bihar Government.`;
  }

  if (typ == 3) {
    sub = "Xley Registration";
    text = "Your Password is : ";
  }

  var mailOptions = {
    to: email,
    from: process.env.EMAIL,
    subject: sub,
    importance: "high",
    text: text + data,
  };

  await transporter.sendMail(mailOptions, async (error, info) => {
    if (error) {
      console.log(error);
    }
    console.log("Message sent: %s", info.messageId);
    console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
  });
};

const sendHtml = async (email, subject, html, senderName, document) => {
  var mailOptions = {
    to: email,
    from: senderName
      ? {
          name: `Team ${senderName}`,
          address: process.env.EMAIL,
        }
      : process.env.EMAIL,
    subject: subject,
    importance: "high",
    html: html,
  };

  if (document) {
    mailOptions.attachments = [{
      path: document
    }]
  }

  await transporter.sendMail(mailOptions, async (error, info) => {
    if (error) {
      console.log(error);
    }
    console.log("Message sent: %s", info.messageId);
  });
};

module.exports = { sendMail, sendHtml };

```
