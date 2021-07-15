
var cron = require('node-cron');
const sails = require('sails');
const moment = require('moment');

const { sendProConfirmMeetEmail } = require('./email');
const { STATUS_PENDING } = require('../codes');

if(process.env.IS_CRONE_ACTIVE == 'true'){
  cron.schedule('*/30 * * * *', async () => {
    try {
      console.log('Running send confirm mail cron');
      const currentDate = moment.utc().format('YYYY-MM-DDTHH:mm');

      const meetingsData = await meetings
        .find({
          where: {
            'zoomResponse.start_time': { ">=": currentDate },
            status: STATUS_PENDING
          }
        })
        .meta({ enableExperimentalDeepTargets: true });;
      console.log('meetingsData : ', meetingsData);

      if (meetingsData && meetingsData.length) {
        for (let i = 0; i < meetingsData.length; i++) {
          const meetingData = meetingsData[i];
          const { providerUserId, zoomResponse, questions, meetingId, confirmToken } = meetingData;
          const { topic, agenda, start_time } = zoomResponse;

          const ProviderData = await user.findOne({ id: providerUserId });
          if (ProviderData) {
            const mailData = { topic, agenda, questions, meetingId, start_time, confirmToken, timezone: ProviderData.timezone };
            await sendProConfirmMeetEmail(
              ProviderData.email,
              mailData,
              ProviderData.phone,
              ProviderData.country
            );
          }
        }
      }
    } catch (error) {
      sails.log.error('Error in provider meeting confirm mail crone : ', error);
    }
  });
}
