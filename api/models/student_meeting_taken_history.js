module.exports = {
  attributes: {
    studentUserId: {
      type: 'string',
    },
    providerUserId: {
      type: 'string'
    },
    stripeCusId: {
      type: 'string'
    },
    chargeId: {
      type: 'string'
    },
    currency: {
      type: 'string'
    },
    amount: {
      type: 'number'
    },
    meetingId: {
      type: 'number'
    },
    duration: {
      type: 'number'
    },
    chargeDuration: {
      type: 'number'
    },
    rate: {
      type: 'number'
    },
    paymentStatus: {
      type: 'number'
    },
    topic: {
      type: 'string'
    },
    start_time: {
      type: 'string'
    },
  },
  datastore: 'mongodb',
};
