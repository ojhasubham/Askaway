module.exports = {
  attributes: {
    meetingId: {
      type: 'number'
    },
    providerUserId: {
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
  },
  datastore: 'mongodb',
};
