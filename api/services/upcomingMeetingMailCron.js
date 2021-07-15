
var cron = require('node-cron');
const sails = require('sails');
const moment = require('moment');

const { sendUpcomingMeetEmail } = require('./email');
const { STATUS_ACTIVE } = require('../codes');

if(process.env.IS_CRONE_ACTIVE == 'true'){
  cron.schedule('*/30 * * * *', async () => {
    try {
      const db = sails.getDatastore().manager;
      var { ObjectID } = require("sails-mongo").mongodb;
      console.log('Running send Upcoming Meeting Mail cron');

      const currentDate = moment.utc().format();
      const toDate = moment.utc().add(1, 'week').format()
      console.log('currentDate : ', currentDate);

      const meetingsData = await meetings
        .find({
          and: [
            { 'zoomResponse.start_time': { ">=": currentDate } },
            { 'zoomResponse.start_time': { "<=": toDate } },
            { status: { in: [STATUS_ACTIVE] } },
          ]
        })
        .meta({ enableExperimentalDeepTargets: true });

      if (meetingsData && meetingsData.length) {
        for (let i = 0; i < meetingsData.length; i++) {
          const meetingData = meetingsData[i];
          const { zoomResponse } = meetingData;
          const { start_time } = zoomResponse;
          const remainingHours = moment(start_time).diff(currentDate, 'hours');

          if (remainingHours) {
            let time_count = null;
            let time_type = null;
            if (remainingHours === 1) {
              time_count = 1;
              time_type = 'hour';
            } else if (remainingHours === 24) {
              time_count = 1;
              time_type = 'day';
            } else if (remainingHours === 24 * 3) {
              time_count = 3;
              time_type = 'days';
            } else if (remainingHours === 24 * 7) {
              time_count = 1;
              time_type = 'week';
            }

            if (time_count && time_type) {
              const { providerUserId, studentUserId, questions, meetingId, sentMail } = meetingData;
              const { topic, agenda } = zoomResponse;

              if (sentMail && !sentMail[time_type + time_count]) {
                const providerData = await user.findOne({ id: providerUserId });
                
                const mailData = { time_count, time_type, topic, agenda, questions, meetingId, start_time, timezone: ProviderData.timezone };
                if (providerData) {
                  await sendUpcomingMeetEmail(
                    providerData.email,
                    mailData,
                    providerData.phone,
                    providerData.country
                  );
                }

                const studentData = await user.findOne({ id: studentUserId });
                mailData.timezone = studentData.timezone;
                if (studentData) {
                  await sendUpcomingMeetEmail(
                    studentData.email,
                    mailData,
                    studentData.phone,
                    studentData.country
                  );
                }

                const newField = 'sentMail.' + time_type + time_count;
                const result = await db.collection('meetings').update({ _id: ObjectID(meetingData.id) }, { $set: { [newField]: true } });
              }
            }
          }
        }
      }
    } catch (error) {
      sails.log.error('Error in send Upcoming Meeting Mail cron : ', error);
    }
  });
}