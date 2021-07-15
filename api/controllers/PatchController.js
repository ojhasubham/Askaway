/**
 * PatchController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */
const sails = require('sails');
const moment = require('moment');
const cache = require('memory-cache');

const stripeService = require('../services/stripeService');
const zoomService = require('../services/zoomService');
const { sendProConfirmMeetEmail, sendUpcomingMeetEmail } = require('../services/email');
const { ZOOM_USER_BASIC, ZOOM_USER_LICENSED, STATUS_PENDING, STATUS_ACTIVE, PROVIDER } = require('../codes');

const db = sails.getDatastore().manager;
var { ObjectID } = require("sails-mongo").mongodb;

module.exports = {
  providerTransfer: async (req, res) => {
    try {
      const chargePer = +process.env.PROVIDER_CHARGE_PER;

      const providersData = await providerTransactions.find({ balance: { '>=': 1 } });
      console.log('providersData : ', providersData);

      for (let index = 0; index < providersData.length; index++) {
        const providerData = providersData[index];
        const provider = await user.findOne({ id: providerData.userId });
        console.log('provider.id', provider.id);

        if (provider && provider.stripeAccId) {
          const { stripeAccId } = provider;
          const stripeAccount = await stripeService.getAccount(stripeAccId);

          if (stripeAccount && stripeAccount.payouts_enabled && stripeAccount.country === 'US' && stripeAccount.capabilities && stripeAccount.capabilities.transfers === "active") {
            console.log('stripeAccount.id: ', stripeAccount.id);

            const { default_currency } = stripeAccount;
            const { balance } = providerData;
            const charge = +(balance * chargePer / 100).toFixed(2);
            const netAmount = +(balance - charge).toFixed(2);

            const transfer_info = {
              amount: netAmount,
              currency: default_currency,
              destination: stripeAccId,
              description: `Balance transferred of ${default_currency} ${netAmount}`
            };
            const transferData = await stripeService.createTransfer(transfer_info);
            if (transferData) {
              console.log('transferData : ', transferData);

              if (transferData.id) {
                const providerTransferData = {
                  netAmount,
                  balance,
                  currency: default_currency,
                  chargePer,
                  charge,
                  transferId: transferData.id
                }
                await db.collection('providertransactions').update({ userId: providerData.userId }, { $push: { paymentRedeem: providerTransferData } });
                await db.collection('providertransactions').update({ userId: providerData.userId }, { $inc: { balance: -balance } });
              }
            }
          }
        }
      }

      res.send({
        status: true,
        message: 'cron ran successfully.',
      });
    } catch (error) {
      sails.log.error('Error in provider transfer crone : ', error);
      return res.send({
        status: false,
        message: 'Error in provider transfer crone.',
      });
    }
  },

  providerUserTypeChange: async (req, res) => {
    try {
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

          const providerData = await user.findOne({ id: providerUserId });

          if (providerData) {
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

      res.send({
        status: true,
        message: 'cron ran successfully.',
      });
    } catch (error) {
      sails.log.error('Error in provider user type change : ', error);
      return res.send({
        status: false,
        message: 'Error in provider user type change.',
      });
    }
  },

  sendMeetingConfirmMail: async (req, res) => {
    try {
      const currentDate = moment.utc().format('YYYY-MM-DDTHH:mm');
      console.log('currentDate : ', currentDate);

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

          const providerData = await user.findOne({ id: providerUserId });
          if (providerData) {
            const mailData = { topic, agenda, questions, meetingId, start_time, confirmToken };
            await sendProConfirmMeetEmail(
              providerData.email,
              mailData,
              providerData.phone,
              providerData.country
            );
          }
        }
      }

      res.send({
        status: true,
        message: 'cron ran successfully.',
      });
    } catch (error) {
      sails.log.error('Error in provider send confirm mail : ', error);
      return res.send({
        status: false,
        message: 'Error in provider send confirm mail.',
      });
    }
  },

  sendUpcomingMeetingMail: async (req, res) => {
    try {
      console.log('sendUpcomingMeetingMail cron started');

      const currentDate = moment.utc().format();
      const toDate = moment.utc().add(1, 'week').format()

      console.log('currentDate : ', currentDate);
      console.log('toDate : ', toDate);

      const meetingsData = await meetings
        .find({
          and: [
            { 'zoomResponse.start_time': { ">=": currentDate } },
            { 'zoomResponse.start_time': { "<=": toDate } },
            { status: { in: [STATUS_ACTIVE] } },
          ]
        })
        .meta({ enableExperimentalDeepTargets: true });
      console.log('meetingsData : ', meetingsData);

      if (meetingsData && meetingsData.length) {
        for (let i = 0; i < meetingsData.length; i++) {
          const meetingData = meetingsData[i];

          const { zoomResponse } = meetingData;
          const { start_time } = zoomResponse;
          const remainingHours = moment(start_time).diff(currentDate, 'hours');

          console.log('remainingHours : ', remainingHours);


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

            console.log('time_count : ', time_count);
            console.log('time_type : ', time_type);

            if (time_count && time_type) {
              const { providerUserId, studentUserId, questions, meetingId, sentMail } = meetingData;
              const { topic, agenda } = zoomResponse;

              console.log('sentMail && !sentMail[time_type + time_count] : ', sentMail && !sentMail[time_type + time_count]);


              if (sentMail && !sentMail[time_type + time_count]) {
                const mailData = { time_count, time_type, topic, agenda, questions, meetingId, start_time };

                const providerData = await user.findOne({ id: providerUserId });
                if (providerData) {
                  await sendUpcomingMeetEmail(
                    providerData.email,
                    mailData,
                    providerData.phone,
                    providerData.country
                  );
                }

                const studentData = await user.findOne({ id: studentUserId });
                if (studentData) {
                  await sendUpcomingMeetEmail(
                    studentData.email,
                    mailData,
                    studentData.phone,
                    studentData.country
                  );
                }

                const newField = 'sentMail.' + time_type + time_count;
                console.log('newField : ', newField);

                const result = await db.collection('meetings').update({ _id: ObjectID(meetingData.id) }, { $set: { [newField]: true } });
                console.log('result : ', result);
                console.log('meetingData.id : ', meetingData.id);

              }
            }
          }
        }
      }

      res.send({
        status: true,
        message: 'cron ran successfully.',
      });
    } catch (error) {
      sails.log.error('Error in send upcoming meeting mail : ', error);
      return res.send({
        status: false,
        message: 'Error in send upcoming meeting mail.',
      });
    }
  },

  saveProvidersList: async (req, res) => {
    try {
      console.log('saveProvidersList cron started');
      const providers = await user.find({
        where: {
          role: PROVIDER,
          status: STATUS_ACTIVE,
        },
      });
      console.log('providers : ', providers);
      if (providers) {
        cache.put('providersList', providers.map(item => {
          return {
            full_name: item.full_name,
            email: item.email,
            keywords: item.keywords,
            cat: item.cat && item.cat.map(ca => ca.name).join(','),
            subCat: item.subCat && item.subCat.map(sca => sca.name).join(','),
          }
        }));
      }

      res.send({
        status: true,
        message: 'cron ran successfully.',
      });
    } catch (error) {
      sails.log.error('Error in save Providers List : ', error);
      return res.send({
        status: false,
        message: 'Error in save Providers List.',
      });
    }
  },
};
