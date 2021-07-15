const nodemailer = require('nodemailer');
var handlebars = require('handlebars');
var fs = require('fs');
const path = require('path');
const sgMail = require('@sendgrid/mail');
const apiKey = process.env.MAILGUN_API_KEY;
const domain = process.env.MAILGUN_DOMAIN;
const mailgun  = require('mailgun-js')({apiKey , domain });
const moment = require('moment-timezone');
const { isValidTimeZone } = require('../utils')
const { accountVerifyText, sendPassVerifyText, sendProScheduledMeetText, sendStudScheduledMeetText, sendProRescheduledMeetText, sendStudRescheduledMeetText, sendProDeletedMeetText, sendStudDeletedMeetText, sendStudConfirmedMeetText, sendProConfirmMeetText, sendUpcomingMeetText } = require('./messageText')
const { sendText } = require('./textService');
const dirname = process.cwd();

const url_link = `${process.env.CLIENT_PROTOCOL}://${process.env.CLIENT_HOST}`;

handlebars.registerHelper('getObjectKey', function () {
  let data = this.toString().split(',');
  return data[0] || '';
})

handlebars.registerHelper('getObjectValue', function () {
  let data = this.toString().split(',');
  return data[1] || '';
})

module.exports.readHTMLFile = (path) => {
  return new Promise((resolve, reject) => {
    fs.readFile(path, { encoding: 'utf-8' }, function (err, html) {
      if (err) {
        reject(err);
      }

      resolve(html);
    });
  });
};

module.exports.sendEmail = (to, html, replacements, subject) => {
  return new Promise((resolve, reject) => {
    // let transporter = nodemailer.createTransport({
    //   host: 'smtp.gmail.com',
    //   port: 465,
    //   //service: 'gmail',
    //   auth: {
    //     user: process.env.SMTP_USER,
    //     pass: process.env.SMTP_PASS
    //   },
    // });


    let template = handlebars.compile(html);
    let htmlToSend = template(replacements);
    // transporter.sendMail({
    //   to,
    //   subject,
    //   html: htmlToSend,
    // });

    //sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    const msg = {
      to: to,
      from: 'Asknanswr <contact@asknanswr.com>',
      subject: 'Asknanswer ' + subject,
      html: htmlToSend,
    };
    mailgun.messages().send(msg).then((success) => {
      console.log('Email sent to:  ' + to + 'with subject: ' + subject)
      resolve(success);
    }).catch((error) => {
      console.log(error)
    });

    // transporter.verify(function (err, success) {
    //   if (err) {
    //     reject(err);
    //   }

    //   resolve(success);
    // });
  });
};

module.exports.sendRegVerifyEmail = async (req, email, verifyToken, phone, country) => {
  const url = `${req.protocol}://${req.get('host')}/verify/${verifyToken}`;
  const html = await this.readHTMLFile(
    dirname + '/api/template/emailVerify.html'
  );
  // for sms 
  const accountVerifyTxt = await accountVerifyText(url);
  sendText(accountVerifyTxt, phone, country)
  return await this.sendEmail(email, html, { url_link, url }, "Account Verify");
};

module.exports.sendPassVerifyEmail = async (req, email, verifyToken, phone, country) => {
  const url = `${req.protocol}://${req.get(
    'host'
  )}/forgot-password/verify/${verifyToken}`;
  const html = await this.readHTMLFile(
    dirname + '/api/template/forgetPassword.html'
  );
  const sednPassVerifyTxt = sendPassVerifyText(url);
  sendText(sednPassVerifyTxt, phone, country)
  return await this.sendEmail(email, html, { url_link, url }, "Reset Password");
};

module.exports.sendProScheduledMeetEmail = async (email, data, req, phone, country) => {
  const { topic, agenda, questions, meetingId, start_url, confirmToken, timezone } = data;
  let { start_time } = data;
  if (timezone && isValidTimeZone(timezone)) {
    start_time = moment.tz(start_time, timezone).format("MM/DD/YYYY hh:mm A z");
  }
  const html = await this.readHTMLFile(
    dirname + '/api/template/providerScheduledMeeting.html'
  );
  const confirm_url = `${req.protocol}://${req.get(
    'host'
  )}/meetings/${meetingId}/${confirmToken}/confirm`;
  const cancel_url = `${req.protocol}://${req.get(
    'host'
  )}/meetings/${meetingId}/${confirmToken}/cancel`;
  const mailData = { url_link, topic, agenda, questions, meetingId, start_time, start_url, cancel_url, confirm_url };
  const sendProScheduledMeetTxt = await sendProScheduledMeetText(topic, start_time, confirm_url, cancel_url)
  sendText(sendProScheduledMeetTxt, phone, country)
  return await this.sendEmail(email, html, mailData, "Asknanswr Meeting Scheduled");
};

module.exports.sendStudScheduledMeetEmail = async (email, data, phone, country) => {
  const { topic, agenda, questions, meetingId, join_url, timezone } = data;
  let { start_time } = data;
  if (timezone && isValidTimeZone(timezone)) {
    start_time = moment.tz(start_time, timezone).format("MM/DD/YYYY hh:mm A z");
  }
  const html = await this.readHTMLFile(
    dirname + '/api/template/studentScheduledMeeting.html'
    );
    const mailData = { url_link, topic, agenda, questions, meetingId, start_time, join_url };
    sails.log('')
    const sendStudScheduledMeetTxt = await sendStudScheduledMeetText(topic, start_time, join_url)
    sendText(sendStudScheduledMeetTxt, phone, country)
  return await this.sendEmail(email, html, mailData, "Asknanswr Meeting Scheduled");
};

module.exports.sendProRescheduledMeetEmail = async (email, data, req, phone, country) => {
  const { topic, agenda, questions, meetingId, start_url, confirmToken, timezone } = data;
  let { start_time } = data;
  if (timezone && isValidTimeZone(timezone)) {
    start_time = moment.tz(start_time, timezone).format("MM/DD/YYYY hh:mm A z");
  }
  const html = await this.readHTMLFile(
    dirname + '/api/template/providerRescheduledMeeting.html'
  );
  const confirm_url = `${req.protocol}://${req.get(
    'host'
  )}/meetings/${meetingId}/${confirmToken}/confirm`;
  const cancel_url = `${req.protocol}://${req.get(
    'host'
  )}/meetings/${meetingId}/${confirmToken}/cancel`;
  const mailData = { url_link, topic, agenda, questions, meetingId, start_time, start_url, confirm_url, cancel_url };
  const sendProRescheduledMeetTxt = await sendProRescheduledMeetText(topic, start_time, confirm_url, cancel_url)
  sendText(sendProRescheduledMeetTxt, phone, country)
  return await this.sendEmail(email, html, mailData, "Asknanswr Meeting Rescheduled");
};

module.exports.sendStudRescheduledMeetEmail = async (email, data, phone, country) => {
  const { topic, agenda, questions, meetingId, join_url, timezone } = data;
  let { start_time } = data;
  if (timezone && isValidTimeZone(timezone)) {
    start_time = moment.tz(start_time, timezone).format("MM/DD/YYYY hh:mm A z");
  }
  const html = await this.readHTMLFile(
    dirname + '/api/template/studentRescheduledMeeting.html'
  );
  const mailData = { url_link, topic, agenda, questions, meetingId, start_time, join_url };
  const sendStudRescheduledMeetTxt = await sendStudRescheduledMeetText(topic, start_time, join_url)
  sendText(sendStudRescheduledMeetTxt, phone, country)
  return await this.sendEmail(email, html, mailData, "Asknanswr Meeting Rescheduled");
};

module.exports.sendProDeletedMeetEmail = async (email, data, phone, country) => {
  const { topic, agenda, questions, meetingId, timezone } = data;
  let { start_time } = data;
  if (timezone && isValidTimeZone(timezone)) {
    start_time = moment.tz(start_time, timezone).format("MM/DD/YYYY hh:mm A z");
  }
  const html = await this.readHTMLFile(
    dirname + '/api/template/providerDeletedMeeting.html'
  );
  const mailData = { url_link, topic, agenda, questions, meetingId, start_time };
  const sendProDeletedMeetTxt = await sendProDeletedMeetText(topic, start_time)
  sendText(sendProDeletedMeetTxt, phone, country)
  return await this.sendEmail(email, html, mailData, "Asknanswr Meeting Cancelled");
};

module.exports.sendStudDeletedMeetEmail = async (email, data, phone, country) => {
  const { topic, agenda, questions, meetingId, timezone } = data;
  let { start_time } = data;
  if (timezone && isValidTimeZone(timezone)) {
    start_time = moment.tz(start_time, timezone).format("MM/DD/YYYY hh:mm A z");
  }
  const html = await this.readHTMLFile(
    dirname + '/api/template/studentDeletedMeeting.html'
  );
  const mailData = { url_link, topic, agenda, questions, meetingId, start_time };
  const sendStudDeletedMeetTxt = await sendStudDeletedMeetText(topic, start_time)
  sendText(sendStudDeletedMeetTxt, phone, country)
  return await this.sendEmail(email, html, mailData, "Asknanswr Meeting Cancelled");
};

module.exports.sendStudConfirmedMeetEmail = async (email, data, phone, country) => {
  const { topic, agenda, questions, meetingId, timezone } = data;
  let { start_time } = data;
  if (timezone && isValidTimeZone(timezone)) {
    start_time = moment.tz(start_time, timezone).format("MM/DD/YYYY hh:mm A z");
  }
  const html = await this.readHTMLFile(
    dirname + '/api/template/studentConfirmedMeeting.html'
  );
  const mailData = { url_link, topic, agenda, questions, meetingId, start_time };
  const sendStudConfirmedMeetTxt = await sendStudConfirmedMeetText(topic, start_time)
  sendText(sendStudConfirmedMeetTxt, phone, country)
  return await this.sendEmail(email, html, mailData, "Asknanswr Meeting Confirmed");
};

module.exports.sendProConfirmMeetEmail = async (email, data, phone, country) => {
  const { topic, agenda, questions, meetingId, timezone, confirmToken } = data;
  let { start_time } = data;
  if (timezone && isValidTimeZone(timezone)) {
    start_time = moment.tz(start_time, timezone).format("MM/DD/YYYY hh:mm A z");
  }
  const html = await this.readHTMLFile(
    dirname + '/api/template/providerConfirmMeeting.html'
  );
  const confirm_url = `${process.env.CLIENT_PROTOCOL}://${process.env.CLIENT_HOST}/meetings/${meetingId}/${confirmToken}/confirm`;
  const cancel_url = `${process.env.CLIENT_PROTOCOL}://${process.env.CLIENT_HOST}/meetings/${meetingId}/${confirmToken}/cancel`;
  const mailData = { url_link, topic, agenda, questions, meetingId, start_time, confirm_url, cancel_url };

  const sendProConfirmMeetTTxt = await sendProConfirmMeetText(topic, start_time, confirm_url)
  sendText(sendProConfirmMeetTTxt, phone, country)
  return await this.sendEmail(email, html, mailData, "Asknanswr Confirm Meeting");
};

module.exports.sendUpcomingMeetEmail = async (email, data, phone, country) => {
  const { time_count, time_type, topic, agenda, questions, meetingId, timezone } = data;
  let { start_time } = data;
  if (timezone && isValidTimeZone(timezone)) {
    start_time = moment.tz(start_time, timezone).format("MM/DD/YYYY hh:mm A z");
  }
  const html = await this.readHTMLFile(
    dirname + '/api/template/upcomingMeeting.html'
  );

  const mailData = { url_link, time_count, time_type, topic, agenda, questions, meetingId, start_time };

  const sendUpcomingMeetTxt = await sendUpcomingMeetText(topic, start_time, confirm_url)
  sendText(sendUpcomingMeetTxt, phone, country)
  return await this.sendEmail(email, html, mailData, "Asknanswr Upcoming scheduled meeting");
};

module.exports.sendEmailAlert = async (subject, body, error) => {
  const html = await this.readHTMLFile(
    dirname + '/api/template/emailAlert.html'
  );
  const errorMsg = error.message;
  const mailData = { ...body, error: errorMsg };
  const data = Object.entries(mailData);
  return await this.sendEmail(process.env.ERROR_REPORTING_MAIL, html, { url_link, data }, subject);
};