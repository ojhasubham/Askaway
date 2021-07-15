/**
 * MeetingController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */
const sails = require('sails');
const db = sails.getDatastore().manager;
const moment = require('moment');

const { STATUS_DELETED, STATUS_PENDING, STATUS_ACTIVE, STUDENT, PROVIDER, PAYMENT_PENDING, PAYMENT_PAID, ZOOM_USER_BASIC,
  SCHEDULE_ERROR_1, DELETE_MEETING_ERROR_1, PROVIDER_RATING_ERROR_1, CONFIRM_MEETING_ERROR_1, DELETE_MEETING_BY_MEETINGDATA_ERROR_1,
  GET_MEETING_ERROR_1, CREATE_STRIPE_CUSTOMER_ERROR_1, GET_STRIPE_CUSTOMER_ERROR_1, CREATE_STRIPE_TOKEN_ERROR_1,
  ADD_STRIPE_CARD_ERROR_1, GET_STRIPE_CARD_ERROR_1, PROVIDER_RATING_ERROR_2, SET_STRIPE_DEFAULT_CARD_ERROR_1, DELETE_STRIPE_CARD_ERROR_1,
  GET_MEETING_HISTORY_ERROR_1, GET_UPCOMING_MEETING_ERROR_1, GET_PENDING_MEETING_RATING_ERROR_1, ADD_MEETING_RATING_ERROR_1,
  GET_PROVIDER_TRANSCTION_ERROR_1, GET_STRIPE_ACCOUNT_MEETING_ERROR_1, PROVIDER_REDEEM_BALANCE_ERROR_1, UPDATE_STRIPE_ACCOUNT_MEETING_ERROR_1,
  ADD_STRIPE_BANK_ACCOUNT_MEETING_ERROR_1, GET_STRIPE_BANK_ACCOUNT_MEETING_ERROR_1, SET_STRIPE_BANK_ACCOUNT_DEFAULT_MEETING_ERROR_1,
  DELETE_STRIPE_BANK_ACCOUNT_MEETING_ERROR_1, GET_FILEMEETING_MEDIA_ERROR_1 } = require('../codes');
const { sendProScheduledMeetEmail, sendStudScheduledMeetEmail, sendProRescheduledMeetEmail, sendStudRescheduledMeetEmail, sendProDeletedMeetEmail, sendStudDeletedMeetEmail, sendStudConfirmedMeetEmail } = require('../services/email');
const { isEmpty } = require('../validation');
const stripeService = require('../services/stripeService');
const zoomService = require('../services/zoomService');
const fileService = require('../services/fileService');
const { errorAlert } = require('../utils/userActivityLog')
const categories = require('../codes/categories');

const waitForSec = function (sec) {
  console.log("Entered waitForSec function : ", sec);
  return new Promise(resolve => {
    setTimeout(function () {
      resolve();
      console.log("call after ", sec, "sec");
    }, sec * 1000);
  });
};

const deleteMeetingByMeetRecord = async (meetingRecord) => {
  try {
    const studentData = await user.findOne({ id: meetingRecord.studentUserId });
    const providerData = await user.findOne({ id: meetingRecord.providerUserId });

  const response = await zoomService.deleteMeeting(meetingRecord.meetingId);
  if (response) {
    const updatedRecord = await meetings.updateOne({ meetingId: meetingRecord.meetingId }).set({ status: STATUS_DELETED });
    if (updatedRecord) {
      const mailData = {
        topic: meetingRecord.zoomResponse.topic,
        agenda: meetingRecord.zoomResponse.agenda,
        questions: meetingRecord.questions,
        meetingId: meetingRecord.meetingId,
        start_time: meetingRecord.zoomResponse.start_time,
        timezone: studentData.timezone
      };
      if (studentData) {
        await sendStudDeletedMeetEmail(
          studentData.email,
          mailData,
          studentData.phone,
          studentData.country,

        );
      }
      mailData.timezone = providerData.timezone
      if (providerData) {
        await sendProDeletedMeetEmail(
          providerData.email,
          mailData,
          providerData.phone,
          providerData.country
        );
      }

        return true;
      }
    }

    return false;
  } catch (error) {
    errorAlert(DELETE_MEETING_BY_MEETINGDATA_ERROR_1, meetingRecord, error);
  }
};

module.exports = {
  scheduleMeetingPage: (req, res) => {
    const { id } = req.params;
    res.view('pages/scheduleMeeting', { layout: 'dashboardLayout', id, categories, PROVIDER, STUDENT, STATUS_ACTIVE, data: {} });
  },

  studentMyAccountPage: (req, res) => {
    res.view('profile/studentMyAccount', { layout: 'dashboardLayout', categories, PROVIDER, STUDENT, STATUS_ACTIVE, data: {} });
  },

  providerMyAccountPage: (req, res) => {
    res.view('profile/providerMyAccount', { layout: 'dashboardLayout', categories, PROVIDER, STUDENT, STATUS_ACTIVE, chargePer: process.env.PROVIDER_CHARGE_PER, data: {} });
  },

  providerMeetingHistoryPage: (req, res) => {
    res.view('history/providerMeetingHistory', { layout: 'dashboardLayout', categories, PROVIDER, STUDENT, STATUS_ACTIVE, chargePer: process.env.PROVIDER_CHARGE_PER, data: {} });
  },

  studentMeetingHistoryPage: (req, res) => {
    res.view('history/studentMeetingHistory', { layout: 'dashboardLayout', categories, PROVIDER, STUDENT, PAYMENT_PAID, PAYMENT_PENDING, STATUS_ACTIVE, data: {} });
  },

  providerRatingsPage: async (req, res) => {
    try {
      const { providerId } = req.allParams()
      let { skip, limit } = req.query;

      if (providerId) {
        const providerData = await user.findOne({ id: providerId });

        if (providerData) {
          let { id: providerUserId } = providerData;
          let studentRatings = [];
          let studentRatingsData = [];

          skip = +skip && +skip || 0;
          limit = +limit && +limit || 2; // default limit 10

          let count = await meeting_taken_history.count({
            where: { providerUserId }
          });

          console.log('count : ', count);
          console.log('skip : ', skip);
          console.log('limit : ', limit);

          var meetingHistory = await meeting_taken_history.find({
            where: { providerUserId },
            skip,
            limit
          });

          if (meetingHistory && meetingHistory.length) {
            for (let j = 0; j < meetingHistory.length; j++) {
              const meetingHistoryData = meetingHistory[j];
              if (meetingHistoryData && meetingHistoryData.students && meetingHistoryData.students.length) {
                for (let k = 0; k < meetingHistoryData.students.length; k++) {
                  const studentData = meetingHistoryData.students[k];

                  if (!isEmpty(studentData.rating)) {
                    const { studentUserId } = studentData;

                    studentRatings.push(studentData.rating);
                    const _studentData = await user.findOne({ id: studentUserId });

                    if (_studentData) {
                      studentRatingsData.push({
                        ..._studentData,
                        rating: studentData.rating,
                        ratingComments: studentData.ratingComments,
                      })
                    } else {
                      studentRatingsData.push({
                        first_name: studentData.studentName || '',
                        email: studentData.studentEmail || '',
                        rating: studentData.rating,
                        ratingComments: studentData.ratingComments,
                      })
                    }
                  }
                }
              }
            }
          }

          try {
            let ratingsAvg = 0;
            let ratingsCount = studentRatings.length;
            let ratingsSum = studentRatings.reduce((a, b) => a + b, 0);
            if (ratingsCount) ratingsAvg = ratingsSum / ratingsCount;
            const ratingsData = { ratingsCount, ratingsAvg, ratings: studentRatingsData }
            return res.view('pages/providerRatings', { layout: 'dashboardLayout', provider: providerData, ratingsData, categories, PROVIDER, STUDENT, STATUS_ACTIVE, skip, limit, count, data: {} });
          } catch (error2) {
            errorAlert(PROVIDER_RATING_ERROR_2, { providerId }, error2);
          }

        }
      }
      return res.redirect('/home');
    } catch (error) {
      const { providerId } = req.allParams()
      errorAlert(PROVIDER_RATING_ERROR_1, { providerId }, error);
      sails.log.error('Error in provider ratings page : ', error);
      return res.send({
        status: false,
        message: 'Error in provider ratings page',
      });
    }
  },

  confirmMeetingPage: async (req, res) => {
    try {
      const allParams = req.allParams();
      const meetingId = +allParams.meetingId;
      const { token, action } = allParams;

      if (meetingId && token && action) {
        console.log(meetingId, token, action);
        const meetingData = await meetings.findOne({ meetingId, confirmToken: token });
        console.log('meetingData : ', meetingData);

        if (meetingData && !isEmpty(meetingData.status)) {
          const { status, studentUserId, zoomResponse, questions } = meetingData;
          if (status === STATUS_PENDING) {
            console.log('pending');
            if (action === 'confirm') {
              const updatedRecord = await meetings.updateOne({ meetingId, confirmToken: token }).set({ status: STATUS_ACTIVE });
              if (updatedRecord) {
                const studentData = await user.findOne({ id: studentUserId });
                if (studentData && zoomResponse) {
                  const { topic, agenda, start_time } = zoomResponse;
                  const mailData = {
                    topic,
                    agenda,
                    questions,
                    meetingId,
                    start_time,
                    timezone: studentData.timezone
                  };
                  await sendStudConfirmedMeetEmail(
                    studentData.email,
                    mailData,
                    studentData.phone,
                    studentData.country
                  );
                }
                return res.view('pages/confirmMeeting', {
                  layout: 'commonLayout',
                  status: true,
                  title: 'Meeting Confirmed',
                  message: 'meeting confirmed successfully.'
                });
              }
            } else if (action === 'cancel') {
              const deleteMeetRes = await deleteMeetingByMeetRecord(meetingData);
              if (deleteMeetRes) {
                return res.view('pages/confirmMeeting', {
                  layout: 'commonLayout',
                  status: true,
                  title: 'Meeting Cancelled',
                  message: 'meeting cancelled successfully.'
                });
              }
            } else {
              return res.notFound();
            }
          } else if (status === STATUS_DELETED) {
            return res.view('pages/confirmMeeting', {
              layout: 'commonLayout',
              status: true,
              title: 'Meeting Cancelled',
              message: 'meeting Already cancelled.'
            });
          } else if (status === STATUS_ACTIVE) {
            return res.view('pages/confirmMeeting', {
              layout: 'commonLayout',
              status: true,
              title: 'Meeting Confirmed',
              message: 'meeting Already confirmed.'
            });
          }
        }
      }

      return res.view('pages/confirmMeeting', {
        layout: 'commonLayout',
        status: false,
        title: 'Error!',
        message: 'meeting not found.'
      });
    } catch (error) {
      const allParams = req.allParams();
      errorAlert(CONFIRM_MEETING_ERROR_1, { allParams }, error);
      sails.log.error('Error in confirm meeting page : ', error);
      return res.send({
        status: false,
        title: 'Error!',
        message: 'Error in confirm/cancel meeting page.',
      });
    }
  },

  createScheduledMeeting: async (req, res) => {
    try {
      const { userId } = req.params;

      const userData = await user.findOne({ id: userId });
      const zoomUserData = await zoomUser.findOne({ userId });

      if (userData && zoomUserData) {
        const { topic, agenda, questions, start_time, duration, timezone, isReschedule } = req.body;
        const { zoomUserId } = zoomUserData;

        let meeting_info = {
          topic,
          start_time,
          duration,
          timezone,
          agenda
        };

        const newMeeting = await zoomService.createScheduledMeeting(zoomUserId, meeting_info);

        if (newMeeting) {
          const confirmToken = Math.random().toString(36).replace('0.', '');
          meetings.create({
            studentUserId: req.userData.id,
            providerUserId: userId,
            meetingId: newMeeting.id,
            meetingDate: moment(start_time).format("MM/DD/YYYY"),
            questions,
            zoomResponse: newMeeting,
            status: STATUS_PENDING,
            confirmToken,
          }).then(async () => {
            const mailData = { topic, agenda, questions, meetingId: newMeeting.id, start_time: newMeeting.start_time};
            if (isReschedule) {
              sendProRescheduledMeetEmail(
                userData.email,
                { ...mailData, start_url: newMeeting.start_url, confirmToken, timezone: userData.timezone },
                req,
                userData.phone,
                userData.country
                );
              sendStudRescheduledMeetEmail(
                req.userData.email,
                { ...mailData, join_url: newMeeting.join_url, timezone: req.userData.timezone },
                userData.phone,
                userData.country
              );
            } else {
              sails.log('Sending schedule meeting request to provider on email: ' + userData.email + ' and text: ' + userData.phone);
              sendProScheduledMeetEmail(
                userData.email,
                { ...mailData, start_url: newMeeting.start_url, confirmToken, timezone: userData.timezone },
                req,
                userData.phone,
                userData.country
              );
              sails.log('Sending schedule meeting request to user on email: ' + req.userData.email + ' and text: ' + req.userData.phone);
              sendStudScheduledMeetEmail(
                req.userData.email,
                { ...mailData, join_url: newMeeting.join_url, timezone: req.userData.timezone },
                userData.phone,
                userData.country
              );
            }
            res.json({
              status: true,
              meetingId: newMeeting.id,
              message: 'Meeting scheduled successfully',
            });
          })
        }
      } else {
        sails.log.error('Error in create scheduled meeting : ', 'user Not Found');
        return res.send({
          status: false,
          message: 'Error in create scheduled meeting',
        });
      }
    } catch (error) {
      errorAlert(SCHEDULE_ERROR_1, { userId: req.params.userId, ...req.body }, error);
      sails.log.error('Error in create scheduled meeting : ', error);
      return res.send({
        status: false,
        message: 'Error in create scheduled meeting',
      });
    }
  },

  deleteMeeting: async (req, res) => {
    try {
      const meetingId = +req.params.meetingId;
      const { id } = req.userData;
      const meetingData = await meetings.findOne({
        where: {
          status: { in: [STATUS_ACTIVE, STATUS_PENDING] },
          meetingId,
          or: [
            { studentUserId: id },
            { providerUserId: id },
          ],
        },
      });

      if (meetingData) {
        const deleteMeetRes = await deleteMeetingByMeetRecord(meetingData);
        if (deleteMeetRes) {
          return res.json({
            status: true,
            message: 'Meeting cancelled successfully',
          });
        }
      }

      return res.send({
        status: false,
        message: 'meeting not found.',
      });
    } catch (error) {
      errorAlert(DELETE_MEETING_ERROR_1, { meetingId: req.params.meetingId, userId: req.userData.id }, error);
      sails.log.error('Error in delete meeting : ', error);
      return res.send({
        status: false,
        message: 'Error in cancel meeting',
      });
    }
  },

  getMeetings: async (req, res) => {
    try {
      const { providerUserId } = req.params;

      meetings.find({ providerUserId, status: { in: [STATUS_ACTIVE, STATUS_PENDING] }, }).exec(async (err, result) => {
        if (err) {
          return res.send(500, { err: err });
        }

        res.status(200).json(result);
      });
    } catch (error) {
      errorAlert(GET_MEETING_ERROR_1, { providerUserId: req.params.providerUserId }, error);
      sails.log.error('Error in get meetings by provider userId : ', error);
      return res.send({
        status: false,
        message: 'Error in get meetings by provider userId',
      });
    }
  },

  createStripeCustomer: async (req, res) => {
    try {
      const { id } = req.userData;

      const userData = await user.findOne({ _id: id, status: STATUS_ACTIVE });
      if (userData) {
        const { sourceToken } = req.body;
        const { email, first_name, last_name, line1, line2, city, state, country } = userData;

        const customer = await stripeService.createCustomer({
          email,
          source: sourceToken,
          name: first_name + " " + last_name,
          address: {
            line1,
            line2,
            city,
            state,
            country,
          }
        });
        if (customer && customer.id) {
          const updateUser = await user.updateOne({ _id: id }).set({ stripeCusId: customer.id });
          if (updateUser) {
            return res.send({
              status: true,
              message: 'Payment Details added successfully.',
              stripeCusId: updateUser.stripeCusId
            });
          }
        }
      } else {
        return res.send({
          status: false,
          message: 'User not found.',
        });
      }
    } catch (error) {
      errorAlert(CREATE_STRIPE_CUSTOMER_ERROR_1, { userId: req.userData.id }, error);
      sails.log.error('Error in create stripe customer ', error);
      return res.send({
        status: false,
        message: 'Error in create stripe customer',
      });
    }
  },

  getStripeCustomer: async (req, res) => {
    try {
      const { id } = req.userData;
      const studentData = await user.findOne({ id, status: STATUS_ACTIVE });

      if (studentData) {
        const { stripeCusId } = studentData;
        if (stripeCusId) {
          const customerData = await stripeService.getCustomer(stripeCusId);
          if (customerData) {
            return res.send({
              status: true,
              data: customerData,
            });
          }
        }
      }

      return res.send({
        status: false,
        message: 'User not found',
      });
    } catch (error) {
      errorAlert(GET_STRIPE_CUSTOMER_ERROR_1, { userId: req.userData.id }, error);
      sails.log.error('Error in get stripe customer details : ', error);
      return res.send({
        status: false,
        message: 'Error in get stripe customer details',
      });
    }
  },

  createStripeToken: async (req, res) => {
    try {
      const { bank_account } = req.body;
      console.log('req.body : ', req.body);

      if (bank_account) {
        const { country, currency, account_holder_name, routing_number, account_number } = bank_account;
        const token = await stripeService.createToken({
          bank_account: {
            country,
            currency,
            account_holder_name,
            routing_number,
            account_number
          }
        });

        if (token && token.id) {
          return res.send({
            status: true,
            tokenId: token.id
          });
        } else if (token.message) {
          return res.send({
            status: false,
            message: 'Please provider valid bank details.',
            err: token.message,
            param: token.param,
          });
        }
      }

      return res.send({
        status: false,
        message: 'provider valid details.',
      });

    } catch (error) {
      errorAlert(CREATE_STRIPE_TOKEN_ERROR_1, { userId: req.userData.id, ...req.body.bank_account }, error);
      sails.log.error('Error in create stripe token ', error);
      return res.send({
        status: false,
        message: 'Error in create stripe token',
      });
    }
  },

  addStripeCustomerCard: async (req, res) => {
    try {
      const { id } = req.userData;
      const { sourceToken } = req.body;
      const studentData = await user.findOne({ id, status: STATUS_ACTIVE });

      if (studentData && sourceToken) {
        const { stripeCusId } = studentData;
        if (stripeCusId) {
          const cardData = await stripeService.addCustomerCard(stripeCusId, sourceToken);
          if (cardData && cardData.id) {
            return res.send({
              status: true,
              message: 'Card Added successfully.',
              data: cardData,
            });
          }
        } else {
          const { email, first_name, last_name, line1, line2, city, state, country } = studentData;

          const customer = await stripeService.createCustomer({
            email,
            source: sourceToken,
            name: first_name + " " + last_name,
            address: {
              line1,
              line2,
              city,
              state,
              country,
            }
          });
          if (customer && customer.id) {
            const updateUser = await user.updateOne({ _id: id }).set({ stripeCusId: customer.id });
            if (updateUser) {
              return res.send({
                status: true,
                message: 'Card Added successfully.',
                stripeCusId: updateUser.stripeCusId,
                stripeCustomer: customer
              });
            }
          }
        }
      }

      return res.send({
        status: false,
        message: 'User not found',
      });
    } catch (error) {
      errorAlert(ADD_STRIPE_CARD_ERROR_1, { userId: req.userData.id }, error);
      sails.log.error('Error in add stripe customer card details : ', error);
      return res.send({
        status: false,
        message: 'Error in add stripe customer card details',
      });
    }
  },

  getStripeCustomerCards: async (req, res) => {
    try {
      const { id } = req.userData;
      const studentData = await user.findOne({ id, status: STATUS_ACTIVE });

      if (studentData) {
        const { stripeCusId } = studentData;
        if (stripeCusId) {
          const cardsData = await stripeService.getCustomerAllCards(stripeCusId);
          if (cardsData && cardsData.data) {
            return res.send({
              status: true,
              data: cardsData.data,
            });
          }
        }
      }

      return res.send({
        status: false,
        message: 'User not found',
      });
    } catch (error) {
      errorAlert(GET_STRIPE_CARD_ERROR_1, { userId: req.userData.id }, error);
      sails.log.error('Error in get stripe customer all cards details : ', error);
      return res.send({
        status: false,
        message: 'Error in get stripe customer all cards details',
      });
    }
  },

  setDefaultStripeCustomerCard: async (req, res) => {
    try {
      const { id } = req.userData;
      const { cardId } = req.body;
      const studentData = await user.findOne({ id, status: STATUS_ACTIVE });

      if (studentData && cardId) {
        const { stripeCusId } = studentData;
        if (stripeCusId) {
          const customer_info = {
            default_source: cardId // to set card as default
          };
          const customerData = await stripeService.updateCustomer(stripeCusId, customer_info);
          if (customerData && customerData.id) {
            return res.send({
              status: true,
              message: 'Card Updated successfully.',
              data: customerData,
            });
          }
        }
      }

      return res.send({
        status: false,
        message: 'User not found',
      });
    } catch (error) {
      errorAlert(SET_STRIPE_DEFAULT_CARD_ERROR_1, { userId: req.userData.id }, error);
      sails.log.error('Error in set stripe customer card as default : ', error);
      return res.send({
        status: false,
        message: 'Error in set stripe customer card as default.',
      });
    }
  },

  deleteStripeCustomerCard: async (req, res) => {
    try {
      const { id } = req.userData;
      const { cardId } = req.body;
      const studentData = await user.findOne({ id, status: STATUS_ACTIVE });

      if (studentData && cardId) {
        const { stripeCusId } = studentData;
        if (stripeCusId) {
          const cardData = await stripeService.deleteCustomerCard(stripeCusId, cardId);
          if (cardData && cardData.id) {
            return res.send({
              status: true,
              message: 'Card Deleted successfully.',
              data: cardData,
            });
          }
        }
      }

      return res.send({
        status: false,
        message: 'User not found',
      });
    } catch (error) {
      errorAlert(DELETE_STRIPE_CARD_ERROR_1, { userId: req.userData.id }, error);
      sails.log.error('Error in delete stripe customer card details : ', error);
      return res.send({
        status: false,
        message: 'Error in delete stripe customer card details',
      });
    }
  },

  zoomWebhookMeetings: async (req, res) => {
    const { event } = req.body;
    switch (event) {
      case 'meeting.ended':
        try {
          const meetingId = +req.body.payload.object.id;
          const { host_id, start_time, timezone, uuid } = req.body.payload.object;
          const minChargeDuration = 15;
          let charges = [];

          if (meetingId) {
            console.log('meetingId : ', meetingId);
            console.log('req.body : ', req.body);

            const meeting = await meetings.findOne({ meetingId });
            const { providerUserId } = meeting;

            const provider = await user.findOne({ _id: providerUserId });
            const { rate, currency, first_name, last_name, email: providerEmail } = provider;
            console.log('rate : ', rate);

            await waitForSec(30);
            console.log('after wait for function call');

            const reportMeetRes = await zoomService.reportMeetingParticipants(meetingId);
            console.log('reportMeetRes : ', meetingId, reportMeetRes);

            if (reportMeetRes && reportMeetRes.participants && reportMeetRes.participants.length) {
              const providerHistoryData = {
                meetingId,
                providerUserId,
                rate,
                currency,
                topic: meeting.zoomResponse.topic,
                start_time,
                timezone,
                uuid,
                duration: req.body.payload.object.duration,
              }

              const meetingHistoryData = {
                meetingId,
                providerUserId,
                topic: meeting.zoomResponse.topic,
                host_id,
                start_time,
                timezone,
                uuid,
                duration: req.body.payload.object.duration,
              }

              let participants = reportMeetRes.participants.map(item => {
                return {
                  email: item.user_email,
                  duration: item.duration,
                  join_time: item.join_time,
                }
              });
              participants = participants.filter(item => item.email !== provider.email);

              let students = [];
              for (let i = 0; i < participants.length; i++) {
                const participant = participants[i];
                if (students.some(st => st.email === participant.email)) {
                  const index = students.findIndex(std => std.email === participant.email);

                  students[index] = {
                    ...students[index],
                    duration: students[index].duration + participant.duration
                  }
                } else {
                  const studentData = await user.findOne({ email: participant.email });
                  console.log('studentData : ', studentData);

                  if (studentData) {
                    students.push({
                      ...participant,
                      studentUserId: studentData.id,
                      stripeCusId: studentData.stripeCusId,
                      studentName: studentData.first_name + ' ' + studentData.last_name,
                      studentEmail: studentData.email
                    });
                  }
                }
              }
              console.log('students : ', students);

              for (let i = 0; i < students.length; i++) {
                const stud = students[i];
                const duration = Math.round(stud.duration / 60);
                const chargeDuration = stud.duration >= 60 && duration > minChargeDuration ? duration : minChargeDuration || 0;
                const amount = +((rate / 60) * chargeDuration).toFixed(2);

                if (chargeDuration) {
                  const chargeData = {
                    meetingId,
                    stripeCusId: stud.stripeCusId,
                    duration,
                    chargeDuration,
                    currency,
                    rate,
                    amount,
                    studentUserId: stud.studentUserId,
                    studentName: stud.studentName,
                    studentEmail: stud.email,
                    providerName: first_name + ' ' + last_name,
                    providerEmail,
                    providerUserId,
                    topic: meeting.zoomResponse.topic,
                    start_time,
                    timezone,
                    uuid
                  };

                  const description = `For Meeting : ${meeting.zoomResponse.topic}, Duration : ${duration} minutes, hourly rate : ${currency} ${rate}`;
                  const payment_info = { amount, currency, description, customer: stud.stripeCusId };
                  const chargeResponse = await stripeService.createCharge(payment_info);

                  if (chargeResponse && chargeResponse.id) {
                    chargeData.chargeId = chargeResponse.id;
                    if (chargeResponse.paid) {
                      chargeData.paymentStatus = PAYMENT_PAID;
                    } else {
                      chargeData.paymentStatus = PAYMENT_PENDING;
                    }
                  }
                  charges.push(chargeData);
                }
              }
              if (host_id) {
                const zoomUserTypeChangeRes = await zoomService.setUserType(host_id, ZOOM_USER_BASIC);
                if (zoomUserTypeChangeRes) {
                  await db.collection('zoomuser').update({ userId: providerUserId }, { $set: { 'zoomResponse.type': ZOOM_USER_BASIC } });
                  console.log('zoom User ', host_id, ' set to basic');
                }
              }

              let providerAmount = 0;
              let studentsChargeDuration = 0;
              let providerStudentsData = [];

              charges.forEach(chargeData => {
                providerStudentsData.push({
                  studentUserId: chargeData.studentUserId,
                  studentName: chargeData.studentName,
                  studentEmail: chargeData.studentEmail,
                })
                providerAmount += chargeData.amount;
                studentsChargeDuration += chargeData.chargeDuration;
              });

              const providerAddPaymentData = {
                amount: providerAmount,
                rate: provider.rate,
                studentsChargeDuration,
                meetingId,
              }
              await db.collection('providertransactions').update({ userId: providerUserId }, { $push: { paymentAdded: providerAddPaymentData } });
              await db.collection('providertransactions').update({ userId: providerUserId }, { $inc: { balance: providerAmount } });

              meetingHistoryData.students = charges;
              meetingHistoryData.totalStudents = charges.length;

              providerHistoryData.balanceAdded = providerAmount
              providerHistoryData.totalStudents = charges.length;
              providerHistoryData.students = providerStudentsData

              await meeting_taken_history.create(meetingHistoryData);
              await student_meeting_taken_history.createEach(charges);
              await provider_meeting_given_history.create(providerHistoryData);
            }
          }
          console.log('charges : ', charges);
          res.status(200).json();
        } catch (error) {
          sails.log.error('Error in zoom Webhook Meeting end', error);
          return res.send({
            status: false,
            message: 'Error in zoom Webhook Meeting end',
          });
        }
        break;

      default:
        break;
    }
  },

  zoomWebhookRecordings: async (req, res) => {
    const { event } = req.body;
    switch (event) {
      case 'recording.completed':
        try {
          const meetingId = +req.body.payload.object.id;
          console.log('meetingId : ', meetingId);

          if (meetingId) {
            const { uuid } = req.body.payload.object;
            const { recording_files } = req.body.payload.object;

            if (recording_files && recording_files.length) {
              let access_token = null;
              let fileData = {};

              const { download_token } = req.body;
              if (download_token) {
                access_token = download_token;
              } else {
                access_token = zoomService.getJwtToken();
              }

              for (let i = 0; i < recording_files.length; i++) {
                const recording = recording_files[i];
                const { download_url, file_type, recording_type } = recording;
                const url = download_url + '?access_token=' + access_token;
                const data = {};
                let fileType = '.mp4';

                if (file_type === 'M4A') {
                  fileType = '.mp3';
                } else if (file_type === 'CHAT') {
                  fileType = '.txt';
                }

                const fileName = Date.now() + '-' + meetingId + fileType;
                console.log('fileName : ', fileName);

                if (recording_type === 'shared_screen_with_gallery_view') {
                  data.video = fileName;
                } else if (recording_type === 'audio_only') {
                  data.audio = fileName;
                } else if (recording_type === 'chat_file') {
                  data.chat = fileName;
                } else {
                  continue;
                }

                const saveFileRes = await fileService.downloadAndSaveFile(url, "meeting_media", fileName);
                await waitForSec(3);
                if (saveFileRes) {
                  fileData = { ...fileData, ...data };
                }
              }

              if (!isEmpty(fileData)) {
                fileData.uuid = uuid;
                await db.collection('meetings').update({ meetingId }, { $push: { recordings: fileData } });
                await db.collection('meeting_taken_history').update({ uuid }, { $set: { recordings: fileData } });
                await db.collection('provider_meeting_given_history').update({ uuid }, { $set: { recordings: fileData } });
                await db.collection('student_meeting_taken_history').updateMany({ uuid }, { $set: { recordings: fileData } });
              }
            }
          }

          res.status(200).json();
        } catch (error) {
          sails.log.error('Error in zoom Webhook Recordings completed', error);
          return res.send({
            status: false,
            message: 'Error in zoom Webhook Recordings completed',
          });
        }
        break;

      default:
        break;
    }
  },

  getMeetingHistory: async (req, res) => {
    try {
      const { id, role } = req.userData;
      let meetingHistoryData = [];

      if (role === PROVIDER) {
        const meetingHistory = await provider_meeting_given_history.find({ providerUserId: id });
        if (meetingHistory) {
          meetingHistoryData = meetingHistory;
        }
      } else if (role === STUDENT) {
        const meetingHistory = await student_meeting_taken_history.find({ studentUserId: id });
        if (meetingHistory) {
          meetingHistoryData = meetingHistory;
        }
      }

      console.log('meetingHistoryData : ', meetingHistoryData);
      return res.send({
        status: true,
        data: meetingHistoryData,
      });
    } catch (error) {
      errorAlert(GET_MEETING_HISTORY_ERROR_1, { userId: req.userData.id, role: req.userData.role }, error);
      sails.log.error('Error in get meeting history : ', error);
      return res.send({
        status: false,
        message: 'Error in get meeting history',
      });
    }
  },

  getUpcomingMeetings: async (req, res) => {
    try {
      const { id, role } = req.userData;
      const currentDate = moment.utc().format('YYYY-MM-DDTHH:mm');
      console.log('currentDate : ', currentDate);
      const meetingsWhere = {
        'zoomResponse.start_time': { ">=": currentDate },
        status: { in: [STATUS_ACTIVE, STATUS_PENDING] }
      };

      if (role === PROVIDER) {
        meetingsWhere.providerUserId = id;
      } else if (role === STUDENT) {
        meetingsWhere.studentUserId = id;
      }

      const meetingsData = await meetings
        .find({ where: meetingsWhere })
        .meta({ enableExperimentalDeepTargets: true });;

      return res.send({
        status: true,
        data: meetingsData,
      });
    } catch (error) {
      errorAlert(GET_UPCOMING_MEETING_ERROR_1, { userId: req.userData.id, role: req.userData.role }, error);
      sails.log.error('Error in get upcoming meetings : ', error);
      return res.send({
        status: false,
        message: 'Error in get upcoming meetings.',
      });
    }
  },

  getPendingRatingMeetings: async (req, res) => {
    try {
      const { id, role } = req.userData;
      const meetingsWhere = {};

      if (role === PROVIDER) {
        meetingsWhere['rating'] = { $exists: false };
        meetingsWhere['providerUserId'] = id;
      } else if (role === STUDENT) {
        meetingsWhere['students.rating'] = { $exists: false };
        meetingsWhere['students.studentUserId'] = id;
      }

      const meetingsData = await db.collection('meeting_taken_history').find(meetingsWhere).toArray();

      return res.send({
        status: true,
        data: meetingsData,
      });
    } catch (error) {
      errorAlert(GET_PENDING_MEETING_RATING_ERROR_1, { userId: req.userData.id, role: req.userData.role }, error);
      sails.log.error('Error in get pending ratings meetings : ', error);
      return res.send({
        status: false,
        message: 'Error in get pending ratings meetings.',
      });
    }
  },

  addMeetingRating: async (req, res) => {
    try {
      const { id, role } = req.userData;
      const { meetingId } = req.allParams();
      const { rating, ratingComments } = req.body;

      let meetingsWhere = { meetingId: +meetingId };
      let meetingNewData = {};

      if (role === PROVIDER) {
        meetingsWhere = {
          '$and': [
            { 'meetingId': +meetingId },
            { 'rating': { $exists: false } },
            { 'providerUserId': id },
          ],
        };
        meetingNewData = {
          '$set': { rating, ratingComments }
        }
      } else if (role === STUDENT) {
        meetingsWhere = {
          '$and': [
            { 'meetingId': +meetingId },
            { 'students.rating': { $exists: false } },
            { 'students.studentUserId': id },
          ],
        };
        meetingNewData = {
          '$set': {
            'students.$.rating': rating,
            'students.$.ratingComments': ratingComments
          }
        }
      }

      const meetingsData = await db.collection('meeting_taken_history').update(meetingsWhere, meetingNewData);

      if (meetingsData && meetingsData.result && meetingsData.result.nModified > 0) {
        return res.send({
          status: true,
          message: 'Meeting rating submitted successfully.',
        });
      }

      return res.send({
        status: false,
        message: 'Meeting not found.',
      });
    } catch (error) {
      errorAlert(ADD_MEETING_RATING_ERROR_1, { userId: req.userData.id, role: req.userData.role, ...req.body, meetingId: req.params.meetingId }, error);
      sails.log.error('Error in get pending ratings meetings : ', error);
      return res.send({
        status: false,
        message: 'Error in get pending ratings meetings.',
      });
    }
  },

  getProviderTransactions: async (req, res) => {
    try {
      const { id } = req.userData;
      const providerData = await providerTransactions.findOne({ userId: id });

      if (providerData) {
        return res.send({
          status: true,
          data: providerData,
        });
      }

      return res.send({
        status: true,
        message: 'No transactions found',
      });
    } catch (error) {
      errorAlert(GET_PROVIDER_TRANSCTION_ERROR_1, { userId: req.userData.id }, error);
      sails.log.error('Error in get Provider transactions : ', error);
      return res.send({
        status: false,
        message: 'Error in get Provider transactions',
      });
    }
  },

  getStripeAccount: async (req, res) => {
    try {
      const { id } = req.userData;
      const providerData = await user.findOne({ id });

      if (providerData) {
        if (providerData.stripeAccId) {
          const accountData = await stripeService.getAccount(providerData.stripeAccId);
          return res.send({
            status: true,
            data: accountData,
          });
        } else {
          return res.send({
            status: true,
            message: 'Stripe Account not found',
          });
        }
      }

      return res.send({
        status: false,
        message: 'User not found',
      });
    } catch (error) {
      errorAlert(GET_STRIPE_ACCOUNT_MEETING_ERROR_1, { userId: req.userData.id }, error);
      sails.log.error('Error in get stripe account : ', error);
      return res.send({
        status: false,
        message: 'Error in get stripe account',
      });
    }
  },

  providerRedeemBalance: async (req, res) => {
    try {
      const chargePer = +process.env.PROVIDER_CHARGE_PER;
      const minAmount = 10;
      const { id } = req.userData;
      const amount = +req.body.amount;
      const providerData = await user.findOne({ id, status: STATUS_ACTIVE });
      const providerTransaction = await providerTransactions.findOne({ userId: id });

      if (providerData && providerTransaction) {
        const { stripeAccId, currency } = providerData;
        if (stripeAccId) {
          let netAmount = 0;
          let charge = 0;
          if (!amount || !Number.isInteger(amount)) {
            return res.send({
              status: false,
              message: 'Invalid Amount provided.',
            });
          }
          if (amount < minAmount) {
            return res.send({
              status: false,
              message: 'Amount must be greater than or equal to 10',
            });
          }
          if (providerTransaction.balance >= amount) {
            charge = +(amount * chargePer / 100).toFixed(20);
            netAmount = +(amount - charge).toFixed(20);
          } else {
            return res.send({
              status: false,
              message: 'Invalid or Insufficient balance provided',
            });
          }

          const transfer_info = {
            amount: netAmount,
            currency: currency,
            destination: stripeAccId,
            description: `Balance redemption of ${currency} ${amount} with charge %${chargePer} net amount ${netAmount}`
          };
          const transferData = await stripeService.createTransfer(transfer_info);
          if (transferData) {
            if (transferData.id) {
              const providerRedeemBalanceData = {
                netAmount,
                balance: amount,
                currency,
                chargePer,
                charge,
                transferId: transferData.id
              }
              await db.collection('providertransactions').update({ userId: id }, { $push: { paymentRedeem: providerRedeemBalanceData } });
              await db.collection('providertransactions').update({ userId: id }, { $inc: { balance: -amount } });
              return res.send({
                status: true,
                data: transferData,
              });
            }
          }

          return res.send({
            status: false,
            message: 'Unable to transfer amount, Please try again.',
          });
        } else {
          return res.send({
            status: true,
            message: 'Stripe Account not found',
          });
        }
      }

      return res.send({
        status: false,
        message: 'User not found',
      });
    } catch (error) {
      errorAlert(PROVIDER_REDEEM_BALANCE_ERROR_1, { userId: req.userData.id, amount: req.body.amount }, error);
      sails.log.error('Error in create transfer : ', error);
      return res.send({
        status: false,
        message: 'Error in create transfer',
      });
    }
  },

  updateStripeAccount: async (req, res) => {
    try {
      const { id } = req.userData;
      const providerData = await user.findOne({ id, status: STATUS_ACTIVE });

      if (providerData) {
        const { stripeAccId } = providerData;
        if (stripeAccId) {
          const { city, line1, line2, postal_code, dob, phone, website, state } = providerData;
          const account_info = {
            url: website,
            phone,
            postal_code,
            dob,
            line1,
            line2,
            city,
            state,
          }
          const stripeAccount = await stripeService.updateAccount(stripeAccId, account_info);
          if (stripeAccount.id) {
            return res.send({
              status: true,
              message: 'Account Updated successfully.',
              data: stripeAccount,
            });
          } else if (stripeAccount.message) {
            return res.json({
              status: false,
              message: stripeAccount.message,
            });
          }
        }
      }

      return res.send({
        status: false,
        message: 'User not found',
      });
    } catch (error) {
      sails.log.error('Error in update stripe account : ', error);
      errorAlert(UPDATE_STRIPE_ACCOUNT_MEETING_ERROR_1, { userId: req.userData.id }, error);
      return res.send({
        status: false,
        message: 'Error in update stripe account',
      });
    }
  },

  addStripeAccountBank: async (req, res) => {
    try {
      const { id } = req.userData;
      const { bankAccountToken } = req.body;
      const providerData = await user.findOne({ id, status: STATUS_ACTIVE });

      if (providerData && bankAccountToken) {
        const { stripeAccId } = providerData;
        if (stripeAccId) {
          const accountData = await stripeService.addBankAccount(stripeAccId, bankAccountToken);
          if (accountData && accountData.id) {
            return res.send({
              status: true,
              message: 'Bank Account Added successfully.',
              data: accountData,
            });
          }
        } else {
          const { country, email, city, line1, line2, postal_code, dob, id_number, phone, website, state, first_name, last_name } = providerData;
          const account_info = {
            country,
            email,
            city,
            line1,
            line2,
            postal_code,
            dob,
            id_number,
            phone,
            url: website || 'www.SUPP.com',
            state,
            first_name,
            last_name,
            sourceToken: bankAccountToken,
            clientIp: req.ip
          }
          const stripeAccount = await stripeService.createAccount(account_info);
          if (stripeAccount.id) {
            await user.updateOne({ id }).set({ stripeAccId: stripeAccount.id });
            return res.send({
              status: true,
              message: 'Bank Account Added successfully.',
              data: stripeAccount,
            });
          } else if (stripeAccount.message) {
            console.log('stripeAccount : ', stripeAccount.code);
            const { code, param } = stripeAccount;
            if (code === 'url_invalid') {
              stripeAccount.message = 'Invalid website provided.'
            }
            if (param === 'individual[dob][day]' || param === 'individual[dob][month]' || param === 'individual[dob][year]') {
              stripeAccount.message = 'Invalid Date of Birth provided.'
            }

            return res.json({
              status: false,
              message: stripeAccount.message,
              profileError: true
            });
          }
        }
      }

      return res.send({
        status: false,
        message: 'User not found',
      });
    } catch (error) {
      sails.log.error('Error in add stripe account bank details : ', error);
      errorAlert(ADD_STRIPE_BANK_ACCOUNT_MEETING_ERROR_1, { userId: req.userData.id }, error);
      return res.send({
        status: false,
        message: 'Error in add stripe account bank details',
      });
    }
  },

  getStripeAccountBanks: async (req, res) => {
    try {
      const { id } = req.userData;
      const providerData = await user.findOne({ id, status: STATUS_ACTIVE });

      if (providerData) {
        const { stripeAccId } = providerData;
        if (stripeAccId) {
          const bankAccountsData = await stripeService.getAllBankAccount(stripeAccId);
          if (bankAccountsData && bankAccountsData.data) {
            return res.send({
              status: true,
              data: bankAccountsData.data,
            });
          }
        }
      }

      return res.send({
        status: false,
        message: 'User not found',
      });
    } catch (error) {
      sails.log.error('Error in get stripe account all bank details : ', error);
      errorAlert(GET_STRIPE_BANK_ACCOUNT_MEETING_ERROR_1, req.userData, error);
      return res.send({
        status: false,
        message: 'Error in add stripe account all bank details',
      });
    }
  },

  setDefaultStripeAccountBank: async (req, res) => {
    try {
      const { id } = req.userData;
      const { bankAccountId } = req.body;
      const providerData = await user.findOne({ id, status: STATUS_ACTIVE });

      if (providerData && bankAccountId) {
        const { stripeAccId } = providerData;
        if (stripeAccId) {
          const bank_account_info = {
            default_for_currency: true // to set as default bank account
          };
          const accountData = await stripeService.updateBankAccount(stripeAccId, bankAccountId, bank_account_info);
          if (accountData && accountData.id) {
            return res.send({
              status: true,
              message: 'Bank Account Updated successfully.',
              data: accountData,
            });
          }
        }
      }

      return res.send({
        status: false,
        message: 'User not found',
      });
    } catch (error) {
      sails.log.error('Error in update stripe account bank details : ', error);
      errorAlert(SET_STRIPE_BANK_ACCOUNT_DEFAULT_MEETING_ERROR_1, { userId: req.userData.id, ...req.body }, error);
      return res.send({
        status: false,
        message: 'Error in update stripe account bank details',
      });
    }
  },

  deleteStripeAccountBank: async (req, res) => {
    try {
      const { id } = req.userData;
      const { bankAccountId } = req.body;
      const providerData = await user.findOne({ id, status: STATUS_ACTIVE });

      if (providerData && bankAccountId) {
        const { stripeAccId } = providerData;
        if (stripeAccId) {
          const accountData = await stripeService.deleteBankAccount(stripeAccId, bankAccountId);
          if (accountData && accountData.id) {
            return res.send({
              status: true,
              message: 'Bank Account Deleted successfully.',
              data: accountData,
            });
          }
        }
      }

      return res.send({
        status: false,
        message: 'User not found',
      });
    } catch (error) {
      sails.log.error('Error in delete stripe account bank details : ', error);
      errorAlert(DELETE_STRIPE_BANK_ACCOUNT_MEETING_ERROR_1, { userId: req.userData.id, ...req.body }, error);
      return res.send({
        status: false,
        message: 'Error in delete stripe account bank details',
      });
    }
  },

  getFileMeetingMedia: async (req, res) => {
    try {
      let { filename } = req.allParams();
      console.log('filename : ', filename);

      if (filename) {
        const filePath = await fileService.getFile('meeting_media', filename);
        if (filePath) {
          return res.sendFile(filePath);
        }
      }

      return res.status(404).send({
        status: false,
        message: 'file not found.',
      });
    } catch (error) {
      sails.log.error('Error in get file of meeting media : ', error);
      errorAlert(GET_FILEMEETING_MEDIA_ERROR_1, { ...req.params }, error);
      return res.status(500).send({
        status: false,
        message: 'Error in get file of meeting media',
      });
    }
  },
};
