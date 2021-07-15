module.exports = {
  attributes: {
    meetingId: {
      type: 'number'
    },
    providerUserId: {
      type: 'string'
    },
    rate: {
      type: 'number'
    },
    currency: {
      type: 'string'
    },
    topic: {
      type: 'string'
    },
    start_time: {
      type: 'string'
    },
    duration: {
      type: 'number'
    },
    balanceAdded: {
      type: 'number'
    }
  },
  datastore: 'mongodb',
};
