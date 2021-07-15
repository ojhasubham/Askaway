var cron = require('node-cron');
const sails = require('sails');
const moment = require('moment');

if(process.env.IS_CRONE_ACTIVE == 'true'){
  cron.schedule('* * * * *', async () => {
    try {
      console.log('providerChangeTypeCron start');
      const zoomService = require('../services/zoomService');
      const { ZOOM_USER_BASIC, ZOOM_USER_LICENSED } = require('../codes');

      const db = sails.getDatastore().manager;

      const startDate = moment.utc().format('YYYY-MM-DDTHH:mm');
      const endDate = moment(startDate, 'YYYY-MM-DDTHH:mm').add(3, 'minutes').format('YYYY-MM-DDTHH:mm');
      console.log('startDate : ', startDate);
      console.log('endDate : ', endDate);

      const meetingsData = await meetings
        .find({ where: { 'zoomResponse.start_time': { ">=": startDate, "<=": endDate } } })
        .meta({ enableExperimentalDeepTargets: true });;
      console.log('meetingsData : ', meetingsData);

      if (meetingsData && meetingsData.length) {
        for (let i = 0; i < meetingsData.length; i++) {
          const meetingData = meetingsData[i];
          const { providerUserId } = meetingData;

          const ProviderData = await user.findOne({ id: providerUserId });

          if (ProviderData) {
            const zoomUserData = await zoomUser.findOne({ userId: providerUserId });
            if (zoomUserData && zoomUserData.zoomUserId && zoomUserData.zoomResponse.type === ZOOM_USER_BASIC) {
              const zoomLicenseUsersData = await zoomUser.find({ 'zoomResponse.type': ZOOM_USER_LICENSED, userId: { '!=': providerUserId } }).meta({ enableExperimentalDeepTargets: true });;;
              console.log('zoomLicenseUsersData : ', zoomLicenseUsersData);

              if (zoomLicenseUsersData && zoomLicenseUsersData.length) {
                for (let j = 0; j < zoomLicenseUsersData.length; j++) {
                  const zoomLicenseUserData = zoomLicenseUsersData[j];
                  const zoomUserRes = await zoomService.setUserType(zoomLicenseUserData.zoomUserId, ZOOM_USER_BASIC);
                  if (zoomUserRes) {
                    await db.collection('zoomuser').update({ userId: providerUserId }, { $set: { 'zoomResponse.type': ZOOM_USER_BASIC } });
                  }
                }
              }

              const zoomUpdateUserRes = await zoomService.setUserType(zoomUserData.zoomUserId, ZOOM_USER_LICENSED);
              if (zoomUpdateUserRes) {
                await db.collection('zoomuser').update({ userId: providerUserId }, { $set: { 'zoomResponse.type': ZOOM_USER_LICENSED } });
              }
              await zoomService.setUserCloudRecording(zoomUserData.zoomUserId);
            }
          }
        }
      }
      console.log('providerChangeTypeCron end');
    } catch (error) {
      sails.log.error('Error in provider transfer crone : ', error);
    }
  });
}