module.exports = {
  attributes: {
    studentUserId: {
      type: 'string',
    },
    providerUserId: {
      type: 'string'
    },
    status: {
      type: 'number'
    }
  },
  datastore: 'mongodb',
};
